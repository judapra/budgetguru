import {
  personalBudgets,
  personalTransactions,
  chartData as personalChartData,
} from "@/lib/data";
import { BudgetStatus } from "./budget-status";
import { OverviewChart } from "./overview-chart";
import { RecentTransactions } from "./recent-transactions";

export function PersonalTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <OverviewChart 
            data={personalChartData}
            title="Visão Geral Financeira Pessoal"
            description="Suas receitas e despesas nos últimos 6 meses."
        />
      </div>
      <div className="space-y-6">
        <BudgetStatus budgets={personalBudgets} />
      </div>
      <div className="lg:col-span-3">
        <RecentTransactions transactions={personalTransactions} />
      </div>
    </div>
  );
}
