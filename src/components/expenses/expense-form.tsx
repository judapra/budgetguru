'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { addDoc, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category, Expense } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { addMonths } from 'date-fns';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  details: z.string().min(2, 'Os detalhes são obrigatórios.'),
  categoryId: z.string().min(1, 'A categoria é obrigatória.'),
  paymentMethod: z.string().min(2, 'O método é obrigatório.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  isRecurring: z.boolean().default(false),
  installments: z.coerce.number().optional(),
});

type ExpenseFormProps = {
  categories: Category[];
  userId: string;
  expense?: Expense;
  variant?: 'default' | 'outline';
  className?: string;
};

export function ExpenseForm({ categories, userId, expense, variant = 'default', className }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!expense;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      details: '',
      paymentMethod: '',
      isRecurring: false,
    },
  });

  const isRecurring = form.watch('isRecurring');

  useEffect(() => {
    if (isEditing && expense) {
        form.reset({
            amount: expense.amount,
            details: expense.details,
            categoryId: expense.categoryId,
            paymentMethod: expense.paymentMethod,
            date: new Date(expense.date),
            isRecurring: false, // Editing recurring series is not supported
            installments: undefined,
        });
    } else {
        form.reset({
            amount: 0,
            details: '',
            paymentMethod: '',
            categoryId: '',
            date: new Date(),
            isRecurring: false,
            installments: undefined,
        });
    }
  }, [expense, isEditing, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);
  
    try {
      if (isEditing && expense) {
        // --- EDITING LOGIC (SINGLE EXPENSE) ---
        const expenseDoc = doc(firestore, `users/${userId}/expenses/${expense.id}`);
        const expenseData = {
          ...values,
          date: values.date.toISOString(),
          userId,
        };
        await setDoc(expenseDoc, expenseData);
        toast({
          title: 'Sucesso!',
          description: 'Sua despesa foi atualizada.',
        });
        setOpen(false);
  
      } else if (values.isRecurring && values.installments && values.installments > 1) {
        // --- RECURRING CREATION LOGIC ---
        const batch = writeBatch(firestore);
        const totalInstallments = values.installments;
  
        for (let i = 0; i < totalInstallments; i++) {
          const installmentDate = addMonths(values.date, i);
          const expenseRef = doc(collection(firestore, `users/${userId}/expenses`));
          
          const expenseData: Omit<Expense, 'id'> = {
            userId,
            amount: values.amount,
            categoryId: values.categoryId,
            date: installmentDate.toISOString(),
            details: values.details,
            paymentMethod: values.paymentMethod,
            installments: `${i + 1}/${totalInstallments}`,
          };
          batch.set(expenseRef, expenseData);
        }
        await batch.commit();
        toast({
          title: 'Sucesso!',
          description: `${totalInstallments} despesas parceladas foram cadastradas.`,
        });
        setOpen(false);
  
      } else {
        // --- SINGLE CREATION LOGIC ---
        const expensesCollection = collection(firestore, `users/${userId}/expenses`);
        const expenseData = {
          ...values,
          date: values.date.toISOString(),
          userId,
          installments: values.installments ? `1/${values.installments}` : undefined
        };
        await addDoc(expensesCollection, expenseData);
        toast({
          title: 'Sucesso!',
          description: 'Sua despesa foi cadastrada.',
        });
        setOpen(false);
      }
      form.reset();
    } catch (serverError) {
      console.error("Error submitting expense:", serverError);
      const permissionError = new FirestorePermissionError({
        path: isEditing ? `users/${userId}/expenses/${expense!.id}` : `users/${userId}/expenses`,
        operation: isEditing ? 'update' : 'create',
        requestResourceData: values,
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
            </Button>
        ) : (
            <Button className={cn("font-headline", className)} variant={variant}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Despesa
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                        <FormLabel>Data da {isRecurring ? '1ª Parcela' : 'Despesa'}</FormLabel>
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
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Almoço, Uber" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                            {category.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Método</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Cartão de Crédito" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Lançar despesa parcelada
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 12" {...field} min={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
            
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
