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
          error: "Please provide more detailed financial data (at least 50 characters) for an accurate report.",
      }
  }

  try {
    const report = await generateRealEstateReport({ financialData });
    return { summary: report.summary, error: null };
  } catch (e) {
    console.error(e);
    return { summary: null, error: 'AI failed to generate report. This may be due to a configuration issue or service outage. Please try again later.' };
  }
}
