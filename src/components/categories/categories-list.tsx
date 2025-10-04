'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/app/incomes/page';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type CategoriesListProps = {
  title: string;
  categories: Category[];
};

export function CategoriesList({ title, categories }: CategoriesListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (categoryId: string, userId: string) => {
    if (!firestore) return;
    const categoryDoc = doc(firestore, `users/${userId}/categories/${categoryId}`);
    
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
            <Badge key={category.id} variant="secondary" className="text-sm pr-1">
              {category.name}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 ml-1"
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
