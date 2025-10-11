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
import { Loader2, Pencil, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Company } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const formSchema = z.object({
  name: z.string().min(2, 'O nome da empresa é obrigatório.'),
});

type CompanyFormProps = {
  userId: string;
  company?: Company | null;
};

export function CompanyForm({ userId, company }: CompanyFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!company;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({ name: company.name });
    } else {
      form.reset({ name: '' });
    }
  }, [company, form, open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);
    
    try {
        if (isEditing) {
            const companyRef = doc(firestore, `users/${userId}/company/${company.id}`);
            await setDoc(companyRef, { name: values.name }, { merge: true });
            toast({ title: 'Sucesso!', description: 'Nome da empresa atualizado.' });
        } else {
            const companyCollection = collection(firestore, `users/${userId}/company`);
            await addDoc(companyCollection, { ...values, userId });
            toast({ title: 'Sucesso!', description: 'Empresa cadastrada!' });
        }
        setOpen(false);

    } catch (serverError) {
        const path = isEditing ? `users/${userId}/company/${company!.id}` : `users/${userId}/company`;
        const permissionError = new FirestorePermissionError({
            path,
            operation: isEditing ? 'update' : 'create',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (!isEditing) {
    return (
        <Card className="max-w-2xl mx-auto col-span-3">
            <CardHeader>
                <CardTitle className="font-headline">Cadastre sua Empresa</CardTitle>
                <CardDescription>Para começar a gerenciar as finanças da sua empresa, primeiro informe o nome dela.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome da Empresa</FormLabel>
                            <FormControl>
                                <Input placeholder="Digite o nome da sua empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Empresa
                    </Button>
                </CardFooter>
                </form>
            </Form>
        </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" /> Editar Nome
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Editar Nome da Empresa</DialogTitle>
          <DialogDescription>
            Altere o nome da sua empresa.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Minha Empresa LTDA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
