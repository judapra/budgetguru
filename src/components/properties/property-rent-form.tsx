
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category, PropertyRent } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formSchema = z.object({
  amount: z.coerce.number().min(0, 'O valor deve ser positivo ou zero.'),
  details: z.string().optional(),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  account: z.string().optional(),
  discounts: z.coerce.number().optional().default(0),
  additions: z.coerce.number().optional().default(0),
  destination: z.enum(['Personal', 'Company'], {
    required_error: 'Você precisa selecionar um destino para o depósito.',
  }),
});

type PropertyRentFormProps = {
  propertyId: string;
  propertyName: string;
  rent?: PropertyRent;
  baseRentAmount?: number;
};

// This function now lives inside the component that uses it, or is passed as a prop
async function getOrCreateCategory(
    firestore: any,
    userId: string,
    categoryName: string,
    categoryType: 'Income' | 'Expense',
    collectionName: 'categories' | 'company_categories'
  ) {
    const categoryCollectionRef = collection(firestore, `users/${userId}/${collectionName}`);
    const q = query(
      categoryCollectionRef,
      where('name', '==', categoryName),
      where('type', '==', categoryType)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0];
    } else {
      const newCategory: Omit<Category, 'id'> = {
        name: categoryName,
        type: categoryType,
        userId: userId,
      };
      const docRef = await addDoc(categoryCollectionRef, newCategory);
      return doc(firestore, `users/${userId}/${collectionName}`, docRef.id);
    }
}


export function PropertyRentForm({ propertyId, propertyName, rent, baseRentAmount }: PropertyRentFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const isEditing = !!rent;

  const getRoundedValue = (value?: number) => value ? parseFloat(value.toFixed(2)) : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: getRoundedValue(baseRentAmount),
      details: '',
      account: '',
      discounts: 0,
      additions: 0,
      destination: 'Personal',
    },
  });

  useEffect(() => {
    if (isEditing && rent) {
      form.reset({
        amount: getRoundedValue(rent.amount),
        details: rent.details,
        date: new Date(rent.date),
        account: rent.account,
        discounts: getRoundedValue(rent.discounts),
        additions: getRoundedValue(rent.additions),
        destination: rent.destination,
      });
    } else {
      form.reset({
        amount: getRoundedValue(baseRentAmount),
        details: '',
        date: new Date(),
        account: '',
        discounts: 0,
        additions: 0,
        destination: 'Personal',
      });
    }
  }, [rent, isEditing, form, open, baseRentAmount]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    const finalAmount = (values.amount || 0) + (values.additions || 0) - (values.discounts || 0);
    
    let newRentId: string | null = null;

    try {
        // First, ensure the category exists and get its ID
        const categoryCollectionName = values.destination === 'Personal' ? 'categories' : 'company_categories';
        const categoryDoc = await getOrCreateCategory(firestore, user.uid, 'Receita de Aluguel', 'Income', categoryCollectionName);
        const categoryId = categoryDoc.id;

        // Step 1: Add the rent document
        const rentCollectionRef = collection(firestore, `users/${user.uid}/properties/${propertyId}/rents`);
        const rentData: Omit<PropertyRent, 'id'> = {
            propertyId,
            date: values.date.toISOString(),
            amount: values.amount,
            account: values.account || '',
            discounts: values.discounts,
            additions: values.additions,
            details: values.details,
            destination: values.destination,
            userId: user.uid,
        };
        const newRentDocRef = await addDoc(rentCollectionRef, rentData);
        newRentId = newRentDocRef.id;

        // Step 2: Add the corresponding income document
        const incomeCollectionName = values.destination === 'Personal' ? 'incomes' : 'company_incomes';
        const incomeCollectionRef = collection(firestore, `users/${user.uid}/${incomeCollectionName}`);
       
        const incomeData = {
            amount: finalAmount,
            categoryId: categoryId,
            date: values.date.toISOString(),
            details: `Aluguel: ${propertyName}`,
            receiptMethod: `Depósito (${values.account || 'Não informada'})`,
            userId: user.uid,
            propertyRentId: newRentId,
        };

        await addDoc(incomeCollectionRef, incomeData);

        toast({ title: 'Sucesso!', description: `Aluguel adicionado e lançado como receita.` });
        setOpen(false);

    } catch (error: any) {
        console.error("Error saving rent and income:", error);
        
        // Rollback: If rent was created but income failed, delete the rent.
        if (newRentId) {
            const rentDocToDelete = doc(firestore, `users/${user.uid}/properties/${propertyId}/rents`, newRentId);
            await deleteDoc(rentDocToDelete);
            console.log("Rollback successful: orphaned rent document deleted.");
        }

        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o aluguel e a receita. Verifique suas permissões e tente novamente.' });
        
        // Use the error information to create a more specific contextual error
        const permissionError = new FirestorePermissionError({
            path: error.message.includes('incomes') ? `users/${user.uid}/${values.destination === 'Personal' ? 'incomes' : 'company_incomes'}` : `users/${user.uid}/properties/${propertyId}/rents`,
            operation: 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Adicionar Aluguel</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Destino do Depósito</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="Personal" />
                            </FormControl>
                            <FormLabel className="font-normal">Pessoal</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="Company" />
                            </FormControl>
                            <FormLabel className="font-normal">Empresa</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor Recebido (base)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                        <InputDatePicker field={field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta para Depósito (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banco do Brasil, C/C 1234-5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="discounts"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descontos (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0,00" {...field} step="0.01" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="additions"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Acréscimos (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0,00" {...field} step="0.01" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Pagamento proporcional, acerto de contas..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Aluguel
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
