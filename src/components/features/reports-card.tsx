"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/ui/icons";
import type { EodReport } from "@/ai/flows/eod-report-flow";

interface ReportsCardProps {
  taskListSummary: string;
  onCopyTaskList: () => void;
  eodReport: EodReport | null;
  onEodReportChange: (value: string) => void;
  onGenerateEodReport: () => void;
  onCopySummary: () => void;
  isLoading: boolean;
  hasCompletedTasks: boolean;
}

export function ReportsCard({
  taskListSummary,
  onCopyTaskList,
  eodReport,
  onEodReportChange,
  onGenerateEodReport,
  onCopySummary,
  isLoading,
  hasCompletedTasks,
}: ReportsCardProps) {
  const [isEditingReport, setIsEditingReport] = useState(false);

  return (
    <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Tabs defaultValue="list" className="flex flex-col flex-1">
        <CardHeader className="border-b px-4 pt-4 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Reports</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Review tasks or generate an EOD summary.
              </CardDescription>
            </div>
            <TabsList className="grid grid-cols-2 gap-2 w-[150px] sm:w-auto">
              <TabsTrigger value="list">
                <Icons.ListTodo className="h-4 w-4 mr-1.5" />
                List
              </TabsTrigger>
              <TabsTrigger value="eod">
                <Icons.FileText className="h-4 w-4 mr-1.5" />
                EOD
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 p-4 pt-2">
          {/* --- TASK LIST TAB --- */}
          <TabsContent value="list" className="flex flex-col overflow-hidden">
            <div className="flex justify-end mb-2 h-fill">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCopyTaskList}
              >
                <Icons.Copy className="h-4 w-4" />
                <span className="sr-only">Copy Task List</span>
              </Button>
            </div>
            <ScrollArea className="h-[170px] overflow-auto border rounded-md bg-muted/20 p-4">
              {taskListSummary === "Your task list is empty." ||
              taskListSummary ===
                "No tasks or meetings in your schedule yet." ? (
                <div className="text-sm text-muted-foreground">
                  {taskListSummary}
                </div>
              ) : (
                <pre className="text-sm whitespace-pre-wrap">
                  {taskListSummary}
                </pre>
              )}
            </ScrollArea>
          </TabsContent>

          {/* --- EOD TAB --- */}
          <TabsContent value="eod" className="flex-1 flex flex-col">
            {eodReport ? (
              <div className="flex flex-col h-full">
                <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onGenerateEodReport}
                    disabled={isLoading || !hasCompletedTasks}
                  >
                    {isLoading ? (
                      <Icons.Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.RefreshCcw className="h-4 w-4" />
                    )}
                    <span className="sr-only">Regenerate</span>
                  </Button>
                  {!isEditingReport && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onCopySummary}
                    >
                      <Icons.Copy className="h-4 w-4" />
                      <span className="sr-only">Copy Summary</span>
                    </Button>
                  )}
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsEditingReport(!isEditingReport)}
                  >
                    {isEditingReport ? (
                      <Icons.Check className="h-4 w-4" />
                    ) : (
                      <Icons.Pencil className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {isEditingReport ? "Save Report" : "Edit Report"}
                    </span>
                  </Button> */}
                </div>
                <ScrollArea className="h-[170px] border rounded-md bg-muted/20 p-4">
                  {isEditingReport ? (
                    <Textarea
                      value={eodReport.summary}
                      onChange={(e) => onEodReportChange(e.target.value)}
                      className="w-full h-full resize-none text-sm"
                    />
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">
                      {eodReport.summary}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full border rounded-md p-6 bg-muted/20">
                <Icons.FileText className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-base font-semibold">
                  No EOD Report Generated
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete some tasks and generate a report.
                </p>
                <Button
                  onClick={onGenerateEodReport}
                  disabled={isLoading || !hasCompletedTasks}
                  className="mt-4"
                >
                  {isLoading ? (
                    <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate EOD Report
                </Button>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
