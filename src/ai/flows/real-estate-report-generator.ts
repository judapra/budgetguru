'use server';
/**
 * @fileOverview Real Estate Report Generator AI agent.
 *
 * - generateRealEstateReport - A function that handles the generation of a real estate report.
 * - RealEstateReportInput - The input type for the generateRealEstateReport function.
 * - RealEstateReportOutput - The return type for the generateRealEstateReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealEstateReportInputSchema = z.object({
  financialData: z
    .string()
    .describe(
      'Financial data related to the real estate properties. This should include income, expenses, mortgage details, and any other relevant financial information.'
    ),
});
export type RealEstateReportInput = z.infer<typeof RealEstateReportInputSchema>;

const RealEstateReportOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A comprehensive summary of the real estate properties financial performance, including expenses, income, equity, and ROI.'
    ),
});
export type RealEstateReportOutput = z.infer<typeof RealEstateReportOutputSchema>;

export async function generateRealEstateReport(
  input: RealEstateReportInput
): Promise<RealEstateReportOutput> {
  return generateRealEstateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realEstateReportPrompt',
  input: {schema: RealEstateReportInputSchema},
  output: {schema: RealEstateReportOutputSchema},
  prompt: `You are a real estate financial analyst. Generate a report summarizing the property expenses, income, equity and ROI based on the following financial data:\n\nFinancial Data: {{{financialData}}}`,
});

const generateRealEstateReportFlow = ai.defineFlow(
  {
    name: 'generateRealEstateReportFlow',
    inputSchema: RealEstateReportInputSchema,
    outputSchema: RealEstateReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
