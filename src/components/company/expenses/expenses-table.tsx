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
import type { Expense, Category } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ExpenseForm } from './expense-form';
import { Badge } from '../../ui/badge';

type ExpensesTableProps = {
  expenses: Expense[];
  categories: Category[];
};

export function ExpensesTable({ expenses, categories }: ExpensesTableProps) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (expenseId: string, userId: string) => {
    if (!firestore) return;
    const expenseDoc = doc(firestore, `users/${userId}/company_expenses/${expenseId}`);

    deleteDoc(expenseDoc)
      .then(() => {
        toast({
          title: "Sucesso!",
          description: "Despesa excluída."
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: expenseDoc.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Despesas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Você ainda não cadastrou nenhuma despesa. Comece adicionando uma!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
       <CardHeader>
          <CardTitle className="font-headline">Despesas Cadastradas</CardTitle>
        </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="font-medium">{expense.details}</TableCell>
                <TableCell>{categoryMap.get(expense.categoryId) || 'N/A'}</TableCell>
                <TableCell>{expense.paymentMethod}</TableCell>
                <TableCell>
                    {expense.installments && <Badge variant="outline">{expense.installments}</Badge>}
                </TableCell>
                <TableCell className="text-right text-red-500">
                  - {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className='flex'>
                    <ExpenseForm userId={expense.userId} expense={expense} categories={categories} />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(expense.id, expense.userId)}
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
