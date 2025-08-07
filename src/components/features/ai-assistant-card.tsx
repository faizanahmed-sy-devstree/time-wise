
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/ui/icons';

interface AiAssistantCardProps {
  tasks: string;
  onTasksChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isValid: boolean;
}

export function AiAssistantCard({
  tasks,
  onTasksChange,
  onGenerate,
  isLoading,
  isValid,
}: AiAssistantCardProps) {
  return (
    <Card className="shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
          <Icons.Bot className="text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription>Generate a schedule from your task list.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <div className="grid gap-2 flex-grow">
          <Label htmlFor="tasks">Your Tasks for Today</Label>
          <Textarea
            id="tasks"
            placeholder="e.g.,- Finish the Q3 report&#10;- Review 3 PRs&#10;- Prepare for tomorrow's presentation"
            value={tasks}
            onChange={(e) => onTasksChange(e.target.value)}
            disabled={isLoading}
            rows={5}
            className="resize-none"
          />
        </div>
        <div className="flex flex-col gap-2 mt-auto pt-4">
          <Button onClick={onGenerate} disabled={isLoading || !tasks || !isValid} className="w-full">
            {isLoading ? <Icons.Loader className="mr-2 h-4 w-4 animate-spin" /> : <Icons.Sparkles className="mr-2 h-4 w-4" />}
            {isLoading ? 'Generating...' : 'Generate Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

    