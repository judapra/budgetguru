import {
  businessBudgets,
  businessTransactions,
  businessChartData,
} from "@/lib/data";
import { BudgetStatus } from "./budget-status";
import { OverviewChart } from "./overview-chart";
import { RecentTransactions } from "./recent-transactions";

export function BusinessTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <OverviewChart 
            data={businessChartData}
            title="Visão Geral Financeira do Negócio"
            description="Receitas e despesas da sua empresa nos últimos 6 meses."
        />
      </div>
      <div className="space-y-6">
        <BudgetStatus budgets={businessBudgets} />
      </div>
      <div className="lg:col-span-3">
        <RecentTransactions transactions={businessTransactions} />
      </div>
    </div>
  );
}
