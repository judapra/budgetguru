'use client';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { OverviewChart } from "./overview-chart";
import { Loader2 } from 'lucide-react';
import type { Income, Expense, Category } from '@/lib/types';
import { IncomeForm } from '../incomes/income-form';
import { ExpenseForm } from '../expenses/expense-form';
import { DashboardSummaryCard } from './dashboard-summary-card';

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
    const { data: incomeCategories, isLoading: loadingIncomeCategories } = useCollection<Category>(incomeCategoriesQuery);
    const { data: expenseCategories, isLoading: loadingExpenseCategories } = useCollection<Category>(expenseCategoriesQuery);


    const isLoading = loadingIncomes || loadingExpenses || loadingIncomeCategories || loadingExpenseCategories;

    const chartData = useMemo(() => {
        if (!incomes || !expenses) return [];
        return groupTransactionsByMonth(incomes, expenses);
    }, [incomes, expenses]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 col-span-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const renderActions = () => {
        if (!user || !incomeCategories || !expenseCategories) return null;
        return (
            <div className="flex items-center gap-2">
                <IncomeForm categories={incomeCategories} userId={user.uid} className="text-sm" />
                <ExpenseForm categories={expenseCategories} userId={user.uid} variant="outline" className="text-sm" />
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <OverviewChart
                    data={chartData}
                    title="Visão Geral Anual"
                    description="Receitas e despesas dos últimos meses."
                    actions={renderActions}
                />
            </div>
            <div className="lg:col-span-1">
                <DashboardSummaryCard incomes={incomes || []} expenses={expenses || []} />
            </div>
        </div>
    );
}
