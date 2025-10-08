'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { Income, Expense } from "@/lib/types";
import { useMemo } from "react";
import { ArrowDown, ArrowUp, Minus, MoveRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardSummaryCardProps = {
    incomes: Income[];
    expenses: Expense[];
}

const calculateMonthlyTotals = (transactions: (Income | Expense)[], month: number, year: number) => {
    return transactions.reduce((total, transaction) => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === month && transactionDate.getFullYear() === year) {
            return total + transaction.amount;
        }
        return total;
    }, 0);
};

const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
};

const SummaryStat = ({ title, value, percentage, isIncome }: { title: string, value: number, percentage: number, isIncome: boolean}) => {
    const isPositive = percentage >= 0;
    const isNeutral = percentage === 0 || !isFinite(percentage);
    const Icon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);
    const color = isNeutral ? 'text-muted-foreground' : (isPositive ? (isIncome ? 'text-green-500' : 'text-red-500') : (isIncome ? 'text-red-500' : 'text-green-500'));

    return (
        <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <div className={cn("flex items-center text-xs", color)}>
                <Icon className="h-3 w-3 mr-1" />
                {isNeutral ? 'Sem dados do mês anterior' : `${percentage.toFixed(2)}% vs mês passado`}
            </div>
        </div>
    );
};


export function DashboardSummaryCard({ incomes, expenses }: DashboardSummaryCardProps) {

    const summary = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const previousDate = new Date(now.setMonth(now.getMonth() - 1));
        const previousMonth = previousDate.getMonth();
        const previousYear = previousDate.getFullYear();

        const currentMonthIncome = calculateMonthlyTotals(incomes, currentMonth, currentYear);
        const previousMonthIncome = calculateMonthlyTotals(incomes, previousMonth, previousYear);

        const currentMonthExpenses = calculateMonthlyTotals(expenses, currentMonth, currentYear);
        const previousMonthExpenses = calculateMonthlyTotals(expenses, previousMonth, previousYear);
        
        const netIncome = currentMonthIncome - currentMonthExpenses;

        return {
            currentMonthIncome,
            incomePercentageChange: calculatePercentageChange(currentMonthIncome, previousMonthIncome),
            currentMonthExpenses,
            expensePercentageChange: calculatePercentageChange(currentMonthExpenses, previousMonthExpenses),
            netIncome
        };
    }, [incomes, expenses]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="font-headline">Resumo do Mês</CardTitle>
                <CardDescription>Sua performance financeira neste mês em comparação com o anterior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <SummaryStat 
                    title="Receitas este mês"
                    value={summary.currentMonthIncome}
                    percentage={summary.incomePercentageChange}
                    isIncome={true}
                />
                <SummaryStat 
                    title="Despesas este mês"
                    value={summary.currentMonthExpenses}
                    percentage={summary.expensePercentageChange}
                    isIncome={false}
                />
                <div className="border-t pt-4 space-y-1">
                    <p className="text-sm text-muted-foreground">Saldo do Mês</p>
                    <p className={cn(
                        "text-3xl font-bold",
                        summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                        {summary.netIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}