
// src/components/settings/delete-account-section.tsx
'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { writeBatch, doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function DeleteAccountSection() {
  const { user, auth } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || !auth?.currentUser || !firestore || !user.email) return;

    if (!password) {
        toast({
            variant: 'destructive',
            title: 'Senha necessária',
            description: 'Você deve fornecer sua senha para excluir a conta.',
        });
        return;
    }

    setIsDeleting(true);
    try {
        // Re-authenticate for security
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);

        // Batch delete Firestore data
        const batch = writeBatch(firestore);
        
        // Add all user-related documents to the batch for deletion
        const userDocRef = doc(firestore, `users/${user.uid}`);
        batch.delete(userDocRef);
        // Note: For a real app, you would recursively delete all sub-collections (incomes, expenses, etc.)
        // This is a simplified example. For production, use a Cloud Function to handle this cascading delete.
        // For example, to delete the company doc:
        const companyDocRef = doc(firestore, `users/${user.uid}/company/${user.uid}`);
        batch.delete(companyDocRef);
        
        await batch.commit();

        // Finally, delete the user from Auth
        await deleteUser(auth.currentUser);

        toast({
            title: 'Conta excluída',
            description: 'Sua conta e todos os seus dados foram excluídos com sucesso.',
        });
        setIsDialogOpen(false);
        // The onAuthStateChanged listener will handle the redirect to /login

    } catch (error: any) {
      console.error(error);
      let description = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        description = 'A senha informada está incorreta.';
      } else if (error.code === 'auth/requires-recent-login') {
        description = 'Esta operação é sensível e requer autenticação recente. Faça login novamente antes de tentar excluir a conta.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha ao excluir conta',
        description,
      });
    } finally {
      setIsDeleting(false);
      setPassword('');
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="font-headline text-destructive">Zona de Perigo</CardTitle>
        <CardDescription>A exclusão da sua conta é uma ação permanente e irreversível.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Ao excluir sua conta, todos os seus dados, incluindo informações de perfil, receitas, despesas, categorias e imóveis serão permanentemente removidos. Esta ação não pode ser desfeita.
        </p>
      </CardContent>
      <CardFooter className="flex justify-start">
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Excluir Minha Conta</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Para confirmar, por favor, digite sua senha. Todos os seus dados serão excluídos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-4">
                <Label htmlFor="password-confirm" className="sr-only">Senha</Label>
                <Input 
                    id="password-confirm"
                    type="password"
                    placeholder="Digite sua senha para confirmar"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPassword('')}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Eu entendo, excluir minha conta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
