'use client'

import { useFormState } from 'react-dom';
import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { handleGenerateReport } from '@/lib/actions';
import { SubmitButton } from './submit-button';

const initialState = {
  summary: null,
  error: null,
};

export function RealEstateReport() {
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
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Análise de Portfólio com IA</CardTitle>
          <CardDescription>
            Clique no botão abaixo para que a IA analise todos os dados dos seus imóveis (aluguéis e despesas) e gere um relatório de performance financeira.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent>
            <SubmitButton />
          </CardContent>
        </form>
        {state?.summary && (
          <CardFooter>
            <Card className="w-full bg-muted/50 shadow-inner">
              <CardHeader>
                <CardTitle className="font-headline">Relatório de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                    <p className="whitespace-pre-wrap">{state.summary}</p>
                </div>
              </CardContent>
            </Card>
          </CardFooter>
        )}
      </Card>
  );
}
