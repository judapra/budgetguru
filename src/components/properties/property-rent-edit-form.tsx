'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDocs, query, where, writeBatch, collection } from 'firebase/firestore';
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
import { Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PropertyRent } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { getOrCreateCategory } from '@/lib/category-actions';

const formSchema = z.object({
  amount: z.coerce.number().min(0, 'O valor deve ser positivo ou zero.'),
  details: z.string().optional(),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  account: z.string().min(2, 'A conta é obrigatória.'),
  discounts: z.coerce.number().optional().default(0),
  additions: z.coerce.number().optional().default(0),
  destination: z.enum(['Personal', 'Company'], {
    required_error: 'Você precisa selecionar um destino para o depósito.',
  }),
});

type PropertyRentEditFormProps = {
  userId: string;
  propertyId: string;
  propertyName: string;
  rent: PropertyRent;
  baseRentAmount?: number;
};

export function PropertyRentEditForm({ userId, propertyId, propertyName, rent, baseRentAmount }: PropertyRentEditFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const getRoundedValue = (value?: number) => value ? parseFloat(value.toFixed(2)) : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: getRoundedValue(rent.amount),
      details: rent.details || '',
      date: new Date(rent.date),
      account: rent.account,
      discounts: getRoundedValue(rent.discounts),
      additions: getRoundedValue(rent.additions),
      destination: rent.destination,
    },
  });

  useEffect(() => {
    form.reset({
      amount: getRoundedValue(rent.amount),
      details: rent.details || '',
      date: new Date(rent.date),
      account: rent.account,
      discounts: getRoundedValue(rent.discounts),
      additions: getRoundedValue(rent.additions),
      destination: rent.destination,
    });
  }, [rent, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    const finalAmount = (values.amount || 0) + (values.additions || 0) - (values.discounts || 0);

    try {
        // 1. Get or create the 'Receita de Aluguel' category BEFORE the batch
        const categoryCollectionName = values.destination === 'Personal' ? 'categories' : 'company_categories';
        const categoryRef = await getOrCreateCategory(firestore, user.uid, 'Receita de Aluguel', 'Income', categoryCollectionName);

        const batch = writeBatch(firestore);

        // 2. Prepare Rent and Income data
        const rentRef = doc(firestore, `users/${user.uid}/properties/${propertyId}/rents`, rent.id);
        
        const rentData: Omit<PropertyRent, 'id'> = {
            ...rent,
            date: values.date.toISOString(),
            amount: values.amount,
            account: values.account,
            discounts: values.discounts,
            additions: values.additions,
            details: values.details,
            destination: values.destination,
        };
        
        // 3. Delete old income entry
        const oldIncomeCollectionName = rent.destination === 'Personal' ? 'incomes' : 'company_incomes';
        const oldIncomeQuery = query(collection(firestore, `users/${user.uid}/${oldIncomeCollectionName}`), where("propertyRentId", "==", rent.id));
        const oldIncomeSnap = await getDocs(oldIncomeQuery);
        
        if(!oldIncomeSnap.empty){
            batch.delete(oldIncomeSnap.docs[0].ref);
        }
        
        // 4. Create new income entry in the correct collection
        const newIncomeCollectionName = values.destination === 'Personal' ? 'incomes' : 'company_incomes';
        const newIncomeRef = doc(collection(firestore, `users/${user.uid}/${newIncomeCollectionName}`));

        const incomeData = {
            amount: finalAmount,
            categoryId: categoryRef.id,
            date: values.date.toISOString(),
            details: `Aluguel: ${propertyName}`,
            receiptMethod: `Depósito (${values.account})`,
            userId: user.uid,
            propertyRentId: rentRef.id,
        };

        // 5. Add operations to batch
        batch.set(rentRef, rentData);
        batch.set(newIncomeRef, incomeData);
        
        // 6. Commit batch
        await batch.commit();

        toast({ title: 'Sucesso!', description: 'Aluguel atualizado e receita ajustada.' });
        setOpen(false);

    } catch (error) {
        console.error("Error updating rent and income:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o aluguel e a receita.' });
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/properties/${propertyId}/rents/${rent.id}`,
            operation: 'write',
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Editar Aluguel</DialogTitle>
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
                  <FormLabel>Conta para Depósito</FormLabel>
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
              Salvar Alterações
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
