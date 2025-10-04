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
import type { Expense } from '@/app/expenses/page';
import type { Category } from '@/app/incomes/page';
import { format } from 'date-fns';

type ExpensesTableProps = {
  expenses: Expense[];
  categories: Category[];
};

export function ExpensesTable({ expenses, categories }: ExpensesTableProps) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

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
              <TableHead>Detalhes</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.details}</TableCell>
                <TableCell>{categoryMap.get(expense.categoryId) || 'N/A'}</TableCell>
                <TableCell>{expense.paymentMethod}</TableCell>
                <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right text-red-500">
                  - {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
