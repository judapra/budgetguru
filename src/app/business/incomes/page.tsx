'use client';
import { useMemo } from 'react';
import { AppHeader } from "@/components/app-header";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, PlusCircle } from 'lucide-react';
import { IncomeForm } from '@/components/business/incomes/income-form';
import { IncomesTable } from '@/components/business/incomes/incomes-table';
import { Button } from '@/components/ui/button';
import type { Category, Income } from '@/app/incomes/page';

export default function BusinessIncomesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/business_categories`),
      where('type', '==', 'Income')
    );
  }, [user, firestore]);

  const incomesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/business_incomes`);
  }, [user, firestore]);

  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);
  const { data: incomes, isLoading: isLoadingIncomes } = useCollection<Income>(incomesQuery);

  const isLoading = isLoadingCategories || isLoadingIncomes;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold font-headline">Receitas de Negócios</h1>
            {user && firestore && (
              <IncomeForm categories={categories || []} userId={user.uid}>
                <Button className="font-headline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Receita
                </Button>
              </IncomeForm>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <IncomesTable incomes={incomes || []} categories={categories || []} />
          )}
        </div>
      </main>
    </div>
  );
}
