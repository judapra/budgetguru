'use client';
import { AppHeader } from "@/components/app-header";
import { useUser } from "@/firebase";
import { Loader2, Target } from "lucide-react";
import { BudgetList } from "@/components/budgets/budget-list";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export default function BudgetsPage() {
  const { user, isUserLoading } = useUser();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
  // Criar uma lista de anos, por exemplo, dos últimos 5 anos até o próximo ano
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i + 2);

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold font-headline">Meus Orçamentos</h1>
            </div>
            <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(month => (
                            <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          {user && (
            <BudgetList 
                userId={user.uid} 
                month={selectedMonth} 
                year={selectedYear}
                budgetType="Personal"
            />
          )}
        </div>
      </main>
    </div>
  );
}
