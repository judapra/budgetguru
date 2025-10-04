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

type IncomesTableProps = {
  incomes: Income[];
  categories: Category[];
};

export function IncomesTable({ incomes, categories }: IncomesTableProps) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
