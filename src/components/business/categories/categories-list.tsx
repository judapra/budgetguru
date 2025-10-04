'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X, Pencil } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { CategoryForm } from './category-form';


type CategoriesListProps = {
  title: string;
  categories: Category[];
};

export function CategoriesList({ title, categories }: CategoriesListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (categoryId: string, userId: string) => {
    if (!firestore) return;
    const categoryDoc = doc(firestore, `users/${userId}/business_categories/${categoryId}`);
    
    deleteDoc(categoryDoc)
      .then(() => {
        toast({
          title: "Sucesso!",
          description: "Categoria excluída."
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: categoryDoc.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category.id} variant="secondary" className="text-sm pr-1 group">
              {category.name}
              <CategoryForm userId={category.userId} category={category}>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="h-3 w-3" />
                </Button>
              </CategoryForm>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 ml-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(category.id, category.userId)}
              >
                  <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
