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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category, Income } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  details: z.string().min(2, 'Os detalhes são obrigatórios.'),
  categoryId: z.string().min(1, 'A categoria é obrigatória.'),
  receiptMethod: z.string().min(2, 'O método é obrigatório.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
});

type IncomeFormProps = {
  categories: Category[];
  userId: string;
  income?: Income;
  variant?: 'default' | 'outline';
  className?: string;
};

export function IncomeForm({ categories, userId, income, variant = 'default', className }: IncomeFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!income;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      details: '',
      receiptMethod: '',
    },
  });

  useEffect(() => {
    if (isEditing && income) {
      form.reset({
        amount: income.amount,
        details: income.details,
        categoryId: income.categoryId,
        receiptMethod: income.receiptMethod,
        date: new Date(income.date),
      });
    } else {
        form.reset({
            amount: 0,
            details: '',
            receiptMethod: '',
            categoryId: '',
            date: undefined,
        });
    }
  }, [income, isEditing, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const incomeData = {
      ...values,
      date: values.date.toISOString(),
      userId,
    };

    try {
        if (isEditing) {
            const incomeDoc = doc(firestore, `users/${userId}/incomes/${income.id}`);
            setDoc(incomeDoc, incomeData)
              .then(() => {
                toast({
                  title: 'Sucesso!',
                  description: 'Sua receita foi atualizada.',
                });
                setOpen(false);
              })
              .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                  path: incomeDoc.path,
                  operation: 'update',
                  requestResourceData: incomeData,
                });
                errorEmitter.emit('permission-error', permissionError);
              });

        } else {
            const incomesCollection = collection(firestore, `users/${userId}/incomes`);
            addDoc(incomesCollection, incomeData)
                .then(() => {
                    toast({
                        title: 'Sucesso!',
                        description: 'Sua receita foi cadastrada.',
                    });
                    form.reset();
                    setOpen(false);
                })
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: incomesCollection.path,
                        operation: 'create',
                        requestResourceData: incomeData,
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
            {isEditing ? (
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            ) : (
                <Button className={cn("font-headline", className)} variant={variant}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Receita
                </Button>
            )}
        </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar Receita' : 'Cadastrar Nova Receita'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Salário, Freelance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="receiptMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Recebimento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pix, Transferência" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Receita</FormLabel>
                  <FormControl>
                    <InputDatePicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Salvar Receita'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
