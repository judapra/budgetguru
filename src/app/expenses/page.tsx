'use client';
import { useMemo } from 'react';
import { AppHeader } from "@/components/app-header";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { ExpensesTable } from '@/components/expenses/expenses-table';
import type { Category } from '@/app/incomes/page';

export type Expense = {
    id: string;
    userId: string;
    categoryId: string;
    paymentMethod: string;
    date: string;
    amount: number;
    details: string;
};


export default function ExpensesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/categories`),
      where('type', '==', 'Expense')
    );
  }, [user, firestore]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/expenses`);
  }, [user, firestore]);

  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const isLoading = isLoadingCategories || isLoadingExpenses;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold font-headline">Despesas</h1>
            {user && firestore && <ExpenseForm categories={categories || []} userId={user.uid} />}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ExpensesTable expenses={expenses || []} categories={categories || []} />
          )}
        </div>
      </main>
    </div>
  );
}
