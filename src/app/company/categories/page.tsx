'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { AppHeader } from "@/components/app-header";
import { Loader2 } from 'lucide-react';
import { CategoryForm } from '@/components/company/categories/category-form';
import { CategoriesList } from '@/components/company/categories/categories-list';
import type { Category } from '@/lib/types';

export default function CompanyCategoriesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/company_categories`);
  }, [user, firestore]);

  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  const incomeCategories = categories?.filter(c => c.type === 'Income') || [];
  const expenseCategories = categories?.filter(c => c.type === 'Expense') || [];

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold font-headline">Categorias da Empresa</h1>
            {user && (
              <CategoryForm userId={user.uid} />
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <CategoriesList title="Categorias de Receita" categories={incomeCategories} />
              <CategoriesList title="Categorias de Despesa" categories={expenseCategories} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
