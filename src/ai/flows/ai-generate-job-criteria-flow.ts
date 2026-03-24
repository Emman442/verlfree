'use server';
/**
 * @fileOverview An AI agent that generates job success criteria based on job category and description.
 *
 * - aiGenerateJobCriteria - A function that handles the generation of job criteria.
 * - AiGenerateJobCriteriaInput - The input type for the aiGenerateJobCriteria function.
 * - AiGenerateJobCriteriaOutput - The return type for the aiGenerateJobCriteria function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiGenerateJobCriteriaInputSchema = z.object({
  jobCategory: z.string().describe('The category of the job (e.g., Content Writing, Web Development).'),
  jobDescription: z.string().describe('A detailed description of the job.'),
});
export type AiGenerateJobCriteriaInput = z.infer<typeof AiGenerateJobCriteriaInputSchema>;

const AiGenerateJobCriteriaOutputSchema = z.object({
  suggestedCriteria: z.array(z.string()).describe('A list of suggested success criteria for the job.'),
});
export type AiGenerateJobCriteriaOutput = z.infer<typeof AiGenerateJobCriteriaOutputSchema>;

export async function aiGenerateJobCriteria(input: AiGenerateJobCriteriaInput): Promise<AiGenerateJobCriteriaOutput> {
  return aiGenerateJobCriteriaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobCriteriaPrompt',
  input: {schema: AiGenerateJobCriteriaInputSchema},
  output: {schema: AiGenerateJobCriteriaOutputSchema},
  prompt: `You are an expert in defining clear and comprehensive job success criteria.

Based on the following job category and description, generate a list of specific, measurable, achievable, relevant, and time-bound (SMART) success criteria that a freelancer must meet to successfully complete the job.

The output should be a JSON object with a single field 'suggestedCriteria' which is an array of strings. Each string in the array should be one criterion.

Job Category: {{{jobCategory}}}
Job Description: {{{jobDescription}}}`,
});

const aiGenerateJobCriteriaFlow = ai.defineFlow(
  {
    name: 'aiGenerateJobCriteriaFlow',
    inputSchema: AiGenerateJobCriteriaInputSchema,
    outputSchema: AiGenerateJobCriteriaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
