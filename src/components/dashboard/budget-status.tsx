import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Budget } from "@/lib/data";

type BudgetStatusProps = {
  budgets: Budget[];
};

export function BudgetStatus({ budgets }: BudgetStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Status do Orçamento</CardTitle>
        <CardDescription>Seu progresso de gastos para este mês.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.allocated) * 100;
          return (
            <div key={budget.id}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground">{budget.name}</span>
                <span className="text-sm font-medium">
                  R${budget.spent} / R${budget.allocated}
                </span>
              </div>
              <Progress value={percentage} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
