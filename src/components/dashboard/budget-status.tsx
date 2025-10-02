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
        <CardTitle className="font-headline">Budget Status</CardTitle>
        <CardDescription>Your spending progress for this month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.allocated) * 100;
          return (
            <div key={budget.id}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground">{budget.name}</span>
                <span className="text-sm font-medium">
                  ${budget.spent} / ${budget.allocated}
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
