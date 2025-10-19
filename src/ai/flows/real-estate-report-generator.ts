'use server';
/**
 * @fileOverview Real Estate Report Generator AI agent.
 *
 * - generateRealEstateReport - A function that handles the generation of a real estate report.
 * - RealEstateReportInput - The input type for the generateRealestateReport function.
 * - RealEstateReportOutput - The return type for the generateRealestateReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealEstateReportInputSchema = z.object({
  financialData: z
    .string()
    .describe(
      'A structured string containing all financial data for a user\'s real estate properties. This includes property details, rent received, and all associated expenses.'
    ),
});
export type RealEstateReportInput = z.infer<typeof RealEstateReportInputSchema>;

const RealEstateReportOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A comprehensive financial analysis of the real estate portfolio. Provide insights on overall performance, identify the most and least profitable properties, calculate the total net income, and suggest potential optimizations. The report should be well-structured and easy to read.'
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
  prompt: `You are a senior real estate financial analyst. Your task is to generate a clear and insightful report summarizing a user's property portfolio based on the structured data provided.

Analyze the data to identify the most and least profitable properties, calculate the total net income (rents minus expenses), and provide actionable suggestions for optimization.

The final output should be a well-structured summary.

Here is the financial data:
{{{financialData}}}`,
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
