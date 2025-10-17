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
  DialogDescription,
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Budget, Category } from '@/lib/types';

const formSchema = z.object({
  amount: z.coerce.number().min(0, 'O valor do orçamento não pode ser negativo.'),
});

type BudgetFormProps = {
    userId: string;
    month: number;
    year: number;
    category: Category;
    budgetType: 'Personal' | 'Company';
    budget?: Budget;
};

export function BudgetForm({ userId, month, year, category, budgetType, budget }: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!budget;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  useEffect(() => {
    if (budget) {
        form.reset({ amount: budget.amount });
    } else {
        form.reset({ amount: 0 });
    }
  }, [budget, form, open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const budgetCollectionName = budgetType === 'Personal' ? 'budgets' : 'company_budgets';
    
    const budgetData = {
      userId,
      categoryId: category.id,
      month,
      year,
      amount: values.amount,
      type: budgetType,
    };

    try {
      if (isEditing) {
        const budgetDoc = doc(firestore, `users/${userId}/${budgetCollectionName}/${budget.id}`);
        await setDoc(budgetDoc, budgetData);
        toast({ title: 'Sucesso!', description: 'Seu orçamento foi atualizado.' });
      } else {
        const budgetCollection = collection(firestore, `users/${userId}/${budgetCollectionName}`);
        await addDoc(budgetCollection, budgetData);
        toast({ title: 'Sucesso!', description: 'Seu orçamento foi definido.' });
      }
      setOpen(false);

    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
          path: isEditing ? `users/${userId}/${budgetCollectionName}/${budget!.id}` : `users/${userId}/${budgetCollectionName}`,
          operation: isEditing ? 'update' : 'create',
          requestResourceData: budgetData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar' : 'Definir'} Orçamento</DialogTitle>
          <DialogDescription>
            Defina o valor máximo de gastos para a categoria <strong>{category.name}</strong> para o mês selecionado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Orçado (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 500,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Salvar Orçamento'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
