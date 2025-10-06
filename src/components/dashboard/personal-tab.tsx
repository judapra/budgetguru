'use client';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { OverviewChart } from "./overview-chart";
import { RecentTransactions } from "./recent-transactions";
import { Loader2, PlusCircle } from 'lucide-react';
import type { Income, Expense, Transaction, Category } from '@/lib/types';
import { Button } from '../ui/button';
import { IncomeForm } from '../incomes/income-form';
import { ExpenseForm } from '../expenses/expense-form';

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


export function PersonalTab() {
    const { user } = useUser();
    const firestore = useFirestore();

    const incomesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/incomes`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const expensesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/expenses`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const categoriesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/categories`);
    }, [user, firestore]);

    const incomeCategoriesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/categories`), where('type', '==', 'Income'));
    }, [user, firestore]);

    const expenseCategoriesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/categories`), where('type', '==', 'Expense'));
    }, [user, firestore]);

    const { data: incomes, isLoading: loadingIncomes } = useCollection<Income>(incomesQuery);
    const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesQuery);
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);
    const { data: incomeCategories, isLoading: loadingIncomeCategories } = useCollection<Category>(incomeCategoriesQuery);
    const { data: expenseCategories, isLoading: loadingExpenseCategories } = useCollection<Category>(expenseCategoriesQuery);


    const isLoading = loadingIncomes || loadingExpenses || loadingCategories || loadingIncomeCategories || loadingExpenseCategories;

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

    const actions = () => user && (
        <div className="flex items-center gap-2">
            <IncomeForm categories={incomeCategories || []} userId={user.uid}>
                <Button size="sm" className="font-headline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Receita
                </Button>
            </IncomeForm>
            <ExpenseForm categories={expenseCategories || []} userId={user.uid}>
                <Button size="sm" variant="outline" className="font-headline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Despesa
                </Button>
            </ExpenseForm>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="col-span-1">
                <OverviewChart
                    data={chartData}
                    title="Visão Geral Financeira Pessoal"
                    description="Suas receitas e despesas nos últimos meses."
                    actions={actions}
                />
            </div>
            <div className="col-span-1">
                <RecentTransactions transactions={recentTransactions} />
            </div>
        </div>
    );
}
