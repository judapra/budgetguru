"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Loader2 } from "lucide-react";

type OverviewChartProps = {
    data: any[];
    title: string;
    description: string;
    chartConfig: ChartConfig;
    actions?: () => React.ReactNode; 
}

export function OverviewChart({ data, title, description, actions, chartConfig }: OverviewChartProps) {

  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <CardTitle className="font-headline">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex-shrink-0">
            {actions && actions()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
            {!hasData ? (
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              tickMargin={10}
                              axisLine={false}
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                            />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                              tickFormatter={(value) => `R$${value / 1000}k`}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent indicator="dot" formatter={(value, name) => {
                                const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
                                // @ts-ignore
                                const label = chartConfig[name]?.label || name;
                                return (
                                  <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: `var(--color-${name})` }}></div>
                                    <div>{label}: {formattedValue}</div>
                                  </div>
                                );
                              }} />}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
