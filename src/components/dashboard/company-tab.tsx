'use client';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { OverviewChart } from "./overview-chart";
import { Loader2, ArrowRight } from 'lucide-react';
import type { Income, Expense, Category, Company } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { IncomeForm } from '../company/incomes/income-form';
import { ExpenseForm } from '../company/expenses/expense-form';
import { CompanyHeader } from './company-header';
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


export function CompanyTab() {
    const { user } = useUser();
    const firestore = useFirestore();

    const companyQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // For now, we assume a single company. This query will fetch all companies.
        return query(collection(firestore, `users/${user.uid}/company`));
    }, [user, firestore]);

    const { data: companies, isLoading: loadingCompany } = useCollection<Company>(companyQuery);
    // For now, we'll work with the first company found.
    const company = companies?.[0];


    const incomesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/company_incomes`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const expensesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/company_expenses`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const incomeCategoriesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/company_categories`), where('type', '==', 'Income'));
    }, [user, firestore]);

    const expenseCategoriesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/company_categories`), where('type', '==', 'Expense'));
    }, [user, firestore]);

    const { data: incomes, isLoading: loadingIncomes } = useCollection<Income>(incomesQuery);
    const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesQuery);
    const { data: incomeCategories, isLoading: loadingIncomeCategories } = useCollection<Category>(incomeCategoriesQuery);
    const { data: expenseCategories, isLoading: loadingExpenseCategories } = useCollection<Category>(expenseCategoriesQuery);


    const isLoading = loadingCompany || loadingIncomes || loadingExpenses || loadingIncomeCategories || loadingExpenseCategories;

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
    
    // Render the CompanyHeader which handles creation or editing
    if (!user) return null;
    if (!company) {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <CompanyHeader userId={user.uid} company={null} />
          </div>
        )
    }


    const hasData = incomes && expenses && (incomes.length > 0 || expenses.length > 0);

    const renderActions = () => {
        if (!user || !incomeCategories || !expenseCategories) return null;
        return (
            <div className="flex items-center gap-2">
                <IncomeForm categories={incomeCategories} userId={user.uid} className="text-sm" />
                <ExpenseForm categories={expenseCategories} userId={user.uid} variant="outline" className="text-sm" />
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="grid grid-cols-1 gap-6">
                <CompanyHeader userId={user.uid} company={company}/>
                <div className="text-center p-8 border rounded-lg lg:col-span-3">
                    <h2 className="text-xl font-bold font-headline mb-2">Comece a Gerenciar as Finanças de {company.name}</h2>
                    <p className="text-muted-foreground mb-4">Cadastre suas receitas e despesas da empresa para ver seu dashboard financeiro.</p>
                    <div className='flex gap-4 justify-center'>
                        <Button asChild>
                            <Link href="/company/incomes">
                                Adicionar Receita
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/company/expenses">
                                Adicionar Despesa
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <CompanyHeader userId={user.uid} company={company}/>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <OverviewChart
                        data={chartData}
                        title={`Visão Geral de ${company.name}`}
                        description="Suas receitas e despesas da empresa nos últimos meses."
                        actions={renderActions()}
                    />
                </div>
                <div className="lg:col-span-1">
                    <DashboardSummaryCard incomes={incomes || []} expenses={expenses || []} />
                </div>
            </div>
        </>
    );
}
