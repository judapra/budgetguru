'use client'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Category, Budget, Expense } from '@/lib/types';
import { Loader2, AlertTriangle, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useMemo } from 'react';
import { BudgetForm } from './budget-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


interface BudgetListProps {
    userId: string;
    month: number;
    year: number;
    budgetType: 'Personal' | 'Company';
}

interface BudgetDisplayInfo {
    categoryId: string;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    percentage: number;
    budgetId: string | null;
}

export function BudgetList({ userId, month, year, budgetType }: BudgetListProps) {
    const firestore = useFirestore();
    const collectionName = budgetType === 'Personal' ? 'categories' : 'company_categories';

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `users/${userId}/${collectionName}`), where('type', '==', 'Expense'));
    }, [firestore, userId, collectionName]);

    const budgetsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const budgetCollection = budgetType === 'Personal' ? 'budgets' : 'company_budgets';
        return query(
            collection(firestore, `users/${userId}/${budgetCollection}`),
            where('month', '==', month),
            where('year', '==', year)
        );
    }, [firestore, userId, month, year, budgetType]);

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const expenseCollection = budgetType === 'Personal' ? 'expenses' : 'company_expenses';
        const startOfMonth = new Date(year, month - 1, 1).toISOString();
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
        return query(
            collection(firestore, `users/${userId}/${expenseCollection}`),
            where('date', '>=', startOfMonth),
            where('date', '<=', endOfMonth)
        );
    }, [firestore, userId, month, year, budgetType]);

    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);
    const { data: budgets, isLoading: loadingBudgets } = useCollection<Budget>(budgetsQuery);
    const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesQuery);

    const budgetInfo = useMemo((): BudgetDisplayInfo[] => {
        if (!categories) return [];

        const expenseByCategory = new Map<string, number>();
        expenses?.forEach(exp => {
            expenseByCategory.set(exp.categoryId, (expenseByCategory.get(exp.categoryId) || 0) + exp.amount);
        });

        const budgetByCategory = new Map<string, Budget>();
        budgets?.forEach(bud => {
            budgetByCategory.set(bud.categoryId, bud);
        });

        return categories.map(cat => {
            const budget = budgetByCategory.get(cat.id);
            const spent = expenseByCategory.get(cat.id) || 0;
            const budgetAmount = budget?.amount || 0;
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
            
            return {
                categoryId: cat.id,
                categoryName: cat.name,
                budgetAmount: budgetAmount,
                spentAmount: spent,
                percentage: Math.min(percentage, 100),
                budgetId: budget?.id || null
            }
        }).sort((a,b) => b.budgetAmount - a.budgetAmount);

    }, [categories, budgets, expenses]);

    const isLoading = loadingCategories || loadingBudgets || loadingExpenses;

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!categories || categories.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Sem categorias de despesa</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Você precisa cadastrar categorias de despesa antes de poder definir orçamentos para elas.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline">Progresso dos Orçamentos</CardTitle>
                <CardDescription>Acompanhe seus gastos em relação ao que foi orçado para cada categoria neste mês.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {budgetInfo.map(info => {
                    const progressColor = info.percentage > 90 ? 'bg-red-500' : info.percentage > 75 ? 'bg-yellow-500' : 'bg-primary';
                    const budget = budgets?.find(b => b.categoryId === info.categoryId);

                    return (
                        <div key={info.categoryId} className="group">
                             <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-foreground">{info.categoryName}</span>
                                <div className='flex items-center gap-2'>
                                    <span className="text-sm text-muted-foreground">
                                        {info.spentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {info.budgetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    <BudgetForm 
                                        userId={userId} 
                                        month={month} 
                                        year={year} 
                                        budgetType={budgetType}
                                        category={categories.find(c => c.id === info.categoryId)!}
                                        budget={budget}
                                    />
                                </div>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Progress value={info.percentage} className={progressColor} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{info.percentage.toFixed(0)}% do orçamento utilizado</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {info.budgetAmount === 0 && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                    Nenhum orçamento definido para esta categoria. Clique no lápis para adicionar.
                                </p>
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
