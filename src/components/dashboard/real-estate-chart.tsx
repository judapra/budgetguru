"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { Loader2 } from "lucide-react";

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

const chartConfig = {
    rents: { label: "Aluguéis", color: "hsl(var(--chart-1))" },
    expenses: { label: "Despesas", color: "hsl(var(--chart-2))" },
    net: { label: "Líquido", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const netColor = data.net >= 0 ? 'text-green-500' : 'text-red-500';
        const percentageColor = data.percentageChange >= 0 ? 'text-green-500' : 'text-red-500';
      return (
        <div className="bg-background border p-4 rounded-lg shadow-lg">
          <p className="font-bold font-headline">{label}</p>
          <p className="text-blue-500">Aluguéis: {data.rents.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
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
  const hasData = data && data.length > 0 && data.some(d => d.rents > 0 || d.expenses > 0);

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
        <div className="min-h-[350px] w-full">
            {!hasData ? (
                 <div className="flex h-[350px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `R$${value / 1000}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="rents" fill="var(--color-rents)" radius={4} name="Aluguéis" />
                            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} name="Despesas" />
                            <Bar dataKey="net" fill="var(--color-net)" radius={4} name="Líquido" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
