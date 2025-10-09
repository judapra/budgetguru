
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
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
import { Loader2, Plus, Pencil, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PropertyRecurringExpense } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  description: z.string().min(2, 'A descrição é obrigatória.'),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.date({ required_error: 'A data final é obrigatória.' }),
  destination: z.enum(['Personal', 'Company'], {
    required_error: 'Você precisa selecionar um destino para a despesa.',
  }),
}).refine(data => data.endDate >= data.startDate, {
    message: "A data final deve ser posterior ou igual à data de início.",
    path: ["endDate"],
});

type PropertyRecurringExpenseFormProps = {
  userId: string;
  propertyId: string;
  expense?: PropertyRecurringExpense;
};

export function PropertyRecurringExpenseForm({ userId, propertyId, expense }: PropertyRecurringExpenseFormProps) {
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
        startDate: new Date(expense.startDate),
        endDate: new Date(expense.endDate),
        destination: expense.destination,
      });
    } else {
      form.reset({
        amount: 0,
        description: '',
        startDate: new Date(),
        endDate: undefined,
        destination: 'Personal',
      });
    }
  }, [expense, isEditing, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    const recurringExpenseData = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        propertyId,
        userId
    }

    try {
        if (isEditing && expense) {
            // --- EDIT LOGIC ---
            const expenseRef = doc(firestore, `users/${userId}/properties/${propertyId}/recurring_expenses/${expense.id}`);
            await setDoc(expenseRef, recurringExpenseData);
            toast({ title: 'Sucesso!', description: 'Despesa recorrente atualizada.' });
            
        } else {
            // --- CREATE LOGIC ---
            const collectionRef = collection(firestore, `users/${userId}/properties/${propertyId}/recurring_expenses`);
            await addDoc(collectionRef, recurringExpenseData);
            toast({ title: 'Sucesso!', description: 'Despesa recorrente criada.' });
        }
        form.reset();
        setOpen(false);

    } catch (error) {
        console.error("Error saving recurring property expense:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a despesa recorrente.' });
        const permissionError = new FirestorePermissionError({
            path: `users/${userId}/properties/${propertyId}/recurring_expenses`,
            operation: isEditing ? 'update' : 'create',
            requestResourceData: recurringExpenseData
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
             <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="h-3 w-3" />
            </Button>
        ) : (
            <Button variant="outline" size="sm" className="h-7">
                <Repeat className="mr-2 h-4 w-4" />
                Recorrente
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar Despesa Recorrente' : 'Nova Despesa Recorrente'}</DialogTitle>
          <DialogDescription>
            Cadastre uma despesa que se repete mensalmente, como condomínio ou IPTU. O sistema irá projetar os lançamentos futuros para você.
          </DialogDescription>
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
                    <Input placeholder="Ex: Condomínio, IPTU, Seguro" {...field} />
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
                  <FormLabel>Valor Mensal</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className='grid grid-cols-2 gap-4'>
                <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Início da Recorrência</FormLabel>
                    <FormControl>
                        <InputDatePicker field={field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Fim da Recorrência</FormLabel>
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
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Salvar Despesa Recorrente'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
