'use server';
/**
 * @fileOverview An AI agent to explain diagnostic trouble codes.
 *
 * - explainCode - A function that explains a diagnostic code.
 * - CodeExplanationInput - The input type for the explainCode function.
 * - CodeExplanationOutput - The return type for the explainCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeExplanationInputSchema = z.object({
  code: z.string().describe('The diagnostic trouble code to explain.'),
  vehicleDetails: z
    .string()
    .optional()
    .describe('Optional details about the vehicle, like make, model, and year.'),
});
export type CodeExplanationInput = z.infer<typeof CodeExplanationInputSchema>;

const CodeExplanationOutputSchema = z.object({
  explanation: z.string().describe('A human-readable explanation of the code.'),
  severity: z.string().describe('The severity of the issue (e.g., low, medium, high).'),
  possibleCauses: z
    .string()
    .describe('Possible causes of the issue, as a list or paragraph.'),
});
export type CodeExplanationOutput = z.infer<typeof CodeExplanationOutputSchema>;

export async function explainCode(input: CodeExplanationInput): Promise<CodeExplanationOutput> {
  return explainCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeExplanationPrompt',
  input: {schema: CodeExplanationInputSchema},
  output: {schema: CodeExplanationOutputSchema},
  prompt: `You are an expert mechanic who explains diagnostic trouble codes to non-technical users.

  You will be given a diagnostic trouble code and, optionally, details about the vehicle.

  You will generate a human-readable explanation of the code, its severity, and possible causes.

  Vehicle Details: {{vehicleDetails}}
  Code: {{code}}`,
});

const explainCodeFlow = ai.defineFlow(
  {
    name: 'explainCodeFlow',
    inputSchema: CodeExplanationInputSchema,
    outputSchema: CodeExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
