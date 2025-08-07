
'use server';
/**
 * @fileOverview An AI flow for generating an End-of-Day (EOD) summary from a list of tasks.
 *
 * - generateEodReport - Creates a concise summary of tasks.
 * - EodReportInput - The input type for the EOD report generation.
 * - EodReport - The output type representing the generated report.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EodReportInputSchema = z.object({
  tasks: z.string().optional().describe('A list of tasks the user has worked on or completed.'),
});
export type EodReportInput = z.infer<typeof EodReportInputSchema>;

const EodReportSchema = z.object({
  summary: z.string().describe('A concise, professional, and well-formatted EOD report summary.'),
});
export type EodReport = z.infer<typeof EodReportSchema>;


const eodReportPrompt = ai.definePrompt({
  name: 'eodReportPrompt',
  input: { schema: EodReportInputSchema },
  output: { schema: EodReportSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are a professional assistant responsible for writing a polished and comprehensive End-of-Day (EOD) report.

      **Instructions:**
      1.  **Analyze Completed Tasks:** Review the list of completed tasks provided by the user.
      2.  **Elaborate and Professionalize:** Do not just list the tasks. Rephrase and elaborate on each item to make it sound professional and complete. For example, "Reviewed PRs" should become something like "Conducted code reviews for several pull requests, providing feedback to ensure code quality and adherence to standards."
      3.  **Structure the Report:**
          - Start with a clear heading: "End-of-Day Summary".
          - Use bullet points or a numbered list for the tasks.
          - Conclude with a brief, positive closing statement.
      4.  **Handle Empty Input:** If the task list is empty, generate a report that politely states that no tasks were marked as completed for the day.

      **User's Completed Tasks:**
      {{{tasks}}}
      
      Generate the professional EOD report now.`,
});

const eodReportFlow = ai.defineFlow(
  {
    name: 'eodReportFlow',
    inputSchema: EodReportInputSchema,
    outputSchema: EodReportSchema,
  },
  async (input) => {
    const { output } = await eodReportPrompt(input);
    return output!;
  }
);

export async function generateEodReport(input: EodReportInput): Promise<EodReport> {
  return eodReportFlow(input);
}
