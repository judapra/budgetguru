
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, PlusCircle, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'O nome do imóvel é obrigatório.'),
  address: z.string().min(5, 'O endereço é obrigatório.'),
  grossRent: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  adminFee: z.coerce.number().min(0, 'A taxa deve ser positiva.'),
  status: z.enum(['Alugado', 'Vazio'], {
    required_error: 'Você precisa selecionar um status.',
  }),
  tenantName: z.string().optional(),
  tenantPhone: z.string().optional(),
});

type PropertyFormProps = {
  userId: string;
  property?: Property;
  className?: string;
};

export function PropertyForm({ userId, property, className }: PropertyFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!property;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      grossRent: 0,
      adminFee: 0,
      status: 'Vazio',
      tenantName: '',
      tenantPhone: '',
    },
  });

  const watchStatus = form.watch('status');

  useEffect(() => {
    if (isEditing && property) {
      form.reset({
        name: property.name,
        address: property.address,
        grossRent: property.grossRent,
        adminFee: property.adminFee,
        status: property.status,
        tenantName: property.tenantName || '',
        tenantPhone: property.tenantPhone || '',
      });
    } else {
      form.reset({
        name: '',
        address: '',
        grossRent: 0,
        adminFee: 0,
        status: 'Vazio',
        tenantName: '',
        tenantPhone: '',
      });
    }
  }, [property, isEditing, form, open]);

  const adminFeeValue = form.watch('adminFee');
  const grossRentValue = form.watch('grossRent');

  const adminFeeInBRL = (grossRentValue * adminFeeValue) / 100;
  const netRent = grossRentValue - adminFeeInBRL;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const propertyData = {
      ...values,
      userId,
      netRent,
    };

    try {
      if (isEditing) {
        const propertyDoc = doc(firestore, `users/${userId}/properties/${property.id}`);
        await setDoc(propertyDoc, propertyData, { merge: true });
        toast({
            title: 'Sucesso!',
            description: 'Seu imóvel foi atualizado.',
        });
        setOpen(false);
      } else {
        const propertiesCollection = collection(firestore, `users/${userId}/properties`);
        await addDoc(propertiesCollection, propertyData);
        toast({
            title: 'Sucesso!',
            description: 'Seu imóvel foi cadastrado.',
        });
        form.reset();
        setOpen(false);
      }
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: isEditing ? `users/${userId}/properties/${property!.id}` : `users/${userId}/properties`,
          operation: isEditing ? 'update' : 'create',
          requestResourceData: propertyData,
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
          <Button className={cn("font-headline", className)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Imóvel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nome do Imóvel</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Apartamento na Praia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua das Flores, 123, São Paulo, SP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grossRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluguel Bruto (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="2500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Administração (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                <Label>Taxa de Administração (R$)</Label>
                <Input value={adminFeeInBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled />
            </div>
            <div className="space-y-2">
                <Label>Aluguel Líquido (R$)</Label>
                <Input value={netRent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3 md:col-span-2">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Alugado" />
                        </FormControl>
                        <FormLabel className="font-normal">Alugado</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Vazio" />
                        </FormControl>
                        <FormLabel className="font-normal">Vazio</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchStatus === 'Alugado' && (
              <>
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Inquilino (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do inquilino" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Inquilino (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(99) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar Imóvel'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
