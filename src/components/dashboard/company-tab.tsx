'use client';
import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, where, doc, setDoc } from 'firebase/firestore';
import { OverviewChart } from "./overview-chart";
import { RecentTransactions } from "./recent-transactions";
import { Loader2, ArrowRight } from 'lucide-react';
import type { Income, Expense, Category, Transaction, Company } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { IncomeForm } from '../company/incomes/income-form';
import { ExpenseForm } from '../company/expenses/expense-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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


function CompanyForm({ userId, companyId }: { userId: string, companyId: string }) {
    const [companyName, setCompanyName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !companyName.trim()) {
            toast({ variant: 'destructive', title: 'Erro', description: 'O nome da empresa é obrigatório.' });
            return;
        }
        setIsSubmitting(true);

        const companyRef = doc(firestore, `users/${userId}/company/${companyId}`);
        const companyData = {
            id: companyId,
            userId: userId,
            name: companyName.trim(),
        };

        setDoc(companyRef, companyData, { merge: true })
            .then(() => {
                toast({ title: 'Sucesso!', description: 'Nome da empresa salvo.' });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: companyRef.path,
                    operation: 'write',
                    requestResourceData: companyData,
                });
                errorEmitter.emit('permission-error', permissionError);
            }).finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline">Cadastre sua Empresa</CardTitle>
                <CardDescription>Para começar a gerenciar as finanças da sua empresa, primeiro informe o nome dela.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Digite o nome da sua empresa"
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Nome da Empresa
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export function CompanyTab() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Assuming a single company per user with a known ID, or we use the user's UID as the company doc ID.
    const companyId = user?.uid || 'main'; 

    const companyQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/company/${companyId}`);
    }, [user, firestore, companyId]);

    const { data: company, isLoading: loadingCompany } = useDoc<Company>(companyQuery);


    const incomesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/company_incomes`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const expensesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/company_expenses`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const categoriesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/company_categories`);
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
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);
    const { data: incomeCategories, isLoading: loadingIncomeCategories } = useCollection<Category>(incomeCategoriesQuery);
    const { data: expenseCategories, isLoading: loadingExpenseCategories } = useCollection<Category>(expenseCategoriesQuery);


    const isLoading = loadingCompany || loadingIncomes || loadingExpenses || loadingCategories || loadingIncomeCategories || loadingExpenseCategories;

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
    
    if (!company?.name) {
        return <CompanyForm userId={user!.uid} companyId={companyId} />;
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
            <div className="text-center p-8 border rounded-lg max-w-2xl mx-auto">
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
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="col-span-1">
                <OverviewChart
                    data={chartData}
                    title={`Visão Geral de ${company.name}`}
                    description="Suas receitas e despesas da empresa nos últimos meses."
                    actions={renderActions}
                />
            </div>
            <div className="col-span-1">
                <RecentTransactions transactions={recentTransactions} />
            </div>
        </div>
    );
}
