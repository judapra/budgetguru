'use client';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { OverviewChart } from "./overview-chart";
import { RecentTransactions } from "./recent-transactions";
import { Loader2 } from 'lucide-react';
import type { Income, Expense, Category, Transaction } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

const groupTransactionsByMonth = (incomes: Income[], expenses: Expense[]) => {
    const monthlyData: { [key: string]: { month: string; income: number; expenses: number } } = {};
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
        const monthKey = `${currentYear}-${i}`;
        monthlyData[monthKey] = { month: monthNames[i], income: 0, expenses: 0 };
    }

    incomes.forEach(income => {
        const date = new Date(income.date);
        if (date.getFullYear() === currentYear) {
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].income += income.amount;
            }
        }
    });

    expenses.forEach(expense => {
        const date = new Date(expense.date);
        if (date.getFullYear() === currentYear) {
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].expenses += expense.amount;
            }
        }
    });

    return Object.values(monthlyData);
}

const mapToTransactions = (incomes: Income[], expenses: Expense[], categories: Category[]): Transaction[] => {
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const incomeTransactions: Transaction[] = incomes.map(i => ({
        id: i.id,
        name: i.details,
        category: categoryMap.get(i.categoryId) || 'N/A',
        amount: i.amount,
        type: 'income',
        date: new Date(i.date).toISOString(),
    }));

    const expenseTransactions: Transaction[] = expenses.map(e => ({
        id: e.id,
        name: e.details,
        category: categoryMap.get(e.categoryId) || 'N/A',
        amount: e.amount,
        type: 'expense',
        date: new Date(e.date).toISOString(),
    }));

    return [...incomeTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(t => ({...t, date: new Date(t.date).toLocaleDateString('pt-BR')}));
}


export function BusinessTab() {
    const { user } = useUser();
    const firestore = useFirestore();

    const incomesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/business_incomes`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const expensesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/business_expenses`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const categoriesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/business_categories`);
    }, [user, firestore]);

    const { data: incomes, isLoading: loadingIncomes } = useCollection<Income>(incomesQuery);
    const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesQuery);
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);


    const isLoading = loadingIncomes || loadingExpenses || loadingCategories;

    const chartData = useMemo(() => {
        if (!incomes || !expenses) return [];
        return groupTransactionsByMonth(incomes, expenses);
    }, [incomes, expenses]);

    const recentTransactions = useMemo(() => {
        if (!incomes || !expenses || !categories) return [];
        return mapToTransactions(incomes, expenses, categories);
    }, [incomes, expenses, categories]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const hasData = incomes && expenses && (incomes.length > 0 || expenses.length > 0);

    if (!hasData) {
        return (
            <div className="text-center p-8 border rounded-lg max-w-2xl mx-auto">
                <h2 className="text-xl font-bold font-headline mb-2">Comece a Gerenciar as Finanças do seu Negócio</h2>
                <p className="text-muted-foreground mb-4">Cadastre suas receitas e despesas de negócio para ver seu dashboard financeiro.</p>
                <div className='flex gap-4 justify-center'>
                    <Button asChild>
                        <Link href="/business/incomes">
                            Adicionar Receita
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/business/expenses">
                            Adicionar Despesa
                             <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="grid gap-6">
            <div className="col-span-1">
                <OverviewChart
                    data={chartData}
                    title="Visão Geral de Negócios"
                    description="Suas receitas e despesas de negócio nos últimos meses."
                />
            </div>
            <div className="col-span-1">
                <RecentTransactions transactions={recentTransactions} />
            </div>
        </div>
    );
}
