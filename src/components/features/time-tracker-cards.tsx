"use client";

import { useDesignTheme } from "@/components/design-theme-provider";
import { TimeTrackerOriginalLayout } from "./themes/time-tracker/OriginalLayout";
import { TimeTrackerBrutalistLayout } from "./themes/time-tracker/BrutalistLayout";
import { LogEntry } from "@/hooks/use-time-tracking";

interface TimeTrackerCardsProps {
  isWorkDayOver: boolean;
  isValid: boolean;
  completionTime: Date | null;
  currentTime: Date;
  overtime: number;
  timeRemaining: number;
  progress: number;
  activeDurationMode: "full" | "half";
  onSetWorkDuration: (mode: "full" | "half") => void;
  arrivalTime: Date | null;
  onStartTimeChange: (newTime: string) => void;
  totalBreakMs: number;
  isOnBreak: boolean;
  onToggleBreak: () => void;
  logs: LogEntry[];
  fullDayHours: string;
  fullDayMinutes: string;
  onDurationSettingsChange: (hours: string, minutes: string) => void;
  onAddManualBreak: (minutes: number) => void;
  workDoneMs: number;
}

export function TimeTrackerCards(props: TimeTrackerCardsProps) {
  const { designTheme } = useDesignTheme();

  // Render the appropriate layout based on design theme
  switch (designTheme) {
    case "brutalist":
      return <TimeTrackerBrutalistLayout {...props} />;
    case "original":
    default:
      return <TimeTrackerOriginalLayout {...props} />;
  }
}
