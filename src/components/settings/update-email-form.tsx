
// src/components/settings/update-email-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth';

const emailSchema = z.object({
  newEmail: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(1, 'A senha é obrigatória para confirmar a alteração.'),
});

export function UpdateEmailForm() {
  const { user, auth } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof emailSchema>) {
    if (!user || !auth?.currentUser) return;
    if (user.email === values.newEmail) {
        toast({
            variant: 'destructive',
            title: 'E-mail inalterado',
            description: 'O novo e-mail deve ser diferente do atual.',
        });
        return;
    }

    setIsSubmitting(true);
    try {
      // Re-authenticate user first for security
      const credential = EmailAuthProvider.credential(user.email!, values.password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // If re-authentication is successful, update the email
      await updateEmail(auth.currentUser, values.newEmail);
      
      toast({
        title: 'Sucesso!',
        description: 'Seu e-mail foi atualizado. Você precisará fazer login novamente.',
      });
      
      // Force sign out to make user log in with new email
      await auth.signOut();

    } catch (error: any) {
      console.error(error);
      let description = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        description = 'A senha informada está incorreta. Verifique e tente novamente.';
      } else if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está sendo utilizado por outra conta.';
      } else if (error.code === 'auth/requires-recent-login') {
        description = 'Esta operação é sensível e requer autenticação recente. Faça login novamente antes de tentar alterar o e-mail.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha ao alterar e-mail',
        description,
      });
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Alterar E-mail</CardTitle>
        <CardDescription>
            Seu e-mail de login atual é <span className="font-semibold text-foreground">{user?.email}</span>. 
            Para alterar, forneça o novo e-mail e sua senha atual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="novo.email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua Senha Atual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar E-mail
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
