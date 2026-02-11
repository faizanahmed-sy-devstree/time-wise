"use client";

import { useTimeTracking } from "@/hooks/use-time-tracking";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimeTrackerCards } from "@/components/features/time-tracker-cards";
import { WelcomeDialog } from "@/components/features/welcome-dialog";
import { AboutSheet } from "@/components/features/about-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MewurkLogs } from "@/components/features/mewurk-logs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const {
      isClient,
      settings,
      setSettings,
      sessionState,
      activeDuration,
      setActiveDuration,
      currentTime,
      isWorkDayOver,
      isDurationValid,
      completionTime,
      overtime,
      timeRemaining,
      progress,
      activeDurationMode,
      setWorkDuration,
      arrivalTime,
      handleStartTimeChange,
      currentTotalBreakMs,
      handleToggleBreak,
  } = useTimeTracking();


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
          <ThemeToggle />
          <AboutSheet />
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto flex flex-col gap-6 flex-1 min-h-0">
        <Tabs defaultValue="tracker" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="tracker">Time Tracker</TabsTrigger>
            <TabsTrigger value="mewurk">Mewurk Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracker" className="h-full mt-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar data-[state=active]:flex data-[state=active]:flex-col">
            <TimeTrackerCards
              isWorkDayOver={isWorkDayOver}
              isValid={isDurationValid}
              completionTime={completionTime}
              currentTime={currentTime}
              overtime={overtime}
              timeRemaining={timeRemaining}
              progress={progress}
              activeDurationMode={activeDurationMode}
              onSetWorkDuration={setWorkDuration}
              arrivalTime={arrivalTime}
              onStartTimeChange={handleStartTimeChange}
              totalBreakMs={currentTotalBreakMs}
              isOnBreak={sessionState.isOnBreak}
              onToggleBreak={handleToggleBreak}
              logs={sessionState.logs || []}
              fullDayHours={settings.fullDayHours}
              fullDayMinutes={settings.fullDayMinutes}
              onDurationSettingsChange={(hours, minutes) => {
                  setSettings(prev => ({ ...prev, fullDayHours: hours, fullDayMinutes: minutes }));
                  // Logic to update active duration immediately if in Full mode
                  // This mimics the effect inside `handleSaveSettings` but for specific values
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
          
          <TabsContent value="mewurk" className="h-full mt-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar data-[state=active]:flex data-[state=active]:flex-col">
             <MewurkLogs 
                targetHours={Number(settings.fullDayHours) || 8} 
                targetMinutes={Number(settings.fullDayMinutes) || 0}
                onSettingsChange={(hours, minutes) => {
                    setSettings((prev) => ({
                         ...prev,
                         fullDayHours: hours,
                         fullDayMinutes: minutes,
                    }));
                     toast({ title: "Updated", description: "Work duration settings updated." });
                }}
             />
          </TabsContent>
        </Tabs>
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
