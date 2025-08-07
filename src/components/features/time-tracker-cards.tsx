"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { format } from "date-fns";

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
  totalBreakMinutes: number;
}

export function TimeTrackerCards({
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
  totalBreakMinutes,
}: TimeTrackerCardsProps) {
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const handleSaveStartTime = () => {
    setIsEditingStartTime(false);
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStartTimeChange(e.target.value);
  };

  return (
    <>
      <Card className="text-center shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            {isWorkDayOver ? "Overtime" : "Time Remaining"}
          </CardTitle>
          {isValid && completionTime && (
            <CardDescription>
              {isWorkDayOver ? "Workday ended at" : "Ends around"}{" "}
              {format(completionTime, "hh:mm a")}
              <span className="text-muted-foreground/80">
                {" / Current: "}
                {format(currentTime, "hh:mm a")}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`font-headline font-bold text-5xl sm:text-6xl ${
              isWorkDayOver ? "text-orange-500" : "text-foreground"
            }`}
          >
            {isValid
              ? formatTime(isWorkDayOver ? overtime : timeRemaining)
              : "00:00:00"}
          </div>
          <Progress value={isValid ? progress : 0} className="w-full" />
          {!isValid && (
            <p className="text-sm text-destructive">
              Please set a valid work duration in settings.
            </p>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant={activeDurationMode === "full" ? "default" : "outline"}
              size="sm"
              className="w-full max-w-xs"
              onClick={() => onSetWorkDuration("full")}
            >
              Full Day
            </Button>
            <Button
              variant={activeDurationMode === "half" ? "default" : "outline"}
              size="sm"
              className="w-full max-w-xs"
              onClick={() => onSetWorkDuration("half")}
            >
              Half Day
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg h-full flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center justify-between">
              <span>Session Info</span>
            </CardTitle>
            <CardDescription>Your work session details.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow justify-center items-center space-y-4">
            <div className="text-center">
              {isEditingStartTime ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="time"
                    value={arrivalTime ? format(arrivalTime, "HH:mm") : ""}
                    onChange={handleTimeInputChange}
                    className="w-auto"
                  />
                  <Button onClick={handleSaveStartTime} size="sm">
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold font-mono">
                    {arrivalTime
                      ? arrivalTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "..."}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditingStartTime(true)}
                  >
                    <Icons.Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Label className="text-muted-foreground">Punched In At</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg h-full flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Icons.Coffee className="text-amber-500" />
              Break Tracker
            </CardTitle>
            <CardDescription>breaks from your schedule.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow justify-center items-center">
            <div className="text-3xl font-bold font-mono">
              {formatTime(totalBreakMinutes * 60 * 1000)}
            </div>
            <p className="text-muted-foreground">Total break time today</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
