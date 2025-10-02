'use client'

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { handleGenerateReport } from '@/lib/actions';
import { SubmitButton } from './submit-button';

const initialState = {
  summary: null,
  error: null,
};

export function RealEstateTab() {
  const { toast } = useToast();
  const [state, formAction] = useFormState(handleGenerateReport, initialState);

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Falha ao Gerar Relatório",
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Análise de Portfólio Imobiliário</CardTitle>
          <CardDescription>
            Insira os dados financeiros de seus imóveis para gerar um relatório com IA sobre despesas, receitas, patrimônio e ROI.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="financialData">Dados Financeiros</Label>
              <Textarea
                id="financialData"
                name="financialData"
                placeholder="Ex: Imóvel A: Preço de compra R$500k, Hipoteca R$400k a 5% juros, Aluguel mensal R$3000, Impostos anuais R$5000, Seguro R$1200/ano, Reparos R$1000/ano..."
                className="min-h-[150px]"
                required
              />
              <p className="text-sm text-muted-foreground">
                Forneça o máximo de detalhes possível para todos os seus imóveis para a análise mais precisa.
              </p>
            </div>
            <SubmitButton />
          </CardContent>
        </form>
        {state?.summary && (
          <CardFooter>
            <Card className="w-full bg-secondary/50 shadow-inner">
              <CardHeader>
                <CardTitle className="font-headline">Relatório Gerado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{state.summary}</p>
                </div>
              </CardContent>
            </Card>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
