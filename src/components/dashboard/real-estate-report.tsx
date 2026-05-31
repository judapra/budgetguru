'use client'

import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import type { Property, PropertyExpense, PropertyRent } from '@/lib/types';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyDTLZrgm3aA3QpeMFEDkbZkwkaRme1Qf28";

export function RealEstateReport() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerateReportClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para gerar o relatório.",
      });
      return;
    }

    setLoading(true);
    setSummary(null);

    try {
      // 1. Fetch properties
      const propertiesRef = collection(firestore, `users/${user.uid}/properties`);
      const propertiesSnap = await getDocs(propertiesRef);

      if (propertiesSnap.empty) {
        toast({
          variant: "destructive",
          title: "Sem Dados",
          description: "Você não possui imóveis cadastrados para gerar um relatório.",
        });
        setLoading(false);
        return;
      }

      let allDataString = "Início dos Dados do Portfólio Imobiliário:\n\n";

      for (const propDoc of propertiesSnap.docs) {
        const property = { id: propDoc.id, ...propDoc.data() } as Property;
        allDataString += `## Imóvel: ${property.name}\n`;
        allDataString += `- Endereço: ${property.address}\n`;
        allDataString += `- Status: ${property.status}\n`;
        allDataString += `- Aluguel Bruto Base: ${property.grossRent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
        allDataString += `- Taxa de Administração: ${property.adminFee}%\n`;
        allDataString += `- Aluguel Líquido Base: ${property.netRent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n`;
        
        // Fetch rents
        const rentsRef = collection(firestore, `users/${user.uid}/properties/${property.id}/rents`);
        const rentsSnap = await getDocs(rentsRef);
        if (!rentsSnap.empty) {
          allDataString += "### Aluguéis Recebidos:\n";
          rentsSnap.forEach(rentDoc => {
            const rent = rentDoc.data() as PropertyRent;
            const receivedAmount = rent.isAdjustment 
                ? rent.amount - (rent.amount * property.adminFee / 100) + (rent.additions || 0) - (rent.discounts || 0)
                : rent.amount + (rent.additions || 0) - (rent.discounts || 0);
            allDataString += `  - Data: ${new Date(rent.date).toLocaleDateString('pt-BR')}, Valor Recebido: ${receivedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${rent.isAdjustment ? ' (Reajuste)' : ''}\n`;
          });
          allDataString += "\n";
        }

        // Fetch expenses
        const expensesRef = collection(firestore, `users/${user.uid}/properties/${property.id}/expenses`);
        const expensesSnap = await getDocs(expensesRef);
        if (!expensesSnap.empty) {
          allDataString += "### Despesas do Imóvel:\n";
          expensesSnap.forEach(expenseDoc => {
            const expense = expenseDoc.data() as PropertyExpense;
            allDataString += `  - Data: ${new Date(expense.date).toLocaleDateString('pt-br')}, Descrição: ${expense.description}, Valor: ${expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
          });
        }
        allDataString += "---\n\n";
      }

      allDataString += "Fim dos Dados do Portfólio Imobiliário.";

      // 2. Call Gemini Developer API directly via fetch
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é um analista financeiro imobiliário sênior. Sua tarefa é gerar um relatório claro e perspicaz resumindo a carteira de propriedades do usuário com base nos dados fornecidos.\n\nAnalise os dados para identificar as propriedades mais e menos lucrativas, calcule o lucro líquido total (aluguéis menos despesas) e forneça sugestões práticas de otimização.\n\nO resultado final deve ser um resumo bem estruturado com formatação limpa e legível em português do Brasil.\n\nAqui estão os dados financeiros:\n\n${allDataString}`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Gemini: ${response.statusText}`);
      }

      const resData = await response.json();
      const reportText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reportText) {
        setSummary(reportText);
      } else {
        throw new Error("Resposta vazia da IA.");
      }

    } catch (e: any) {
      console.error("Error generating report client-side:", e);
      toast({
        variant: "destructive",
        title: "Falha ao Gerar Relatório",
        description: e.message || "Erro desconhecido ao chamar a IA.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Análise de Portfólio com IA</CardTitle>
        <CardDescription>
          Clique no botão abaixo para que a IA analise todos os dados dos seus imóveis (aluguéis e despesas) e gere um relatório de performance financeira.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleGenerateReportClient}>
        <CardContent>
          <Button type="submit" disabled={loading} className='font-headline'>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Gerar Relatório
          </Button>
        </CardContent>
      </form>
      {summary && (
        <CardFooter>
          <Card className="w-full bg-muted/50 shadow-inner">
            <CardHeader>
              <CardTitle className="font-headline">Relatório de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                  <p className="whitespace-pre-wrap">{summary}</p>
              </div>
            </CardContent>
          </Card>
        </CardFooter>
      )}
    </Card>
  );
}
