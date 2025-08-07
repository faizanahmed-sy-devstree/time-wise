
"use server";

import { generateSchedule, DailyScheduleInput, DailySchedule } from "@/ai/flows/planner-flow";
import { generateEodReport, EodReportInput, EodReport } from "@/ai/flows/eod-report-flow";
import { format } from "date-fns";

interface ScheduleActionInput {
  tasks: string;
  apiKey: string;
  workDuration: {
    hours: number;
    minutes: number;
  };
  startTime: string;
}

interface EodActionInput {
    tasks: string;
    apiKey: string;
}

export async function getAiSchedule(input: ScheduleActionInput): Promise<{ schedule: DailySchedule } | { error: string }> {
  if (!input.apiKey) {
      return { error: "Your Gemini API key is not configured. Please set it in the settings." };
  }

  try {
    const scheduleInput: DailyScheduleInput = {
        tasks: input.tasks,
        workDuration: {
            hours: isNaN(input.workDuration.hours) ? 0 : input.workDuration.hours,
            minutes: isNaN(input.workDuration.minutes) ? 0 : input.workDuration.minutes,
        },
        startTime: input.startTime ? format(new Date(input.startTime), 'hh:mm a') : undefined,
    };
    const result = await generateSchedule(scheduleInput, { auth: input.apiKey });
    return { schedule: result };
  } catch (e: any) {
    console.error(e);
    if (e.message.includes("API key not valid")) {
      return { error: "Your Gemini API key is not valid. Please check it in settings." };
    }
    // Return the actual error message from the AI service
    return { error: e.message || "An unexpected error occurred with the AI service." };
  }
}

export async function getEodReport(input: EodActionInput): Promise<{ report: EodReport } | { error: string }> {
  if (!input.apiKey) {
     return { error: "Your Gemini API key is not configured. Please set it in the settings." };
  }
  
  try {
    const eodInput: EodReportInput = {
      tasks: input.tasks,
    };
    const result = await generateEodReport(eodInput, { auth: input.apiKey });
    return { report: result };
  } catch (e: any)
  {
    console.error(e);
    if (e.message.includes("API key not valid")) {
      return { error: "Your Gemini API key is not valid. Please check it in settings." };
    }
     // Return the actual error message from the AI service
    return { error: e.message || "An unexpected error occurred with the AI service." };
  }
}
