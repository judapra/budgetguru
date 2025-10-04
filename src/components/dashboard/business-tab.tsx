import {
  businessBudgets,
  businessTransactions,
  businessChartData,
} from "@/lib/data";
import { BudgetStatus } from "./budget-status";
import { OverviewChart } from "./overview-chart";
import { RecentTransactions } from "./recent-transactions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";

export function BusinessTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Em Breve</CardTitle>
        <CardDescription>A gestão financeira para negócios estará disponível em breve. Fique de olho!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center h-48 bg-muted rounded-md">
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
}
