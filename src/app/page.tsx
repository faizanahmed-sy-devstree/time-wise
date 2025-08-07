"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAiSchedule, getEodReport } from "./actions";
import type {
  DailySchedule as AiDailySchedule,
  DailyScheduleBlock as AiScheduleBlock,
} from "@/ai/flows/planner-flow";
import type { EodReport } from "@/ai/flows/eod-report-flow";
import {
  format,
  addMinutes,
  isValid,
  differenceInHours,
  subDays,
  set,
} from "date-fns";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { AiAssistantCard } from "@/components/features/ai-assistant-card";
import { ScheduleCard } from "@/components/features/schedule-card";
import { TimeTrackerCards } from "@/components/features/time-tracker-cards";
import { ReportsCard } from "@/components/features/reports-card";
import { WelcomeDialog } from "@/components/features/welcome-dialog";
import { SettingsSheet } from "@/components/features/settings-sheet";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

const APP_SETTINGS_KEY = "timewiseSettings";
const APP_SESSION_KEY = "timewiseSession";

export type ScheduleBlock = {
  id: string;
  type: "work" | "break" | "meeting";
  task: string;
  duration: number;
  completed: boolean;
};

export default function Home() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [settings, setSettings] = useLocalStorage(APP_SETTINGS_KEY, {
    fullDayHours: "8",
    fullDayMinutes: "0",
    apiKey: "",
  });

  const [sessionState, setSessionState] = useLocalStorage(APP_SESSION_KEY, {
    sessionDate: "",
    startTime: "",
    totalBreakMinutes: 0,
    schedule: { schedule: [] } as { schedule: ScheduleBlock[] },
  });

  const [aiState, setAiState] = useState<{
    tasks: string;
    eodReport: EodReport | null;
    error: string | null;
    loading: "schedule" | "eod" | false;
  }>({
    tasks: "",
    eodReport: null,
    error: null,
    loading: false,
  });

  const [activeDuration, setActiveDuration] = useState({
    hours: 8,
    minutes: 0,
    mode: "full" as "full" | "half",
  });

  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsClient(true);

    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (sessionState.sessionDate !== todayStr) {
      startNewSession();
    }

    if (!settings.apiKey) {
      setIsWelcomeDialogOpen(true);
    }

    const fullHours = parseInt(settings.fullDayHours, 10) || 0;
    const fullMinutes = parseInt(settings.fullDayMinutes, 10) || 0;
    setActiveDuration({ hours: fullHours, minutes: fullMinutes, mode: "full" });
  }, [settings.apiKey, settings.fullDayHours, settings.fullDayMinutes]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (
        sessionState.startTime &&
        differenceInHours(now, new Date(sessionState.startTime)) >= 24
      ) {
        startNewSession();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState.startTime]);

  const startNewSession = (startTime = new Date()) => {
    const todayStr = format(startTime, "yyyy-MM-dd");
    setSessionState({
      sessionDate: todayStr,
      startTime: startTime.toISOString(),
      totalBreakMinutes: 0,
      schedule: { schedule: [] },
    });
    setAiState((prev) => ({ ...prev, eodReport: null }));
  };

  const handleSaveSettings = () => {
    const hours = parseInt(settings.fullDayHours, 10) || 0;
    const minutes = parseInt(settings.fullDayMinutes, 10) || 0;

    setSettings((prev) => ({
      ...prev,
      fullDayHours: String(hours),
      fullDayMinutes: String(minutes),
    }));

    if (activeDuration.mode === "full") {
      setActiveDuration({ hours, minutes, mode: "full" });
    } else {
      const totalMinutes = (hours * 60 + minutes) / 2;
      const halfHours = Math.floor(totalMinutes / 60);
      const halfMinutes = totalMinutes % 60;
      setActiveDuration({
        hours: halfHours,
        minutes: halfMinutes,
        mode: "half",
      });
    }

    if (settings.apiKey) {
      toast({
        title: "Settings Saved",
        description: "Your new settings have been saved.",
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Gemini API key to continue.",
      });
      return false;
    }
  };

  const {
    arrivalTime,
    completionTime,
    timeRemaining,
    overtime,
    progress,
    isWorkDayOver,
    isValid: isDurationValid,
  } = useMemo(() => {
    if (!isClient || !sessionState.startTime)
      return {
        arrivalTime: null,
        completionTime: null,
        timeRemaining: 0,
        overtime: 0,
        progress: 0,
        isWorkDayOver: false,
        isValid: false,
      };

    const workingHours = activeDuration.hours;
    const workingMinutes = activeDuration.minutes;

    if (isNaN(workingHours) || isNaN(workingMinutes)) {
      return {
        arrivalTime: null,
        completionTime: null,
        timeRemaining: 0,
        overtime: 0,
        progress: 0,
        isWorkDayOver: false,
        isValid: false,
      };
    }

    const arrivalTimeDate = new Date(sessionState.startTime);
    if (!isValid(arrivalTimeDate)) {
      return {
        arrivalTime: null,
        completionTime: null,
        timeRemaining: 0,
        overtime: 0,
        progress: 0,
        isWorkDayOver: false,
        isValid: false,
      };
    }
    const workingMs = (workingHours * 60 + workingMinutes) * 60 * 1000;
    const totalBreakTimeMs = sessionState.totalBreakMinutes * 60 * 1000;

    const completionTimeDate = new Date(
      arrivalTimeDate.getTime() + workingMs + totalBreakTimeMs
    );
    const timeRemainingMs =
      completionTimeDate.getTime() - currentTime.getTime();

    const elapsedMsSinceArrival = Math.max(
      0,
      currentTime.getTime() - arrivalTimeDate.getTime()
    );
    const workDoneMs = elapsedMsSinceArrival - totalBreakTimeMs;

    let progressValue =
      workingMs > 0
        ? Math.max(0, Math.min(100, (workDoneMs / workingMs) * 100))
        : 0;
    if (timeRemainingMs <= 0) progressValue = 100;

    return {
      arrivalTime: arrivalTimeDate,
      completionTime: completionTimeDate,
      timeRemaining: Math.max(0, timeRemainingMs),
      overtime: timeRemainingMs < 0 ? Math.abs(timeRemainingMs) : 0,
      progress: progressValue,
      isWorkDayOver: timeRemainingMs <= 0,
      isValid: workingMs > 0,
    };
  }, [
    activeDuration,
    currentTime,
    isClient,
    sessionState.startTime,
    sessionState.totalBreakMinutes,
  ]);

  const recalculateSchedule = useCallback(
    (
      scheduleItems: Omit<ScheduleBlock, "id" | "completed">[]
    ): ScheduleBlock[] => {
      if (!scheduleItems || scheduleItems.length === 0) {
        return [];
      }

      return scheduleItems.map((block) => ({
        ...block,
        id: `local-${Date.now()}-${Math.random()}`,
        completed: false,
      }));
    },
    []
  );

  const handleGenerateSchedule = async () => {
    setAiState((prev) => ({
      ...prev,
      loading: "schedule",
      error: null,
      eodReport: null,
    }));
    setSessionState((prev) => ({ ...prev, schedule: { schedule: [] } }));

    const result = await getAiSchedule({
      tasks: aiState.tasks,
      apiKey: settings.apiKey,
      workDuration: {
        hours: activeDuration.hours,
        minutes: activeDuration.minutes,
      },
      startTime: sessionState.startTime,
    });

    if (result.error) {
      setAiState((prev) => ({ ...prev, loading: false, error: result.error }));
      toast({
        variant: "destructive",
        title: "AI Error",
        description: result.error,
        duration: 10000,
      });
    } else if (result.schedule) {
      const scheduleWithIdsAndCompletion = recalculateSchedule(
        result.schedule.schedule as AiScheduleBlock[]
      );
      setSessionState((prev) => ({
        ...prev,
        schedule: { schedule: scheduleWithIdsAndCompletion },
        totalBreakMinutes: 0,
      }));
      setAiState((prev) => ({ ...prev, loading: false, eodReport: null }));
    }
  };

  const handleGenerateEodReport = async () => {
    if (
      !sessionState.schedule ||
      !Array.isArray(sessionState.schedule.schedule)
    ) {
      toast({
        variant: "destructive",
        title: "No Schedule",
        description: "There is no schedule to generate a report from.",
      });
      return;
    }
    const completedTasks = sessionState.schedule.schedule
      .filter(
        (block) =>
          block.completed && (block.type === "work" || block.type === "meeting")
      )
      .map((block) => `- ${block.task}`)
      .join("\n");

    if (!completedTasks) {
      toast({
        variant: "destructive",
        title: "No Completed Tasks",
        description:
          "Please complete some tasks in your schedule to generate a report.",
      });
      return;
    }

    setAiState((prev) => ({ ...prev, loading: "eod", error: null }));

    const result = await getEodReport({
      tasks: completedTasks,
      apiKey: settings.apiKey,
    });

    if (result.error) {
      setAiState((prev) => ({ ...prev, loading: false, error: result.error }));
      toast({
        variant: "destructive",
        title: "AI Error",
        description: result.error,
        duration: 10000,
      });
    } else if (result.report) {
      setAiState((prev) => ({
        ...prev,
        loading: false,
        eodReport: result.report,
      }));
    }
  };

  const hasCompletedTasks = useMemo(() => {
    if (
      !sessionState.schedule ||
      !Array.isArray(sessionState.schedule.schedule)
    ) {
      return false;
    }
    return sessionState.schedule.schedule.some(
      (block) =>
        block.completed && (block.type === "work" || block.type === "meeting")
    );
  }, [sessionState.schedule]);

  const taskListSummary = useMemo(() => {
    if (
      !sessionState.schedule ||
      !Array.isArray(sessionState.schedule.schedule)
    ) {
      return "Your task list is empty.";
    }
    const list = sessionState.schedule.schedule
      .filter((block) => block.type === "work" || block.type === "meeting")
      .map((block) => `- ${block.task}`)
      .join("\n");
    return list || "No tasks or meetings in your schedule yet.";
  }, [sessionState.schedule]);

  const handleCopyTaskList = () => {
    if (
      !taskListSummary ||
      taskListSummary === "No tasks or meetings in your schedule yet." ||
      taskListSummary === "Your task list is empty."
    )
      return;
    navigator.clipboard.writeText(taskListSummary);
    toast({
      title: "Copied to Clipboard",
      description: "Your task list has been copied.",
    });
  };

  const handleToggleTaskCompletion = (index: number) => {
    if (!sessionState.schedule) return;

    const newScheduleItems = [...sessionState.schedule.schedule];
    const block = newScheduleItems[index];
    const newCompletedState = !block.completed;
    newScheduleItems[index] = { ...block, completed: newCompletedState };

    if (block.type === "break") {
      const breakDuration = block.duration;
      setSessionState((prev) => ({
        ...prev,
        totalBreakMinutes: newCompletedState
          ? prev.totalBreakMinutes + breakDuration
          : prev.totalBreakMinutes - breakDuration,
      }));

      toast({
        title: `Break Time ${newCompletedState ? "Added" : "Removed"}`,
        description: `${breakDuration} minutes have been ${
          newCompletedState ? "added to" : "removed from"
        } your total break time.`,
      });
    }

    setSessionState((prev) => ({
      ...prev,
      schedule: { schedule: newScheduleItems },
    }));
  };

  const handleEodReportChange = (value: string) => {
    if (!aiState.eodReport) return;
    const newReport = { ...aiState.eodReport, summary: value };
    setAiState((prev) => ({ ...prev, eodReport: newReport }));
  };

  const handleCopySummary = () => {
    if (!aiState.eodReport?.summary) return;
    navigator.clipboard.writeText(aiState.eodReport.summary);
    toast({
      title: "Copied to Clipboard",
      description: "The EOD summary has been copied.",
    });
  };

  const handleDragEnd = (result: any) => {
    if (!sessionState.schedule || !result.destination) return;

    const items = Array.from(sessionState.schedule.schedule);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSessionState((prev) => ({
      ...prev,
      schedule: { schedule: items },
    }));
  };

  const setWorkDuration = (mode: "full" | "half") => {
    const fullHours = parseInt(settings.fullDayHours, 10) || 0;
    const fullMinutes = parseInt(settings.fullDayMinutes, 10) || 0;

    if (mode === "full") {
      setActiveDuration({
        hours: fullHours,
        minutes: fullMinutes,
        mode: "full",
      });
      toast({
        title: "Work Duration Updated",
        description: `Your workday is set to Full Day (${fullHours}h ${fullMinutes}m).`,
      });
    } else {
      // half
      const totalMinutes = (fullHours * 60 + fullMinutes) / 2;
      const halfHours = Math.floor(totalMinutes / 60);
      const halfMinutes = totalMinutes % 60;
      setActiveDuration({
        hours: halfHours,
        minutes: halfMinutes,
        mode: "half",
      });
      toast({
        title: "Work Duration Updated",
        description: `Your workday is set to Half Day (${halfHours}h ${halfMinutes}m).`,
      });
    }
  };

  const fullSchedule = useMemo(() => {
    if (
      !sessionState.schedule ||
      !Array.isArray(sessionState.schedule.schedule) ||
      !arrivalTime
    )
      return [];

    let lastEndTime: Date = arrivalTime;
    return sessionState.schedule.schedule.map((block) => {
      const startTime = new Date(lastEndTime);
      const endTime = addMinutes(startTime, block.duration);
      lastEndTime = endTime;
      return {
        ...block,
        startTime,
        endTime,
      };
    });
  }, [sessionState.schedule, arrivalTime]);

  const handleStartTimeChange = (newTime: string) => {
    const [hours, minutes] = newTime.split(":").map(Number);
    const now = new Date();
    let potentialStartTime = set(now, {
      hours,
      minutes,
      seconds: 0,
      milliseconds: 0,
    });

    if (potentialStartTime > now) {
      potentialStartTime = subDays(potentialStartTime, 1);
    }
    setSessionState((prev) => ({
      ...prev,
      startTime: potentialStartTime.toISOString(),
    }));
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 bg-background overflow-y-auto">
      <WelcomeDialog
        open={isWelcomeDialogOpen}
        onOpenChange={setIsWelcomeDialogOpen}
        settings={settings}
        onSettingsChange={setSettings}
        onSave={handleSaveSettings}
      />

      <header className="w-full max-w-7xl flex justify-between items-center mb-4 flex-shrink-0 mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold font-headline text-primary">
          TimeWise
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SettingsSheet
            settings={settings}
            onSettingsChange={setSettings}
            onSave={handleSaveSettings}
          />
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        <div className="flex flex-col gap-6">
          <AiAssistantCard
            tasks={aiState.tasks}
            onTasksChange={(value) =>
              setAiState((prev) => ({ ...prev, tasks: value }))
            }
            onGenerate={handleGenerateSchedule}
            isLoading={aiState.loading === "schedule"}
            isValid={isDurationValid}
          />
          <ScheduleCard
            schedule={sessionState.schedule.schedule}
            setSchedule={(newSchedule) =>
              setSessionState((prev) => ({
                ...prev,
                schedule: { schedule: newSchedule },
              }))
            }
            fullSchedule={fullSchedule}
            completionTime={completionTime}
            onToggleCompletion={handleToggleTaskCompletion}
          />
        </div>

        <div className="grid grid-rows-[auto_1fr] gap-6">
          <TimeTrackerCards
            isWorkDayOver={isWorkDayOver}
            isValid={isDurationValid}
            completionTime={completionTime}
            currentTime={currentTime}
            overtime={overtime}
            timeRemaining={timeRemaining}
            progress={progress}
            activeDurationMode={activeDuration.mode}
            onSetWorkDuration={setWorkDuration}
            arrivalTime={arrivalTime}
            onStartTimeChange={handleStartTimeChange}
            totalBreakMinutes={sessionState.totalBreakMinutes}
          />

          <ReportsCard
            taskListSummary={taskListSummary}
            onCopyTaskList={handleCopyTaskList}
            eodReport={aiState.eodReport}
            onEodReportChange={handleEodReportChange}
            onGenerateEodReport={handleGenerateEodReport}
            onCopySummary={handleCopySummary}
            isLoading={aiState.loading === "eod"}
            hasCompletedTasks={hasCompletedTasks}
          />
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto text-center pt-4 flex-shrink-0">
        <p className="text-sm text-muted-foreground px-4 sm:px-6">
          Built by{" "}
          <a
            href="https://www.linkedin.com/in/mitulparmar11/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Mitul Parmar
          </a>{" "}
          and an AI that doesn't understand CSS but keeps trying. (
          <a
            href="https://github.com/mitulparmar7161/time-wise.git"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            open source
          </a>
          )
        </p>
      </footer>
    </div>
  );
}
