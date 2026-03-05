"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogEntry } from "@/hooks/use-time-tracking";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeTrackerBrutalistLayoutProps {
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

export function TimeTrackerBrutalistLayout({
  isWorkDayOver,
  isValid,
  completionTime,
  currentTime,
  overtime,
  timeRemaining,
  progress,
  activeDurationMode,
  onSetWorkDuration,
  arrivalTime,
  onStartTimeChange,
  totalBreakMs,
  isOnBreak,
  onToggleBreak,
  logs,
  fullDayHours,
  fullDayMinutes,
  onDurationSettingsChange,
  onAddManualBreak,
  workDoneMs,
}: TimeTrackerBrutalistLayoutProps) {
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isAddingBreak, setIsAddingBreak] = useState(false);
  const [manualBreakMinutes, setManualBreakMinutes] = useState("");
  const [tempHours, setTempHours] = useState(fullDayHours);
  const [tempMinutes, setTempMinutes] = useState(fullDayMinutes);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleSaveStartTime = () => setIsEditingStartTime(false);
  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => onStartTimeChange(e.target.value);
  
  const handleSaveDuration = () => {
    onDurationSettingsChange(tempHours, tempMinutes);
    setIsEditingDuration(false);
  };

  const startEditingDuration = () => {
    if (isEditingDuration) {
      setIsEditingDuration(false);
      return;
    }
    setTempHours(fullDayHours);
    setTempMinutes(fullDayMinutes);
    setIsEditingDuration(true);
  };

  const handleAddBreak = (mode: "add" | "reduce") => {
    let minutes = parseInt(manualBreakMinutes, 10);
    if (!isNaN(minutes) && minutes > 0) {
      if (mode === "reduce") minutes = -minutes;
      onAddManualBreak(minutes);
      setManualBreakMinutes("");
      setIsAddingBreak(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-6 h-full font-sans bg-white text-black">
        {/* Hero Timer Card - Brutalist Style */}
        <Card className="border-[6px] border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none">
          <CardHeader className="pb-2 border-b-[4px] border-black">
            <CardTitle className="font-black text-lg uppercase tracking-tighter">
              {isWorkDayOver ? "⚠ OVERTIME SESSION" : "⏱ TIME REMAINING"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-4 pt-2">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="font-black text-6xl sm:text-7xl tracking-tighter uppercase">
                {isValid ? formatTime(isWorkDayOver ? overtime : timeRemaining).replace(/:/g, "") : "00:00:00"}
              </div>
              {isValid && (
                <div className="flex items-center gap-2 bg-black text-white px-4 py-2 font-black uppercase text-xs">
                  <span>TIME SPENT:</span>
                  <span className="text-sm">{formatTime(workDoneMs)}</span>
                </div>
              )}
              {isWorkDayOver && (
                <span className="text-xs font-black bg-red-500 text-white px-2 py-1 uppercase">
                  OVER LIMIT
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black uppercase px-1">
                <span>PROGRESS</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-6 w-full bg-gray-200 border-[3px] border-black p-1 relative overflow-hidden">
                <div className="h-full bg-black absolute top-0 left-0 transition-all duration-300" style={{ width: `${isValid ? progress : 0}%` }} />
              </div>
            </div>
            {isValid && completionTime && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col items-center justify-center p-3 bg-yellow-300 border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[8px] font-black uppercase mb-1">
                    {isWorkDayOver ? "ENDED AT" : "COMPLETES AT"}
                  </span>
                  <div className="flex items-center gap-2 font-black text-xl">
                    <Icons.Clock className="w-4 h-4" />
                    <span>{format(completionTime, "HH:mm")}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-blue-300 border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[8px] font-black uppercase mb-1">CURRENT TIME</span>
                  <div className="flex items-center gap-2 font-black text-xl">
                    <div className="w-3 h-3 bg-green-500 border-[2px] border-black animate-pulse" />
                    <span>{format(currentTime, "HH:mm")}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-none">
          {/* Session Info Card */}
          <Card className="shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] border-[5px] border-black bg-[#00FF00] rounded-none">
            <CardHeader className="pb-2 border-b-[4px] border-black">
              <CardTitle className="font-black text-lg uppercase flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-none bg-black animate-pulse" />
                  SESSION INFO
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/20 rounded-none" onClick={startEditingDuration}>
                  <Icons.Settings className="h-5 w-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-center items-center py-4 relative">
              <div className={`flex flex-col items-center space-y-6 w-full ${isEditingDuration ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="text-center cursor-pointer" onClick={() => !isEditingStartTime && setIsEditingStartTime(true)}>
                  <Label className="text-xs font-black uppercase mb-2 block">PUNCHED IN AT</Label>
                  {isEditingStartTime ? (
                    <div className="flex items-center gap-2">
                      <Input type="time" value={arrivalTime ? format(arrivalTime, "HH:mm") : ""} onChange={handleTimeInputChange} className="w-auto font-mono text-lg border-[3px] border-black rounded-none" autoFocus onBlur={handleSaveStartTime} onKeyDown={(e) => e.key === 'Enter' && handleSaveStartTime()} />
                      <Button onClick={handleSaveStartTime} size="sm" className="h-10 bg-black text-white hover:bg-black/80 rounded-none font-black">SAVE</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-5xl font-black tracking-tighter">
                        {arrivalTime ? format(arrivalTime, "HH:mm") : "--:--"}
                      </p>
                      <Icons.Pencil className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full">
                  <Button variant={activeDurationMode === "full" ? "default" : "secondary"} size="sm" className="flex-1 bg-black text-white hover:bg-black/80 rounded-none font-black uppercase border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]" onClick={() => onSetWorkDuration("full")}>FULL DAY</Button>
                  <Button variant={activeDurationMode === "half" ? "default" : "secondary"} size="sm" className="flex-1 bg-white text-black hover:bg-gray-200 rounded-none font-black uppercase border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]" onClick={() => onSetWorkDuration("half")}>HALF DAY</Button>
                </div>
              </div>
              {isEditingDuration && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-white rounded-none border-[4px] border-black">
                  <div className="w-full bg-yellow-100 p-4 rounded-none border-[3px] border-black space-y-3">
                    <Label className="text-xs font-black uppercase">SET FULL WORKDAY</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input value={tempHours} onChange={(e) => setTempHours(e.target.value)} className="h-10 font-mono text-center border-[3px] border-black rounded-none font-black" placeholder="HRS" />
                        <span className="text-[8px] font-black uppercase text-center block mt-1">HOURS</span>
                      </div>
                      <span className="font-black text-xl">:</span>
                      <div className="flex-1">
                        <Input value={tempMinutes} onChange={(e) => setTempMinutes(e.target.value)} className="h-10 font-mono text-center border-[3px] border-black rounded-none font-black" placeholder="MIN" />
                        <span className="text-[8px] font-black uppercase text-center block mt-1">MINS</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 h-9 bg-white border-[3px] border-black rounded-none font-black uppercase" onClick={() => setIsEditingDuration(false)}>CANCEL</Button>
                      <Button size="sm" className="flex-1 h-9 bg-black text-white border-[3px] border-black rounded-none font-black uppercase" onClick={handleSaveDuration}>SAVE</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Break Tracker Card */}
          <Card className={`shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] border-[5px] border-black rounded-none ${isOnBreak ? "bg-[#FFA500]" : "bg-[#FFA500]/50"}`}>
            <CardHeader className="pb-2 border-b-[4px] border-black">
              <CardTitle className="font-black text-lg uppercase flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icons.Coffee className={`h-6 w-6 ${isOnBreak ? "animate-bounce" : ""}`} />
                  BREAK TRACKER
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-black/20 rounded-none [&_svg]:size-6" onClick={() => setIsAddingBreak(!isAddingBreak)}>
                      <Icons.Pencil />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="font-black uppercase">MANAGE BREAK</p></TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-center items-center py-6 relative">
              <div className={`flex flex-col items-center w-full ${isAddingBreak ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className={`font-black text-6xl sm:text-7xl mb-4 tracking-tighter uppercase ${isOnBreak ? "animate-pulse" : ""}`}>
                  {formatTime(totalBreakMs).replace(/:/g, "")}
                </div>
                <Button variant={isOnBreak ? "destructive" : "secondary"} className={`w-full max-w-[200px] font-black uppercase rounded-none border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isOnBreak ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white hover:bg-gray-200 text-black"}`} onClick={onToggleBreak} size="lg">
                  {isOnBreak ? "END BREAK" : "START BREAK"}
                </Button>
              </div>
              {isAddingBreak && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-white rounded-none border-[4px] border-black">
                  <div className="w-full space-y-3">
                    <Label className="text-xs font-black uppercase block text-center">MANAGE BREAK TIME</Label>
                    <div className="flex items-center gap-2 justify-center">
                      <div className="flex-1">
                        <Input value={manualBreakMinutes} onChange={(e) => setManualBreakMinutes(e.target.value)} className="h-10 font-mono text-center border-[3px] border-black rounded-none font-black" placeholder="MIN" type="number" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddBreak("add")} />
                        <span className="text-[8px] font-black uppercase text-center block mt-1">MINUTES</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 h-9 bg-white border-[3px] border-black rounded-none font-black uppercase" onClick={() => setIsAddingBreak(false)}>CANCEL</Button>
                      <Button size="sm" variant="destructive" className="flex-1 h-9 bg-red-500 text-white border-[3px] border-black rounded-none font-black uppercase" onClick={() => handleAddBreak("reduce")}>REDUCE</Button>
                      <Button size="sm" className="flex-1 h-9 bg-black text-white border-[3px] border-black rounded-none font-black uppercase" onClick={() => handleAddBreak("add")}>ADD</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Logs Card */}
        {logs && logs.length > 0 && (
          <Card className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-[5px] border-black bg-white rounded-none flex-1 min-h-0 flex flex-col">
            <CardHeader className="flex-none py-3 px-4 border-b-[4px] border-black bg-gray-100">
              <CardTitle className="font-headline text-sm font-black uppercase flex items-center gap-2">
                <Icons.ListTodo className="h-5 w-5" />
                SESSION LOGS
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
              <ScrollArea className="h-full w-full p-4">
                <div className="space-y-2">
                  {logs.slice().reverse().map((log, index) => (
                    <div key={index} className="flex items-center justify-between text-sm border-[3px] border-black p-2 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 border-[2px] border-black ${log.type === 'punch-in' ? 'bg-green-400' : log.type === 'break-start' ? 'bg-amber-400' : log.type === 'break-end' ? 'bg-blue-400' : 'bg-gray-300'}`}>
                          {log.type === 'punch-in' && <Icons.Play className="h-3 w-3 fill-current" />}
                          {log.type === 'break-start' && <Icons.Coffee className="h-3 w-3" />}
                          {log.type === 'break-end' && <Icons.CheckCircle className="h-3 w-3" />}
                        </div>
                        <span className="font-black uppercase text-sm">{log.message}</span>
                      </div>
                      <span className="font-mono text-xs font-bold">{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
