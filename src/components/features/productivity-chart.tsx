"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, isSameDay, parseISO } from "date-fns";

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  totalWorkMs: number;
  totalBreakMs: number;
  startTime: string;
  endTime: string | null;
  status: 'completed' | 'active';
}

interface ProductivityChartProps {
  history: DailyRecord[];
  currentSession?: DailyRecord; // Include current session in stats
}

const chartConfig = {
  work: {
    label: "Work Hours",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function ProductivityChart({ history, currentSession }: ProductivityChartProps) {
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();

    // Create entry for last 7 days
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, "yyyy-MM-dd");
      
      let workMs = 0;

      // Check history
      const historyRecord = history.find(r => r.date === dayStr);
      if (historyRecord) {
        workMs += historyRecord.totalWorkMs;
      }

      // Check current session
      if (currentSession && currentSession.date === dayStr) {
        // If current session is today (or the specific history day we are checking), use the potentially more up-to-date value
        // or add it if not present in history yet.
        // Usually history doesn't contain today until finalized, depending on logic.
        // For simplicity, let's assume history contains *completed* days and currentSession is *active* day.
        workMs = Math.max(workMs, currentSession.totalWorkMs);
      }

      data.push({
        date: format(day, "MMM dd"),
        fullDate: dayStr,
        hours: parseFloat((workMs / (1000 * 60 * 60)).toFixed(1)), // Convert ms to hours
      });
    }

    return data;
  }, [history, currentSession]);

  const totalHoursLast7Days = chartData.reduce((acc, curr) => acc + curr.hours, 0);
  const averageHours = (totalHoursLast7Days / 7).toFixed(1);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Productivity Trends</CardTitle>
        <CardDescription>
          You've worked <span className="font-semibold text-primary">{totalHoursLast7Days.toFixed(1)} hours</span> in the last 7 days.
          Average: {averageHours}h/day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
                hide 
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="hours"
              fill="var(--color-work)"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
