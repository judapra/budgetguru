"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
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
} from "@/components/ui/chart";

type ChartData = {
  month: string;
  rents: number;
  expenses: number;
  net: number;
  percentageChange: number | null;
}

type RealEstateChartProps = {
    data: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const netColor = data.net >= 0 ? 'text-green-500' : 'text-red-500';
        const percentageColor = data.percentageChange >= 0 ? 'text-green-500' : 'text-red-500';
      return (
        <div className="bg-background border p-4 rounded-lg shadow-lg">
          <p className="font-bold font-headline">{label}</p>
          <p className="text-green-500">Aluguéis: {data.rents.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-red-500">Despesas: {data.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className={`${netColor} font-semibold`}>Líquido: {data.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          {data.percentageChange !== null && (
             <p className={`${percentageColor} text-sm`}>
                Variação: {data.percentageChange.toFixed(2)}%
             </p>
          )}
        </div>
      );
    }
  
    return null;
  };

export function RealEstateChart({ data }: RealEstateChartProps) {
  const chartConfig = {
    rents: {
      label: "Aluguéis",
      color: "hsl(var(--chart-1))",
    },
    expenses: {
      label: "Despesas",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <CardTitle className="font-headline">Performance dos Imóveis</CardTitle>
            <CardDescription>Aluguéis recebidos vs. despesas mensais.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full">
            <BarChart
              data={data}
              width={730}
              height={350}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
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
              <Tooltip content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="rents" fill="var(--color-rents)" radius={4} name="Aluguéis" />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} name="Despesas" />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
