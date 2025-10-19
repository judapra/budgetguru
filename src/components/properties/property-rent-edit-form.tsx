
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDocs, query, where, collection, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
import type { Category, PropertyRent } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';


const formSchema = z.object({
  grossAmount: z.coerce.number().optional(), // Valor bruto para reajuste
  netAmount: z.coerce.number().min(0, 'O valor deve ser positivo ou zero.'), // Valor líquido recebido
  details: z.string().optional(),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  account: z.string().min(2, 'A conta é obrigatória.'),
  discounts: z.coerce.number().optional().default(0),
  additions: z.coerce.number().optional().default(0),
  destination: z.enum(['Personal', 'Company'], {
    required_error: 'Você precisa selecionar um destino para o depósito.',
  }),
  isAdjustment: z.boolean().default(false),
}).refine(data => {
    // Se for um reajuste, o grossAmount é obrigatório e deve ser maior que 0
    if (data.isAdjustment) {
        return data.grossAmount && data.grossAmount > 0;
    }
    return true;
}, {
    message: 'O valor bruto do aluguel é obrigatório para reajustes.',
    path: ['grossAmount'],
});


type PropertyRentEditFormProps = {
  userId: string;
  propertyId: string;
  propertyName: string;
  rent: PropertyRent;
  baseRentAmount?: number;
  adminFee: number;
};

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


export function PropertyRentEditForm({ userId, propertyId, propertyName, rent, baseRentAmount, adminFee }: PropertyRentEditFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const getRoundedValue = (value?: number) => value ? parseFloat(value.toFixed(2)) : 0;
  
  const calculateNetAmountFromGross = (gross: number) => {
    return gross - (gross * adminFee / 100);
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        grossAmount: getRoundedValue(rent.isAdjustment ? rent.amount : undefined),
        netAmount: rent.isAdjustment 
            ? calculateNetAmountFromGross(rent.amount) + (rent.additions || 0) - (rent.discounts || 0)
            : rent.amount,
        details: rent.details || '',
        date: new Date(rent.date),
        account: rent.account,
        discounts: getRoundedValue(rent.discounts),
        additions: getRoundedValue(rent.additions),
        destination: rent.destination,
        isAdjustment: rent.isAdjustment,
    },
  });
  
  useEffect(() => {
    const finalReceivedAmount = rent.isAdjustment
    ? calculateNetAmountFromGross(rent.amount) + (rent.additions || 0) - (rent.discounts || 0)
    : rent.amount;

    form.reset({
        grossAmount: rent.isAdjustment ? rent.amount : undefined,
        netAmount: finalReceivedAmount,
        details: rent.details || '',
        date: new Date(rent.date),
        account: rent.account,
        discounts: rent.discounts || 0,
        additions: rent.additions || 0,
        destination: rent.destination,
        isAdjustment: rent.isAdjustment,
    });
  }, [rent, form, open, adminFee]);
  

  const isAdjustment = form.watch('isAdjustment');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    const batch = writeBatch(firestore);

    try {
        const rentRef = doc(firestore, `users/${user.uid}/properties/${propertyId}/rents`, rent.id);
        const rentData: Omit<PropertyRent, 'id'> = {
            ...rent,
            date: values.date.toISOString(),
            amount: values.isAdjustment ? values.grossAmount! : values.netAmount!,
            account: values.account,
            discounts: values.discounts,
            additions: values.additions,
            details: values.details,
            destination: values.destination,
            isAdjustment: values.isAdjustment,
        };
        batch.update(rentRef, rentData);

        // Find and delete the old income entry, regardless of collection
        const personalIncomeQuery = query(collection(firestore, `users/${user.uid}/incomes`), where("propertyRentId", "==", rent.id));
        const companyIncomeQuery = query(collection(firestore, `users/${user.uid}/company_incomes`), where("propertyRentId", "==", rent.id));
        
        const [personalSnap, companySnap] = await Promise.all([getDocs(personalIncomeQuery), getDocs(companyIncomeQuery)]);
        if(!personalSnap.empty) batch.delete(personalSnap.docs[0].ref);
        if(!companySnap.empty) batch.delete(companySnap.docs[0].ref);

        // Get or create the new category and create the new income entry
        const newCategoryCollectionName = values.destination === 'Personal' ? 'categories' : 'company_categories';
        const categoryDoc = await getOrCreateCategory(firestore, user.uid, 'Receita de Aluguel', 'Income', newCategoryCollectionName);
        const categoryId = categoryDoc.id;
        
        const newIncomeCollectionName = values.destination === 'Personal' ? 'incomes' : 'company_incomes';
        const newIncomeRef = doc(collection(firestore, `users/${user.uid}/${newIncomeCollectionName}`));

        const incomeData = {
            amount: values.netAmount!,
            categoryId: categoryId,
            date: values.date.toISOString(),
            details: `Aluguel: ${propertyName}`,
            receiptMethod: `Depósito (${values.account})`,
            userId: user.uid,
            propertyRentId: rentRef.id,
        };

        batch.set(newIncomeRef, incomeData);
        
        if (values.isAdjustment) {
            const propertyRef = doc(firestore, `users/${user.uid}/properties`, propertyId);
            const adminFeeValue = (values.grossAmount! * adminFee) / 100;
            const newNetRent = values.grossAmount! - adminFeeValue;
            batch.update(propertyRef, {
                grossRent: values.grossAmount,
                netRent: newNetRent
            });
        }

        await batch.commit();

        toast({ title: 'Sucesso!', description: `Aluguel atualizado e receita ajustada.${values.isAdjustment ? ' O valor base do imóvel foi atualizado.' : ''}` });
        setOpen(false);

    } catch (error: any) {
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
              name="isAdjustment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>É um Reajuste de Contrato?</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {isAdjustment && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Modo Reajuste Ativado</AlertTitle>
                    <AlertDescription>
                        Informe o novo valor BRUTO do aluguel. O valor base do imóvel será atualizado.
                    </AlertDescription>
                </Alert>
            )}
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
                 {isAdjustment && (
                    <FormField
                        control={form.control}
                        name="grossAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Valor Bruto (Contrato)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="R$ 5000,00" {...field} step="0.01" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="netAmount"
                    render={({ field }) => (
                        <FormItem className={!isAdjustment ? 'col-span-2' : ''}>
                        <FormLabel>Valor Líquido Recebido</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="R$ 4680,65" {...field} step="0.01" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col col-span-2">
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
