'use server';
/**
 * @fileOverview Provides an AI-powered explanation of the deliverable verification verdict for a freelancer.
 *
 * - aiVerificationExplanation - A function that generates a human-readable explanation of an AI verification result.
 * - AIVerificationExplanationInput - The input type for the aiVerificationExplanation function.
 * - AIVerificationExplanationOutput - The return type for the aiVerificationExplanation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIVerificationExplanationInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job.'),
  deliverableDescription: z.string().describe('A brief description of the submitted deliverable.'),
  successCriteria: z.array(z.string()).describe('An array of success criteria defined for the job.'),
  aiVerdict: z.boolean().describe('The overall AI verification verdict (true for success, false for failure).'),
  metCriteria: z.array(z.string()).describe('An array of criteria that were met during verification.'),
  unmetCriteria: z.array(z.string()).describe('An array of criteria that were NOT met during verification.'),
  aiReasoning: z.string().describe('The raw reasoning provided by the AI for its verification verdict.'),
});
export type AIVerificationExplanationInput = z.infer<typeof AIVerificationExplanationInputSchema>;

const AIVerificationExplanationOutputSchema = z.object({
  explanation: z.string().describe('A clear, human-readable explanation of the AI verification verdict.'),
});
export type AIVerificationExplanationOutput = z.infer<typeof AIVerificationExplanationOutputSchema>;

export async function aiVerificationExplanation(input: AIVerificationExplanationInput): Promise<AIVerificationExplanationOutput> {
  return aiVerificationExplanationFlow(input);
}

const aiVerificationExplanationPrompt = ai.definePrompt({
  name: 'aiVerificationExplanationPrompt',
  input: { schema: AIVerificationExplanationInputSchema },
  output: { schema: AIVerificationExplanationOutputSchema },
  prompt: `You are an AI assistant tasked with explaining the outcome of a job deliverable verification to a freelancer.

Here are the details of the verification:
Job Title: "{{{jobTitle}}}"
Deliverable Description: "{{{deliverableDescription}}}"

Overall AI Verdict: {{#if aiVerdict}}Successful{{else}}Failed{{/if}}.

Defined Success Criteria for this job:
{{#each successCriteria}}- {{{this}}}
{{/each}}

{{#if aiVerdict}}
Congratulations! Your deliverable for "{{{jobTitle}}}" has been successfully verified by the AI.
All required criteria were met, ensuring the quality and completeness of your work.

AI's detailed feedback:
{{{aiReasoning}}}

Well done on completing this job!
{{else}}
Unfortunately, the AI verification for your deliverable for "{{{jobTitle}}}" has failed.

Here's a breakdown of the specific reasons:

Criteria NOT Met:
{{#each unmetCriteria}}- {{{this}}}
{{/each}}

AI's detailed feedback:
{{{aiReasoning}}}

We understand this can be frustrating. Please review the unmet criteria and the AI's feedback carefully.
You may consider revising your deliverable based on this feedback and resubmitting it, or if you believe there was an error in the verification, you may open a dispute.
{{/if}}

Please provide this explanation in a clear, concise, and professional tone.`,
});

const aiVerificationExplanationFlow = ai.defineFlow(
  {
    name: 'aiVerificationExplanationFlow',
    inputSchema: AIVerificationExplanationInputSchema,
    outputSchema: AIVerificationExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await aiVerificationExplanationPrompt(input);
    return output!;
  }
);
