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
        title: "Report Generation Failed",
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Real Estate Portfolio Analysis</CardTitle>
          <CardDescription>
            Enter your properties' financial data to generate an AI-powered report on expenses, income, equity, and ROI.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="financialData">Financial Data</Label>
              <Textarea
                id="financialData"
                name="financialData"
                placeholder="e.g., Property A: Purchase price $500k, Mortgage $400k at 5% interest, Monthly rent $3000, Annual taxes $5000, Insurance $1200/year, Repairs $1000/year..."
                className="min-h-[150px]"
                required
              />
              <p className="text-sm text-muted-foreground">
                Provide as much detail as possible for all your properties for the most accurate analysis.
              </p>
            </div>
            <SubmitButton />
          </CardContent>
        </form>
        {state?.summary && (
          <CardFooter>
            <Card className="w-full bg-secondary/50 shadow-inner">
              <CardHeader>
                <CardTitle className="font-headline">Generated Report</CardTitle>
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
