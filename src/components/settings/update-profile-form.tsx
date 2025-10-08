
// src/components/settings/update-profile-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { updateProfile } from 'firebase/auth';

const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
});

export function UpdateProfileForm() {
  const { user, auth } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName || '',
    },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !auth?.currentUser || !firestore) return;

    setIsSubmitting(true);
    try {
      // 1. Update Firebase Auth display name
      await updateProfile(auth.currentUser, { displayName: values.name });

      // 2. Update Firestore user document
      const userRef = doc(firestore, 'users', user.uid);
      const userData = { name: values.name };
      
      await setDoc(userRef, userData, { merge: true });
      
      toast({
        title: 'Sucesso!',
        description: 'Seu nome foi atualizado.',
      });

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar nome',
        description: 'Não foi possível atualizar seu nome. Tente novamente.',
      });
      const permissionError = new FirestorePermissionError({
        path: `users/${user.uid}`,
        operation: 'update',
        requestResourceData: { name: values.name },
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Nome de Exibição</CardTitle>
        <CardDescription>Atualize seu nome como ele será exibido no aplicativo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
