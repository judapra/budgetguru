
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
import type { Category, PropertyExpense } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  description: z.string().min(2, 'A descrição é obrigatória.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  destination: z.enum(['Personal', 'Company'], {
    required_error: 'Você precisa selecionar um destino para a despesa.',
  }),
});

type PropertyExpenseFormProps = {
  userId: string;
  propertyId: string;
  propertyName: string;
  expense?: PropertyExpense;
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

export function PropertyExpenseForm({ userId, propertyId, propertyName, expense }: PropertyExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const isEditing = !!expense;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: '',
      destination: 'Personal',
    },
  });

  useEffect(() => {
    if (isEditing && expense) {
      form.reset({
        amount: expense.amount,
        description: expense.description,
        date: new Date(expense.date),
        destination: expense.destination,
      });
    } else {
      form.reset({
        amount: 0,
        description: '',
        date: new Date(),
        destination: 'Personal',
      });
    }
  }, [expense, isEditing, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    let newPropertyExpenseId: string | null = null;
    try {
      const categoryCollectionName = values.destination === 'Personal' ? 'categories' : 'company_categories';
      const categoryDoc = await getOrCreateCategory(firestore, user.uid, 'Despesa de Imóvel', 'Expense', categoryCollectionName);
      const categoryId = categoryDoc.id;

      const expensesCollection = collection(firestore, `users/${userId}/properties/${propertyId}/expenses`);
      const expenseData = {
        ...values,
        date: values.date.toISOString(),
        propertyId,
        userId,
      };

      const newPropertyExpenseDocRef = await addDoc(expensesCollection, expenseData);
      newPropertyExpenseId = newPropertyExpenseDocRef.id;

      const generalExpenseCollectionName = values.destination === 'Personal' ? 'expenses' : 'company_expenses';
      const generalExpenseCollectionRef = collection(firestore, `users/${user.uid}/${generalExpenseCollectionName}`);
      const generalExpenseData = {
        amount: values.amount,
        categoryId: categoryId,
        date: values.date.toISOString(),
        details: `${values.description} (${propertyName})`,
        paymentMethod: 'Débito Automático', // Default value or could be a form field
        userId: user.uid,
        propertyExpenseId: newPropertyExpenseId,
      };
      await addDoc(generalExpenseCollectionRef, generalExpenseData);

      toast({ title: 'Sucesso!', description: 'Despesa do imóvel adicionada e lançada.' });
      form.reset();
      setOpen(false);

    } catch (error) {
        console.error("Error saving property expense and general expense:", error);
        if (newPropertyExpenseId) {
            const docToDelete = doc(firestore, `users/${userId}/properties/${propertyId}/expenses`, newPropertyExpenseId);
            await deleteDoc(docToDelete);
        }
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a despesa. Verifique suas permissões.' });
        
        const permissionError = new FirestorePermissionError({
            path: `users/${userId}/properties/${propertyId}/expenses`,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar Despesa do Imóvel' : 'Adicionar Despesa ao Imóvel'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Lançar despesa em</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Condomínio, IPTU, Reparo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
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
                  <FormLabel>Data da Despesa</FormLabel>
                  <FormControl>
                    <InputDatePicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Salvar Despesa'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
