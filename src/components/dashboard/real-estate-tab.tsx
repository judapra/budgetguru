'use client'

import React, { useEffect, useMemo } from 'react';
import { RealEstateChart } from './real-estate-chart';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Property, PropertyRent, PropertyExpense } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { RealEstateReport } from './real-estate-report';

type MonthlyData = {
  month: string;
  rents: number;
  expenses: number;
  net: number;
  percentageChange: number | null;
}


const groupRealEstateByMonth = (rents: PropertyRent[], expenses: PropertyExpense[]): MonthlyData[] => {
    const monthlyData: { [key: string]: { month: string; rents: number; expenses: number } } = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
        const monthKey = `${currentYear}-${i}`;
        monthlyData[monthKey] = { month: monthNames[i], rents: 0, expenses: 0 };
    }

    rents.forEach(rent => {
        const date = new Date(rent.date);
        if (date.getFullYear() === currentYear) {
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].rents += rent.amount;
            }
        }
    });

    expenses.forEach(expense => {
        const date = new Date(expense.date);
        if (date.getFullYear() === currentYear) {
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].expenses += expense.amount;
            }
        }
    });

    const result: MonthlyData[] = Object.values(monthlyData).map(data => ({
        ...data,
        net: data.rents - data.expenses,
        percentageChange: null,
    }));

    for(let i = 1; i < result.length; i++) {
        const prevNet = result[i-1].net;
        const currentNet = result[i].net;

        if (prevNet !== 0) {
            result[i].percentageChange = ((currentNet - prevNet) / Math.abs(prevNet)) * 100;
        } else if (currentNet > 0) {
            result[i].percentageChange = 100;
        } else {
            result[i].percentageChange = 0;
        }
    }

    return result;
}


export function RealEstateTab() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [allRents, setAllRents] = React.useState<PropertyRent[]>([]);
  const [allExpenses, setAllExpenses] = React.useState<PropertyExpense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const propertiesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/properties`);
  }, [user, firestore]);

  const { data: properties } = useCollection<Property>(propertiesQuery);

  useEffect(() => {
    const fetchAllData = async () => {
        if (!properties || !firestore || !user) {
            // If there are no properties, we are not technically loading anymore
            if(!properties) setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        let rents: PropertyRent[] = [];
        let expenses: PropertyExpense[] = [];

        try {
          for (const prop of properties) {
              const rentsQuery = query(collection(firestore, `users/${user.uid}/properties/${prop.id}/rents`));
              const expensesQuery = query(collection(firestore, `users/${user.uid}/properties/${prop.id}/expenses`));

              const rentSnap = await getDocs(rentsQuery);
              rentSnap.forEach(doc => rents.push({ id: doc.id, ...doc.data() } as PropertyRent));

              const expenseSnap = await getDocs(expensesQuery);
              expenseSnap.forEach(doc => expenses.push({ id: doc.id, ...doc.data() } as PropertyExpense));
          }

          setAllRents(rents);
          setAllExpenses(expenses);
        } catch (error) {
          console.error("Failed to fetch real estate data:", error);
        } finally {
          setIsLoading(false);
        }
    }
    fetchAllData();
  }, [properties, firestore, user]);

  const chartData = useMemo(() => {
    return groupRealEstateByMonth(allRents, allExpenses);
  }, [allRents, allExpenses]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  const hasProperties = properties && properties.length > 0;
  
  if (!hasProperties) {
    return (
      <div className="text-center p-8 border rounded-lg max-w-2xl mx-auto">
        <h2 className="text-xl font-bold font-headline mb-2">Gerencie seus Imóveis Aqui</h2>
        <p className="text-muted-foreground mb-4">Adicione seus imóveis para começar a gerenciar aluguéis, despesas e ver a performance do seu portfólio.</p>
        <Button asChild>
            <Link href="/properties">
                Adicionar Imóvel
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </div>
    )
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {chartData && chartData.some(d => d.rents > 0 || d.expenses > 0) && (
            <RealEstateChart data={chartData} />
        )}
      <RealEstateReport />
    </div>
  );
}
