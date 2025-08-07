
'use server';
/**
 * @fileOverview An AI flow for generating a daily work schedule from a list of tasks.
 *
 * - generateSchedule - Creates a prioritized and timed schedule.
 * - DailyScheduleInput - The input type for the schedule generation.
 * - DailySchedule - The output type representing the generated schedule.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailyScheduleInputSchema = z.object({
  tasks: z.string().describe('A list of tasks the user needs to complete today, potentially written in casual language.'),
  workDuration: z.object({
    hours: z.number().describe('The total number of hours the user will work.'),
    minutes: z.number().describe('The total number of minutes the user will work.'),
  }),
  startTime: z.string().optional().describe('The time the user punched in (e.g., "09:15 AM"). This is the schedule start time.'),
});
export type DailyScheduleInput = z.infer<typeof DailyScheduleInputSchema>;

const DailyScheduleBlockSchema = z.object({
    type: z.enum(['work', 'break', 'meeting']).describe('The type of block.'),
    task: z.string().describe('A professional and clear description of the task, break, or meeting.'),
    duration: z.number().describe('The duration of the block in minutes.'),
});
export type DailyScheduleBlock = z.infer<typeof DailyScheduleBlockSchema>;


const DailyScheduleSchema = z.object({
  schedule: z.array(DailyScheduleBlockSchema),
});
export type DailySchedule = z.infer<typeof DailyScheduleSchema>;

const plannerPrompt = ai.definePrompt({
  name: 'plannerPrompt',
  input: { schema: DailyScheduleInputSchema },
  output: { schema: DailyScheduleSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are an expert productivity assistant. Your goal is to create a realistic and effective daily plan from a user's casually written list of tasks. You will NOT determine the start time of tasks.

      **User's Goal:**
      - Tasks to complete: {{{tasks}}}
      - Total dedicated work time for these tasks: {{workDuration.hours}} hours and {{workDuration.minutes}} minutes.

      **Instructions for creating the schedule blocks:**
      1.  **Analyze and Parse Tasks:**
          - Read the user's tasks carefully. They may be written in casual language.
          - Identify any specific durations (e.g., "20 min break", "meeting for 1 hour").
          - For tasks without a specified duration, estimate a realistic duration in minutes.
          - **Elaborate Task Descriptions:** Rephrase brief or casual tasks into professional action items. For example, "Finish Q3 report" should become "Finalize and submit the Q3 financial report."

      2.  **Determine Block Type:**
          - If a task involves a "meeting", "call", or "sync", set its type to 'meeting'.
          - If a task involves a "break" or "lunch", set its type to 'break'.
          - For all other tasks, set the type to 'work'.
      
      3.  **Prioritize and Order:**
          - Intelligently order the tasks. Prioritize larger or more important tasks earlier in the sequence.
          - If the user mentions fixed time events like "lunch at 1:30", place that 'break' block in a logical position in the sequence, but DO NOT assign a start time.
      
      4.  **Strict Time Allocation:** The total duration of all 'work' and 'meeting' blocks combined MUST add up to the user's total dedicated work time. 'break' durations are separate and do not count towards the work time. You must adjust your estimated task durations as needed to precisely fit the total work time.

      5.  **Output Format:** Adhere strictly to the provided output schema. DO NOT include a 'time' field for any block.

      Generate the detailed and professional sequence of schedule blocks now.
      `,
});

const plannerFlow = ai.defineFlow(
  {
    name: 'plannerFlow',
    inputSchema: DailyScheduleInputSchema,
    outputSchema: DailyScheduleSchema,
  },
  async (input) => {
    const { output } = await plannerPrompt(input);
    return output!;
  }
);


export async function generateSchedule(input: DailyScheduleInput): Promise<DailySchedule> {
  return plannerFlow(input);
}
