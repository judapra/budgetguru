'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
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
import type { PropertyExpense } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  description: z.string().min(2, 'A descrição é obrigatória.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
});

type PropertyExpenseFormProps = {
  userId: string;
  propertyId: string;
  expense?: PropertyExpense;
};

export function PropertyExpenseForm({ userId, propertyId, expense }: PropertyExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!expense;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (isEditing && expense) {
      form.reset({
        amount: expense.amount,
        description: expense.description,
        date: new Date(expense.date),
      });
    } else {
      form.reset({
        amount: 0,
        description: '',
        date: new Date(),
      });
    }
  }, [expense, isEditing, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const expenseData = {
      ...values,
      date: values.date.toISOString(),
      propertyId,
    };

    try {
      const expensesCollection = collection(firestore, `users/${userId}/properties/${propertyId}/expenses`);
      if (isEditing && expense) {
        const expenseDoc = doc(expensesCollection, expense.id);
        setDoc(expenseDoc, expenseData)
          .then(() => {
            toast({ title: 'Sucesso!', description: 'Despesa do imóvel atualizada.' });
            setOpen(false);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: expenseDoc.path,
              operation: 'update',
              requestResourceData: expenseData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
      } else {
        addDoc(expensesCollection, expenseData)
          .then(() => {
            toast({ title: 'Sucesso!', description: 'Despesa do imóvel adicionada.' });
            form.reset();
            setOpen(false);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: expensesCollection.path,
              operation: 'create',
              requestResourceData: expenseData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
      }
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
                    <Input type="number" placeholder="R$ 0,00" {...field} />
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
