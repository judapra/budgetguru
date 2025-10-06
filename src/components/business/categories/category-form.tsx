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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, PlusCircle, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Category } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'O nome da categoria é obrigatório.'),
  type: z.enum(['Income', 'Expense'], {
    required_error: 'Você precisa selecionar um tipo.',
  }),
});

type CategoryFormProps = {
  userId: string;
  category?: Category;
};

export function CategoryForm({ userId, category }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!category;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        type: 'Expense',
    }
  });

  useEffect(() => {
    if (category) {
        form.reset({
            name: category.name,
            type: category.type,
        });
    } else {
        form.reset({
            name: '',
            type: 'Expense',
        });
    }
  }, [category, form, open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const categoryData = {
      ...values,
      userId,
    };

    try {
      if (isEditing) {
        const categoryDoc = doc(firestore, `users/${userId}/business_categories/${category.id}`);
        setDoc(categoryDoc, categoryData)
          .then(() => {
            toast({
              title: 'Sucesso!',
              description: 'Sua categoria foi atualizada.',
            });
            setOpen(false);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: categoryDoc.path,
              operation: 'update',
              requestResourceData: categoryData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
      } else {
        const categoriesCollection = collection(firestore, `users/${userId}/business_categories`);
        addDoc(categoriesCollection, categoryData)
          .then(() => {
            toast({
              title: 'Sucesso!',
              description: 'Sua categoria foi cadastrada.',
            });
            form.reset({ name: '', type: 'Expense' });
            setOpen(false);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: categoriesCollection.path,
              operation: 'create',
              requestResourceData: categoryData,
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
            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="h-3 w-3" />
            </Button>
        ) : (
            <Button className="font-headline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Categoria
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar Categoria' : 'Cadastrar Nova Categoria'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Vendas, Marketing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Categoria</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                      disabled={isEditing}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Income" />
                        </FormControl>
                        <FormLabel className="font-normal">Receita</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Despesa</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full font-headline">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Salvar Categoria'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
