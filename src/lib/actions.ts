'use server';

import { generateRealEstateReport } from '@/ai/flows/real-estate-report-generator';

interface FormState {
    summary: string | null;
    error: string | null;
}

export async function handleGenerateReport(prevState: FormState, formData: FormData): Promise<FormState> {
  const financialData = formData.get('financialData') as string;

  if (!financialData || financialData.length < 50) {
      return {
          summary: null,
          error: "Por favor, forneça dados financeiros mais detalhados (pelo menos 50 caracteres) para um relatório preciso.",
      }
  }

  try {
    const report = await generateRealEstateReport({ financialData });
    return { summary: report.summary, error: null };
  } catch (e) {
    console.error(e);
    return { summary: null, error: 'A IA falhou em gerar o relatório. Isso pode ser devido a um problema de configuração ou interrupção do serviço. Por favor, tente novamente mais tarde.' };
  }
}
