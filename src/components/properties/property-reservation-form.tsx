'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
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
import { Loader2, Plus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category, PropertyReservation } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { InputDatePicker } from '../ui/input-date-picker';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

const formSchema = z.object({
  guestName: z.string().optional(),
  checkIn: z.date({ required_error: 'A data de Check-in é obrigatória.' }),
  checkOut: z.date({ required_error: 'A data de Check-out é obrigatória.' }),
  grossAmount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  status: z.enum(['Agendada', 'Concluída', 'Cancelada']).default('Agendada'),
});

type PropertyReservationFormProps = {
  propertyId: string;
  propertyName: string;
  adminFee: number;
};

export function PropertyReservationForm({ propertyId, propertyName, adminFee }: PropertyReservationFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guestName: '',
      grossAmount: 0,
      status: 'Agendada',
    },
  });

  useEffect(() => {
    form.reset({
      guestName: '',
      checkIn: new Date(),
      checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
      grossAmount: 0,
      status: 'Agendada',
    });
  }, [form, open]);

  const grossAmountValue = form.watch('grossAmount');
  const netAmountEstimativa = (grossAmountValue || 0) * (1 - adminFee / 100);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    try {
      const reservationCollectionRef = collection(firestore, `users/${user.uid}/properties/${propertyId}/reservations`);
      const netAmount = values.grossAmount * (1 - adminFee / 100);

      const reservationData: Omit<PropertyReservation, 'id'> = {
        propertyId,
        userId: user.uid,
        guestName: values.guestName || '',
        checkIn: values.checkIn.toISOString(),
        checkOut: values.checkOut.toISOString(),
        grossAmount: values.grossAmount,
        netAmount: netAmount,
        status: values.status,
      };

      // Aqui poderíamos criar a receita (income) caso o status seja Concluída, 
      // mas para simplificar inicialmente vamos focar no registro da reserva.
      // E posteriormente podemos ter um botão "Receber" na listagem.

      await addDoc(reservationCollectionRef, reservationData);

      toast({ title: 'Sucesso!', description: `Reserva cadastrada.` });
      setOpen(false);
    } catch (error: any) {
      console.error("Error saving reservation:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a reserva.' });
      
      const permissionError = new FirestorePermissionError({
        path: `users/${user.uid}/properties/${propertyId}/reservations`,
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
          Nova Reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">Adicionar Reserva</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground mb-4">
                Comissão configurada para este imóvel: <strong>{adminFee}%</strong>
            </div>

            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hóspede (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Check-in</FormLabel>
                    <FormControl>
                        <InputDatePicker field={field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="checkOut"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Check-out</FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status da Reserva</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Agendada" />
                        </FormControl>
                        <FormLabel className="font-normal">Agendada</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Concluída" />
                        </FormControl>
                        <FormLabel className="font-normal">Concluída</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="grossAmount"
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
                    <Input value={netAmountEstimativa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled />
                </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Reserva
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
