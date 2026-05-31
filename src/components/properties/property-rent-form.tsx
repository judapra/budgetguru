
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
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
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category, PropertyRent } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  grossAmount: z.coerce.number().optional(), // Valor bruto para reajuste
  netAmount: z.coerce.number().min(0, 'O valor deve ser positivo ou zero.'), // Valor líquido recebido
  details: z.string().optional(),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  account: z.string().optional(),
  discounts: z.coerce.number().optional().default(0),
  additions: z.coerce.number().optional().default(0),
  destination: z.enum(['Personal', 'Company'], {
    required_error: 'Você precisa selecionar um destino para o depósito.',
  }),
  isAdjustment: z.boolean().default(false),
  airbnbGrossAmount: z.coerce.number().optional(),
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


type PropertyRentFormProps = {
  propertyId: string;
  propertyName: string;
  baseRentAmount?: number;
  adminFee: number;
  propertyType?: 'Tradicional' | 'Airbnb';
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


export function PropertyRentForm({ propertyId, propertyName, baseRentAmount, adminFee, propertyType }: PropertyRentFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const getRoundedValue = (value?: number) => value ? parseFloat(value.toFixed(2)) : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      netAmount: getRoundedValue(baseRentAmount),
      grossAmount: undefined,
      details: '',
      account: '',
      discounts: 0,
      additions: 0,
      destination: 'Personal',
      isAdjustment: false,
    },
  });

  useEffect(() => {
      form.reset({
        netAmount: getRoundedValue(baseRentAmount),
        grossAmount: undefined,
        details: '',
        date: new Date(),
        account: '',
        discounts: 0,
        additions: 0,
        destination: 'Personal',
        isAdjustment: false,
        airbnbGrossAmount: undefined,
      });
  }, [baseRentAmount, form, open]);

  const isAdjustment = form.watch('isAdjustment');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    const batch = writeBatch(firestore);
    let newRentId: string | null = null;

    try {
        const categoryCollectionName = values.destination === 'Personal' ? 'categories' : 'company_categories';
        const categoryDoc = await getOrCreateCategory(firestore, user.uid, propertyType === 'Airbnb' ? 'Reserva Airbnb' : 'Receita de Aluguel', 'Income', categoryCollectionName);
        const categoryId = categoryDoc.id;

        const newRentDocRef = doc(collection(firestore, `users/${user.uid}/properties/${propertyId}/rents`));
        newRentId = newRentDocRef.id;

        const finalNetAmount = propertyType === 'Airbnb' ? (values.airbnbGrossAmount || 0) * (1 - adminFee / 100) : values.netAmount!;
        const finalAmountForRent = propertyType === 'Airbnb' ? finalNetAmount : (values.isAdjustment ? values.grossAmount! : values.netAmount!);

        const rentData: Omit<PropertyRent, 'id'> = {
            propertyId,
            date: values.date.toISOString(),
            amount: finalAmountForRent,
            account: values.account || '',
            discounts: values.discounts,
            additions: values.additions,
            details: values.details,
            destination: values.destination,
            userId: user.uid,
            isAdjustment: values.isAdjustment,
            airbnbGrossAmount: propertyType === 'Airbnb' ? values.airbnbGrossAmount : undefined,
        };
        batch.set(newRentDocRef, rentData);

        const incomeCollectionName = values.destination === 'Personal' ? 'incomes' : 'company_incomes';
        const incomeCollectionRef = collection(firestore, `users/${user.uid}/${incomeCollectionName}`);
        const newIncomeRef = doc(incomeCollectionRef);
       
        const incomeData = {
            amount: finalNetAmount,
            categoryId: categoryId,
            date: values.date.toISOString(),
            details: propertyType === 'Airbnb' ? `Reserva: ${propertyName}` : `Aluguel: ${propertyName}`,
            receiptMethod: `Depósito (${values.account || 'Não informada'})`,
            userId: user.uid,
            propertyRentId: newRentId,
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

        toast({ title: 'Sucesso!', description: `Aluguel adicionado e lançado como receita.${values.isAdjustment ? ' O valor base do imóvel foi atualizado.' : ''}` });
        setOpen(false);

    } catch (error: any) {
        console.error("Error saving rent and income:", error);
        
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o aluguel e a receita. Verifique suas permissões e tente novamente.' });
        
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{propertyType === 'Airbnb' ? 'Adicionar Reserva' : 'Adicionar Aluguel'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {propertyType !== 'Airbnb' && (
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
            )}
             {isAdjustment && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Modo Reajuste Ativado</AlertTitle>
                    <AlertDescription>
                        Informe o novo valor BRUTO do aluguel. O valor base do imóvel será atualizado.
                    </AlertDescription>
                </Alert>
            )}
            {propertyType === 'Airbnb' && (
                <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground mb-4">
                    Comissão configurada para este imóvel: <strong>{adminFee}%</strong>
                </div>
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
                {propertyType === 'Airbnb' ? (
                    <>
                        <FormField
                            control={form.control}
                            name="airbnbGrossAmount"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                <FormLabel>Valor Bruto da Reserva</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="R$ 1500,00" {...field} step="0.01" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="col-span-2 space-y-2">
                            <Label>Valor Líquido Estimado (R$)</Label>
                            <Input value={((form.watch('airbnbGrossAmount') || 0) * (1 - adminFee / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled />
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}
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
              {propertyType === 'Airbnb' ? 'Salvar Reserva' : 'Salvar Aluguel'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
