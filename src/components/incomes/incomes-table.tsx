'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Income, Category } from '@/app/incomes/page';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { IncomeForm } from './income-form';


type IncomesTableProps = {
  incomes: Income[];
  categories: Category[];
};

export function IncomesTable({ incomes, categories }: IncomesTableProps) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (incomeId: string, userId: string) => {
    if (!firestore) return;
    const incomeDoc = doc(firestore, `users/${userId}/incomes/${incomeId}`);

    deleteDoc(incomeDoc)
      .then(() => {
        toast({
          title: "Sucesso!",
          description: "Receita excluída."
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: incomeDoc.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (incomes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Receitas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Você ainda não cadastrou nenhuma receita. Comece adicionando uma!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
       <CardHeader>
          <CardTitle className="font-headline">Receitas Cadastradas</CardTitle>
        </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Detalhes</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.map((income) => (
              <TableRow key={income.id}>
                <TableCell className="font-medium">{income.details}</TableCell>
                <TableCell>{categoryMap.get(income.categoryId) || 'N/A'}</TableCell>
                <TableCell>{income.receiptMethod}</TableCell>
                <TableCell>{format(new Date(income.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right text-green-500">
                  {income.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className='flex'>
                  <IncomeForm userId={income.userId} income={income} categories={categories}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </IncomeForm>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(income.id, income.userId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
