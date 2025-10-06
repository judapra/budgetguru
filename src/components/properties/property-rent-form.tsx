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
import type { PropertyRent } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  details: z.string().optional(),
  date: z.date({ required_error: 'A data é obrigatória.' }),
});

type PropertyRentFormProps = {
  userId: string;
  propertyId: string;
  rent?: PropertyRent;
};

export function PropertyRentForm({ userId, propertyId, rent }: PropertyRentFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!rent;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      details: '',
    },
  });

  useEffect(() => {
    if (isEditing && rent) {
      form.reset({
        amount: rent.amount,
        details: rent.details,
        date: new Date(rent.date),
      });
    } else {
      form.reset({
        amount: 0,
        details: '',
        date: new Date(),
      });
    }
  }, [rent, isEditing, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const rentData = {
      ...values,
      date: values.date.toISOString(),
      propertyId,
    };

    try {
      const rentsCollection = collection(firestore, `users/${userId}/properties/${propertyId}/rents`);
      if (isEditing && rent) {
        const rentDoc = doc(rentsCollection, rent.id);
        setDoc(rentDoc, rentData)
          .then(() => {
            toast({ title: 'Sucesso!', description: 'Aluguel do imóvel atualizado.' });
            setOpen(false);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: rentDoc.path,
              operation: 'update',
              requestResourceData: rentData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
      } else {
        addDoc(rentsCollection, rentData)
          .then(() => {
            toast({ title: 'Sucesso!', description: 'Aluguel do imóvel adicionado.' });
            form.reset();
            setOpen(false);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: rentsCollection.path,
              operation: 'create',
              requestResourceData: rentData,
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
          <DialogTitle className="font-headline">{isEditing ? 'Editar Aluguel' : 'Adicionar Aluguel'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Recebido</FormLabel>
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
                  <FormLabel>Data do Pagamento</FormLabel>
                  <FormControl>
                    <InputDatePicker field={field} />
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
                  <FormLabel>Detalhes (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Pagamento proporcional, acerto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Salvar Aluguel'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
