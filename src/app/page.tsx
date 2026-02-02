"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import {
  differenceInHours,
  subDays,
  set,
  isValid,
  format,
  differenceInMinutes,
  differenceInMilliseconds,
} from "date-fns";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimeTrackerCards } from "@/components/features/time-tracker-cards";
import { WelcomeDialog } from "@/components/features/welcome-dialog";
import { AboutSheet } from "@/components/features/about-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductivityChart, DailyRecord } from "@/components/features/productivity-chart";
import { HistoryCalendar } from "@/components/features/history-calendar";
import { useNotifications } from "@/hooks/use-notifications";
import { usePiP } from "@/hooks/use-pip";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { ProductTour } from "@/components/features/product-tour";

const APP_SETTINGS_KEY = "timewiseSettings";
const APP_SESSION_KEY = "timewiseSession";
const APP_HISTORY_KEY = "timewiseHistory";

export type LogEntry = {
  type: "punch-in" | "break-start" | "break-end" | "reset" | "manual-break";
  timestamp: string;
  message: string;
  durationMs?: number;
};

interface SessionState {
  sessionDate: string;
  startTime: string;
  totalBreakMinutes: number; // Kept for backward compatibility/reference if needed, but primary is Ms now
  totalBreakMs: number;
  isOnBreak: boolean;
  breakStartTime: string | null;
  logs: LogEntry[];
}

export default function Home() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [settings, setSettings] = useLocalStorage(APP_SETTINGS_KEY, {
    fullDayHours: "8",
    fullDayMinutes: "0",
    apiKey: "", 
  });

  const [sessionState, setSessionState] = useLocalStorage<SessionState>(APP_SESSION_KEY, {
    sessionDate: "",
    startTime: "",
    totalBreakMinutes: 0,
    totalBreakMs: 0,
    isOnBreak: false,
    breakStartTime: null,
    logs: [],
  });

  const [history, setHistory] = useLocalStorage<DailyRecord[]>(APP_HISTORY_KEY, []);
  const { sendNotification } = useNotifications();
  const { togglePiP, pipWindow } = usePiP();
  const [continuousWorkMin, setContinuousWorkMin] = useState(0); // Track minutes worked without break

  const [activeDuration, setActiveDuration] = useState({
    hours: 8,
    minutes: 0,
    mode: "full" as "full" | "half",
  });

  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasCompletedTour] = useLocalStorage("timewise_tour_completed", false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsClient(true);
    
    // Auto-start tour if not completed
    if (!hasCompletedTour) {
        const timer = setTimeout(() => setIsTourOpen(true), 1000);
        return () => clearTimeout(timer);
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    
    // Migration: ensure logs exists
    let newState = { ...sessionState };
    let hasChanges = false;

    if (!newState.logs) {
        newState.logs = [];
        hasChanges = true;
    }
    
    // Migration: ensure totalBreakMs exists
    if (newState.totalBreakMs === undefined) {
        newState.totalBreakMs = (newState.totalBreakMinutes || 0) * 60 * 1000;
        hasChanges = true;
    }

    if (hasChanges) {
        setSessionState(newState);
    }
    
    if (sessionState.sessionDate !== todayStr) {
      if (!sessionState.startTime) {
          startNewSession(); // Initialize
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    const fullHours = parseInt(settings.fullDayHours, 10) || 0;
    const fullMinutes = parseInt(settings.fullDayMinutes, 10) || 0;
    setActiveDuration({ hours: fullHours, minutes: fullMinutes, mode: "full" });
  }, [settings.fullDayHours, settings.fullDayMinutes]);

  const getTimeRemaining = (now = new Date()) => {
    if (!sessionState.startTime) return 0;
    const workDurationMs =
      (activeDuration.hours * 60 + activeDuration.minutes) * 60 * 1000;
    const elapsedTime = now.getTime() - new Date(sessionState.startTime).getTime();
    
    // Calculate total break time
    let totalBreak = sessionState.totalBreakMs;
    if (sessionState.isOnBreak && sessionState.breakStartTime) {
      totalBreak += now.getTime() - new Date(sessionState.breakStartTime).getTime();
    }
    
    // Time remaining = Work Duration - (Elapsed - Break)
    return workDurationMs - (elapsedTime - totalBreak);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (!sessionState.isOnBreak) {
         setContinuousWorkMin(prev => prev + (1/60));
      }

      if (
        sessionState.startTime &&
        differenceInHours(now, new Date(sessionState.startTime)) >= 12
      ) {
        startNewSession();
      }
    }, 1000); // Update every second to allow real-time timer
    return () => clearInterval(interval);
  }, [sessionState.startTime, sessionState.isOnBreak]);



  // Reset continuous work timer when break starts
  useEffect(() => {
    if (sessionState.isOnBreak) {
        setContinuousWorkMin(0);
    }
  }, [sessionState.isOnBreak]);



  const startNewSession = (startTime = new Date()) => {
    const todayStr = format(startTime, "yyyy-MM-dd");
    const newLog: LogEntry = {
        type: "punch-in",
        timestamp: startTime.toISOString(),
        message: "Punched In",
    };

    setSessionState({
      sessionDate: todayStr,
      startTime: startTime.toISOString(),
      totalBreakMinutes: 0,
      totalBreakMs: 0,
      isOnBreak: false,
      breakStartTime: null,
      logs: [newLog],
    });
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

    toast({
      title: "Settings Saved",
      description: "Your new settings have been saved.",
    });
    return true;
  };

  const {
    arrivalTime,
    completionTime,
    timeRemaining,
    overtime,
    progress,
    isWorkDayOver,
    isValid: isDurationValid,
    currentTotalBreakMs,
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
        currentTotalBreakMs: 0,
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
        currentTotalBreakMs: 0,
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
         currentTotalBreakMs: 0,
      };
    }
    const workingMs = (workingHours * 60 + workingMinutes) * 60 * 1000;
    
    // Calculate current break duration if active
    let additionalBreakMs = 0;
    if (sessionState.isOnBreak && sessionState.breakStartTime) {
        additionalBreakMs = Math.max(0, currentTime.getTime() - new Date(sessionState.breakStartTime).getTime());
    }

    const totalBreakTimeMs = (sessionState.totalBreakMs || 0) + additionalBreakMs;

    const completionTimeDate = new Date(
      arrivalTimeDate.getTime() + workingMs + totalBreakTimeMs
    );
    const timeRemainingMs =
      completionTimeDate.getTime() - currentTime.getTime();

    // Work done = Time elapsed since arrival - Total Break Time
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
      currentTotalBreakMs: totalBreakTimeMs,
    };
  }, [
    activeDuration,
    currentTime,
    isClient,
    sessionState.startTime,
    sessionState.totalBreakMs,
    sessionState.isOnBreak,
    sessionState.breakStartTime
  ]);



  // Sync current session to history whenever relevant data changes
  useEffect(() => {
    if (!sessionState.startTime) return;

    const todayStr = format(new Date(sessionState.startTime), "yyyy-MM-dd");
    const now = new Date();
    
    // Calculate current stats
    const breakMs = sessionState.totalBreakMs || 0;
    const additionalBreakMs = (sessionState.isOnBreak && sessionState.breakStartTime)
        ? Math.max(0, now.getTime() - new Date(sessionState.breakStartTime).getTime())
        : 0;
    const totalBreak = breakMs + additionalBreakMs;
    
    // Work done calculation (reused logic roughly)
    const arrivalTimeDate = new Date(sessionState.startTime);
    const elapsedMs = Math.max(0, now.getTime() - arrivalTimeDate.getTime());
    const workDoneMs = elapsedMs - totalBreak;

    const currentRecord: DailyRecord = {
        date: todayStr,
        totalWorkMs: Math.max(0, workDoneMs),
        totalBreakMs: totalBreak,
        startTime: sessionState.startTime,
        endTime: null, // Active session
        status: 'active'
    };

    setHistory(prev => {
        const existingIndex = prev.findIndex(r => r.date === todayStr);
        if (existingIndex >= 0) {
            const newHistory = [...prev];
            newHistory[existingIndex] = currentRecord;
            return newHistory;
        } else {
            return [...prev, currentRecord];
        }
    });

  }, [sessionState, currentTime, setHistory]); 
  
  // Notifications logic
  useEffect(() => {
     if (isWorkDayOver && timeRemaining <= 0 && timeRemaining > -2000) { 
         sendNotification("Mission Complete 🎮", {
             body: "Achievement Unlocked: Survived The Workday. GO HOME 🏆",
         });
     }
  }, [isWorkDayOver, timeRemaining, sendNotification]);

  // Break Reminder Logic (Every 60 mins of continuous work)
  useEffect(() => {
      // Check if we hit a 60-minute mark (roughly, within a small window to trigger once)
      const mins = Math.floor(continuousWorkMin);
      if (mins > 0 && mins % 60 === 0 && Math.abs(continuousWorkMin - mins) < 0.02) { 
          const messages = [
              "⚠️ Low Stamina. Drink a potion (water).",
              "POV: You've been working for 1 hour straight. Take a break 💀",
              "🛑 AFK Check. Step away from the keyboard.",
              "Break time. Save your progress and rest."
          ];
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          
          sendNotification("System Alert 👾", {
             body: randomMsg,
          });
      }
  }, [continuousWorkMin, sendNotification]);

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
       logs: prev.logs && prev.logs.length > 0
           ? prev.logs.map((log, index) => 
               index === 0 && log.type === "punch-in" 
               ? { ...log, timestamp: potentialStartTime.toISOString() } 
               : log
           )
           : [{ type: "punch-in", timestamp: potentialStartTime.toISOString(), message: "Punched In" }]
    }));
  };

  const handleToggleBreak = () => {
      const now = new Date();
      if (sessionState.isOnBreak) {
          // End Break
          const breakStart = new Date(sessionState.breakStartTime!);
          const durationMs = Math.max(0, differenceInMilliseconds(now, breakStart));
          const durationMinutes = Math.floor(durationMs / 1000 / 60);
          
          const newLog: LogEntry = {
              type: "break-end",
              timestamp: now.toISOString(),
              message: `Break Ended (${durationMinutes}m)`,
              durationMs: durationMs,
          };

          setSessionState(prev => ({
              ...prev,
              isOnBreak: false,
              breakStartTime: null,
              totalBreakMinutes: prev.totalBreakMinutes + durationMinutes,
              totalBreakMs: (prev.totalBreakMs || 0) + durationMs,
              logs: [...(prev.logs || []), newLog]
          }));
      } else {
          // Start Break
          const newLog: LogEntry = {
              type: "break-start",
              timestamp: now.toISOString(),
              message: "Break Started",
          };

          setSessionState(prev => ({
              ...prev,
              isOnBreak: true,
              breakStartTime: now.toISOString(),
              logs: [...(prev.logs || []), newLog]
          }));
      }
  };

  const handleAddManualBreak = (minutes: number) => {
      const now = new Date();
      const durationMs = minutes * 60 * 1000;
      const isReduction = minutes < 0;
      
      const newLog: LogEntry = {
          type: "manual-break",
          timestamp: now.toISOString(),
          message: isReduction 
            ? `Break Adjustment (${minutes}m)` 
            : `Manual Break (+${minutes}m)`,
          durationMs: durationMs,
      };

      setSessionState(prev => {
          // Prevent total from going below 0
          const currentTotalMs = prev.totalBreakMs || 0;
          const currentTotalMin = prev.totalBreakMinutes || 0;
          
          if (isReduction && currentTotalMs + durationMs < 0) {
               toast({
                   title: "Cannot Reduce Break",
                   description: "Break time cannot be negative.",
                   variant: "destructive"
               });
               return prev;
          }

          toast({
            title: isReduction ? "Break Reduced" : "Break Added",
            description: `${isReduction ? 'Removed' : 'Added'} ${Math.abs(minutes)} minutes.`,
          });

          return {
            ...prev,
            totalBreakMinutes: Math.max(0, currentTotalMin + minutes),
            totalBreakMs: Math.max(0, currentTotalMs + durationMs),
            logs: [...(prev.logs || []), newLog]
          };
      });
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-background via-secondary/20 to-background">
      <WelcomeDialog
        open={isWelcomeDialogOpen}
        onOpenChange={setIsWelcomeDialogOpen}
      />

      <header className="w-full max-w-7xl flex justify-between items-center mb-4 mx-auto flex-none">
        <h1 className="text-3xl sm:text-4xl font-bold font-headline text-primary">
          TimeWise
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsTourOpen(true)} title="Start Tour">
             <Icons.Rocket className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <AboutSheet />
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto flex flex-col gap-6 flex-1 min-h-0">
        <Tabs defaultValue="today" className="w-full flex flex-col flex-1 min-h-0">
          <div className="flex justify-center mb-4 relative">
            <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="analytics" id="tour-analytics-tab">Analytics & History</TabsTrigger>
            </TabsList>
            
            <div className="absolute right-0 top-0 hidden md:block">
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePiP}
                    className="flex gap-2 items-center text-xs h-8"
                    title="Toggle Picture-in-Picture Mode"
                    id="tour-pip-button"
                 >
                    <Icons.PictureInPicture className="h-4 w-4" />
                    <span>Mini Timer</span>
                 </Button>
            </div>
          </div>

          <TabsContent value="today" className="flex-1 min-h-0 mt-0" id="tour-timer-card">
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
            totalBreakMs={currentTotalBreakMs}
            isOnBreak={sessionState.isOnBreak}
            onToggleBreak={handleToggleBreak}
            onAddManualBreak={handleAddManualBreak}
            logs={sessionState.logs || []}
            fullDayHours={settings.fullDayHours}
            fullDayMinutes={settings.fullDayMinutes}
            onDurationSettingsChange={(hours, minutes) => {
                setSettings(prev => ({ ...prev, fullDayHours: hours, fullDayMinutes: minutes }));
                const h = parseInt(hours, 10) || 0;
                const m = parseInt(minutes, 10) || 0;
                if (activeDuration.mode === "full") {
                    setActiveDuration(prev => ({ ...prev, hours: h, minutes: m }));
                } else {
                        const totalMinutes = (h * 60 + m) / 2;
                        setActiveDuration(prev => ({
                            ...prev,
                            hours: Math.floor(totalMinutes / 60),
                            minutes: totalMinutes % 60,
                        }));
                }
                toast({ title: "Updated", description: "Work duration settings updated." });
            }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 min-h-0 mt-0 overflow-y-auto">
             <div className="space-y-6 pb-6">
                <ProductivityChart history={history} />
                <HistoryCalendar history={history} />
             </div>
          </TabsContent>
        </Tabs>


        {/* Document PiP Portal */}
        {pipWindow && createPortal(
          <div className="flex flex-col items-center justify-center h-screen w-screen bg-background text-foreground overflow-hidden">
              <h2 className="font-bold font-mono tracking-wider leading-none select-none" style={{ fontSize: "18vw" }}>
                  {formatTime(Math.max(0, timeRemaining))}
              </h2>
              <div className="flex flex-col items-center gap-2 mt-[2vh]">
                 <span className={`font-medium px-3 py-0.5 rounded-full whitespace-nowrap ${sessionState.isOnBreak ? 'bg-yellow-500/20 text-yellow-500' : isWorkDayOver ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`} style={{ fontSize: "4vw" }}>
                    {sessionState.isOnBreak ? "On Break ☕" : isWorkDayOver ? "Done ✅" : "Working 👨‍💻"}
                 </span>
                 
                 <Button 
                    variant={sessionState.isOnBreak ? "default" : "secondary"}
                    size="sm"
                    onClick={handleToggleBreak}
                    className="h-auto py-1 px-4"
                    style={{ fontSize: "5vw" }}
                 >
                    {sessionState.isOnBreak ? "Resume Work" : "Take a Break"}
                 </Button>
              </div>
          </div>,
          pipWindow.document.body
        )}
        
        <ProductTour isOpen={isTourOpen} onOpenChange={setIsTourOpen} />
      </main>

      <footer className="w-full max-w-7xl mx-auto text-center pt-4 pb-2 flex-none">
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
          (
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
