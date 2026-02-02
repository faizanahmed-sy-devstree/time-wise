"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DailyRecord } from "./productivity-chart";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface HistoryCalendarProps {
  history: DailyRecord[];
}

export function HistoryCalendar({ history }: HistoryCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Create a map for quick lookup
  const historyMap = history.reduce((acc, record) => {
    acc[record.date] = record;
    return acc;
  }, {} as Record<string, DailyRecord>);

  const selectedRecord = date ? historyMap[format(date, "yyyy-MM-dd")] : undefined;

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr]">
      <Card className="flex-none">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow"
            modifiers={{
                worked: (date) => !!historyMap[format(date, "yyyy-MM-dd")]
            }}
            modifiersStyles={{
                worked: { fontWeight: 'bold', textDecoration: 'underline decoration-primary' }
            }}
          />
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-center">
        <CardHeader>
          <CardTitle>
            {date ? format(date, "MMMM do, yyyy") : "Select a date"}
          </CardTitle>
          <CardDescription>
            {selectedRecord 
                ? "Daily Summary" 
                : date 
                    ? "No data recorded for this day." 
                    : "Pick a date to view history."}
          </CardDescription>
        </CardHeader>
        {selectedRecord && (
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Total Work</span>
                <span className="text-xl font-bold font-mono text-primary">
                    {formatDuration(selectedRecord.totalWorkMs)}
                </span>
             </div>
             
             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Total Break</span>
                <span className="text-lg font-mono">
                    {formatDuration(selectedRecord.totalBreakMs)}
                </span>
             </div>

             <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 border rounded">
                    <span className="block text-xs text-muted-foreground uppercase">Started</span>
                    <span className="font-mono font-medium">{format(new Date(selectedRecord.startTime), "hh:mm a")}</span>
                </div>
                <div className="p-2 border rounded">
                    <span className="block text-xs text-muted-foreground uppercase">Ended</span>
                    <span className="font-mono font-medium">
                        {selectedRecord.endTime ? format(new Date(selectedRecord.endTime), "hh:mm a") : "Active"}
                    </span>
                </div>
             </div>
             
             <div className="pt-2">
                 <Badge variant={selectedRecord.status === 'completed' ? 'secondary' : 'default'}>
                    {selectedRecord.status === 'completed' ? 'Completed' : 'In Progress'}
                 </Badge>
             </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
