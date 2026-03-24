'use server';
/**
 * @fileOverview An AI agent that verifies submitted deliverables against client-defined success criteria.
 *
 * - aiDeliverableVerification - A function that handles the deliverable verification process.
 * - AiDeliverableVerificationInput - The input type for the aiDeliverableVerification function.
 * - AiDeliverableVerificationOutput - The return type for the aiDeliverableVerification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDeliverableVerificationInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The comprehensive description of the job that was posted by the client.'),
  successCriteria: z
    .string()
    .describe(
      'The specific success criteria defined by the client that the deliverable must meet to be considered complete.'
    ),
  deliverableUrl: z
    .string()
    .url()
    .describe('The URL where the freelancer has submitted their deliverable.'),
});
export type AiDeliverableVerificationInput = z.infer<
  typeof AiDeliverableVerificationInputSchema
>;

const AiDeliverableVerificationOutputSchema = z.object({
  isVerified: z
    .boolean()
    .describe('True if the deliverable successfully meets all the specified success criteria; otherwise, false.'),
  reasoning: z
    .string()
    .describe('A detailed explanation of the AI\'s decision, outlining which criteria were met or why the deliverable was not verified.'),
});
export type AiDeliverableVerificationOutput = z.infer<
  typeof AiDeliverableVerificationOutputSchema
>;

export async function aiDeliverableVerification(
  input: AiDeliverableVerificationInput
): Promise<AiDeliverableVerificationOutput> {
  return aiDeliverableVerificationFlow(input);
}

const aiDeliverableVerificationPrompt = ai.definePrompt({
  name: 'aiDeliverableVerificationPrompt',
  input: {schema: AiDeliverableVerificationInputSchema},
  output: {schema: AiDeliverableVerificationOutputSchema},
  prompt: `You are an AI assistant acting as an Intelligent Contract verifier for a decentralized freelance platform. Your role is to automatically assess whether a submitted deliverable meets the client's predefined success criteria.

Critically, you cannot directly access, browse, or process the content at the 'deliverableUrl'. Your verification decision must be based solely on the textual 'jobDescription' and 'successCriteria' provided, and whether the 'deliverableUrl' conceptually represents a valid submission for such a job and criteria. Focus on the logical consistency and completeness of the submission based on the textual information.

Evaluate the following:

Job Description:
{{{jobDescription}}}

Success Criteria:
{{{successCriteria}}}

Submitted Deliverable URL:
{{{deliverableUrl}}}

Based on the above, determine if the deliverable is verified. Provide a clear boolean result for 'isVerified' and a detailed 'reasoning' for your decision, explaining how the submission either meets or fails to meet the criteria.
`,
});

const aiDeliverableVerificationFlow = ai.defineFlow(
  {
    name: 'aiDeliverableVerificationFlow',
    inputSchema: AiDeliverableVerificationInputSchema,
    outputSchema: AiDeliverableVerificationOutputSchema,
  },
  async (input) => {
    const {output} = await aiDeliverableVerificationPrompt(input);
    if (!output) {
      throw new Error('AI deliverable verification failed to produce an output.');
    }
    return output;
  }
);
