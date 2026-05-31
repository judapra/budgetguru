'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  date: z.date(),
  airbnbGrossAmount: z.coerce.number().min(0.01, 'O faturamento bruto deve ser maior que zero'),
  commissionAmount: z.coerce.number().min(0, 'A comissão não pode ser negativa'),
  extraExpensesAmount: z.coerce.number().min(0, 'As despesas extras não podem ser negativas'),
  details: z.string().optional(),
  account: z.string().min(1, 'Selecione uma conta para o repasse'),
  destination: z.enum(['Personal', 'Company']),
});

type PropertyAirbnbSettlementFormProps = {
  propertyId: string;
  propertyName: string;
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

export function PropertyAirbnbSettlementForm({ propertyId, propertyName, adminFee }: PropertyAirbnbSettlementFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      airbnbGrossAmount: 0,
      commissionAmount: 0,
      extraExpensesAmount: 0,
      details: '',
      account: '',
      destination: 'Personal',
    },
  });

  const grossAmount = form.watch('airbnbGrossAmount');

  // Auto-calculate commission based on adminFee
  useEffect(() => {
    if (grossAmount > 0 && adminFee > 0) {
        // Only update if the user hasn't manually tweaked it (or if they want it auto updated every time)
        // For simplicity, we auto-update the commission field whenever gross changes
        const calculatedCommission = parseFloat((grossAmount * (adminFee / 100)).toFixed(2));
        form.setValue('commissionAmount', calculatedCommission);
    }
  }, [grossAmount, adminFee, form]);

  const commissionAmount = form.watch('commissionAmount');
  const extraExpensesAmount = form.watch('extraExpensesAmount');
  const netAmount = (grossAmount || 0) - (commissionAmount || 0) - (extraExpensesAmount || 0);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    const batch = writeBatch(firestore);

    try {
        const incomeCategoryCollectionName = values.destination === 'Personal' ? 'categories' : 'company_categories';
        const incomeCollectionName = values.destination === 'Personal' ? 'incomes' : 'company_incomes';
        const expenseCollectionName = values.destination === 'Personal' ? 'expenses' : 'company_expenses';

        // 1. Get/Create Categories
        const grossIncomeCategoryDoc = await getOrCreateCategory(firestore, user.uid, 'Faturamento Airbnb', 'Income', incomeCategoryCollectionName);
        const commissionExpenseCategoryDoc = await getOrCreateCategory(firestore, user.uid, 'Comissão Administradora', 'Expense', incomeCategoryCollectionName);
        const maintenanceExpenseCategoryDoc = await getOrCreateCategory(firestore, user.uid, 'Despesas Imóvel', 'Expense', incomeCategoryCollectionName);

        // 2. Create the Rent/Settlement record in the property's subcollection
        const rentsCollectionRef = collection(firestore, `users/${user.uid}/properties/${propertyId}/rents`);
        const newRentRef = doc(rentsCollectionRef);
        batch.set(newRentRef, {
            propertyId,
            date: values.date.toISOString(),
            amount: parseFloat(netAmount.toFixed(2)),
            airbnbGrossAmount: values.airbnbGrossAmount,
            commissionAmount: values.commissionAmount,
            extraExpensesAmount: values.extraExpensesAmount,
            details: values.details || `Repasse Mensal - ${propertyName}`,
            account: values.account,
            destination: values.destination,
            userId: user.uid,
            isAdjustment: false,
        });

        // 3. Create the Gross Income record
        const incomesCollectionRef = collection(firestore, `users/${user.uid}/${incomeCollectionName}`);
        const newIncomeRef = doc(incomesCollectionRef);
        batch.set(newIncomeRef, {
            userId: user.uid,
            description: `Faturamento Airbnb - ${propertyName}`,
            amount: values.airbnbGrossAmount,
            date: values.date.toISOString(),
            categoryId: grossIncomeCategoryDoc.id,
            account: values.account,
            propertyRentId: newRentRef.id,
        });

        // 4. Create the Commission Expense record
        if (values.commissionAmount > 0) {
            const expensesCollectionRef = collection(firestore, `users/${user.uid}/${expenseCollectionName}`);
            const newCommissionExpenseRef = doc(expensesCollectionRef);
            batch.set(newCommissionExpenseRef, {
                userId: user.uid,
                description: `Comissão Administradora (${adminFee}%) - ${propertyName}`,
                amount: values.commissionAmount,
                date: values.date.toISOString(),
                categoryId: commissionExpenseCategoryDoc.id,
                account: values.account,
                propertyRentId: newRentRef.id,
            });
        }

        // 5. Create the Extra Expenses record
        if (values.extraExpensesAmount > 0) {
            const expensesCollectionRef = collection(firestore, `users/${user.uid}/${expenseCollectionName}`);
            const newExtraExpenseRef = doc(expensesCollectionRef);
            batch.set(newExtraExpenseRef, {
                userId: user.uid,
                description: `Despesas Extras (Manutenção/Seguro) - ${propertyName}`,
                amount: values.extraExpensesAmount,
                date: values.date.toISOString(),
                categoryId: maintenanceExpenseCategoryDoc.id,
                account: values.account,
                propertyRentId: newRentRef.id,
            });
        }

        await batch.commit();

        toast({
            title: "Repasse Registrado!",
            description: "O faturamento e as despesas foram lançados no fluxo de caixa com sucesso.",
        });
        
        form.reset();
        setOpen(false);

    } catch (serverError) {
        console.error("Error creating settlement:", serverError);
        toast({ variant: 'destructive', title: 'Erro', description: "Não foi possível registrar o repasse." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-purple-700 border-purple-300 hover:bg-purple-50">
          <HandCoins className="mr-2 h-4 w-4" />
          Registrar Repasse Mensal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-purple-800">Repasse da Administradora</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                <FormField
                    control={form.control}
                    name="airbnbGrossAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-blue-700 font-semibold">Faturamento Bruto (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="4056.06" className="border-blue-200 focus-visible:ring-blue-500" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="space-y-2">
                    <Label className="text-green-700 font-semibold">Repasse Líquido a Receber</Label>
                    <div className="flex h-10 w-full rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 items-center">
                        {netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Este é o valor que entrará no seu saldo.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="commissionAmount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-red-600">Comissão ({adminFee}%)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" className="border-red-200" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="extraExpensesAmount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-red-600">Despesas Extras</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="157.82" className="border-red-200" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta de Recebimento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Itaú">Itaú</SelectItem>
                          <SelectItem value="Nubank">Nubank</SelectItem>
                          <SelectItem value="Bradesco">Bradesco</SelectItem>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Caixa">Caixa</SelectItem>
                          <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o destino" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Personal">Conta Pessoal</SelectItem>
                          <SelectItem value="Company">Conta da Empresa</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <Input placeholder="Ex: Referente a Junho/2026, incluiu manutenção do chuveiro..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Confirmar Lançamento Completo'}
            </Button>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded text-center">
                <strong>O que vai acontecer:</strong> Serão criados 3 registros no seu extrato. Uma receita de Faturamento, uma despesa de Comissão e uma despesa para os Extras. O saldo final do seu dashboard subirá exatamente o valor do Repasse Líquido.
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
