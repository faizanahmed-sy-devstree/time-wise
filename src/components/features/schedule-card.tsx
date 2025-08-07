'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import type { ScheduleBlock } from '@/app/page';

interface ScheduleCardProps {
  schedule: ScheduleBlock[];
  setSchedule: (schedule: ScheduleBlock[]) => void;
  fullSchedule: (ScheduleBlock & { startTime: Date; endTime: Date })[];
  completionTime: Date | null;
  onToggleCompletion: (index: number) => void;
}

export function ScheduleCard({
  schedule,
  setSchedule,
  fullSchedule,
  completionTime,
  onToggleCompletion,
}: ScheduleCardProps) {
  const [isEditingSchedule, setIsEditingSchedule] = useState(true);
  const [newlyAddedBlockId, setNewlyAddedBlockId] = useState<string | null>(null);

  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const draggedItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addScheduleBlock = useCallback((type: 'work' | 'break' | 'meeting') => {
    const newScheduleItems = [...schedule];
    const taskText = type === 'work' ? 'New Task' : type === 'break' ? 'New Break' : 'New Meeting';
    const newId = `local-${Date.now()}-${Math.random()}`;

    const newBlock: ScheduleBlock = {
      id: newId,
      type: type,
      task: taskText,
      duration: type === 'break' ? 15 : 30,
      completed: false,
    };

    newScheduleItems.push(newBlock);
    setSchedule(newScheduleItems);
    setNewlyAddedBlockId(newId);
  }, [schedule, setSchedule]);

  const deleteScheduleBlock = useCallback((index: number) => {
    const newScheduleItems = [...schedule];
    newScheduleItems.splice(index, 1);
    setSchedule(newScheduleItems);
  }, [schedule, setSchedule]);

  const handleScheduleChange = (index: number, field: 'task' | 'duration', value: string) => {
    const newScheduleItems = [...schedule];
    const updatedBlock = { ...newScheduleItems[index] };

    if (field === 'duration') {
      if (/^\d*$/.test(value)) {
        updatedBlock.duration = Number(value);
      }
    } else if (field === 'task') {
      updatedBlock.task = value;
    }
    newScheduleItems[index] = updatedBlock;
    setSchedule(newScheduleItems);
  };

  const handleDurationBlur = (index: number) => {
    const newScheduleItems = [...schedule];
    const block = newScheduleItems[index];
    const duration = block.duration || 0;
    newScheduleItems[index] = { ...block, duration };
    setSchedule(newScheduleItems);
  };

  const handleSaveSchedule = () => {
    const cleanedSchedule = schedule
      .filter((block) => block.task.trim() !== '' && (block.duration || 0) > 0)
      .map((block) => ({ ...block, duration: block.duration || 0 }));
    setSchedule(cleanedSchedule);
    setIsEditingSchedule(false);
  };

  const handleDragEnd = () => {
    const startIdx = draggedItemIndex.current;
    const endIdx = dragOverItemIndex.current;

    if (startIdx !== null && endIdx !== null && startIdx !== endIdx) {
      const items = Array.from(schedule);
      const [reorderedItem] = items.splice(startIdx, 1);
      items.splice(endIdx, 0, reorderedItem);
      setSchedule(items);
    }

    draggedItemIndex.current = null;
    dragOverItemIndex.current = null;
    setDragOverIndex(null);
  };

  useEffect(() => {
    if (newlyAddedBlockId) {
      const itemEl = itemRefs.current.get(newlyAddedBlockId);
      if (itemEl) {
        itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = itemEl.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
      setTimeout(() => setNewlyAddedBlockId(null), 1500);
    }
  }, [newlyAddedBlockId]);

  return (
    <Card className="shadow-lg flex flex-col h-[500px]"> {/* Fixed height */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Your Schedule</CardTitle>
          <CardDescription>Review and customize your plan.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isEditingSchedule && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Icons.Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => addScheduleBlock('work')}>
                  <Icons.Play className="mr-2 h-4 w-4" />
                  <span>Add Task</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addScheduleBlock('meeting')}>
                  <Icons.Briefcase className="mr-2 h-4 w-4" />
                  <span>Add Meeting</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addScheduleBlock('break')}>
                  <Icons.Coffee className="mr-2 h-4 w-4" />
                  <span>Add Break</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isEditingSchedule ? handleSaveSchedule() : setIsEditingSchedule(true))}
          >
            {isEditingSchedule ? <Icons.Check className="h-4 w-4" /> : <Icons.Pencil className="h-4 w-4" />}
            <span className="sr-only">{isEditingSchedule ? 'Save Schedule' : 'Edit Schedule'}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-6 pt-0 overflow-hidden"> {/* prevents outer scroll */}
        <ScrollArea className="overflow-y-auto pr-4 -mr-4 flex-1"> {/* scrolls internally */}
          <div className="space-y-4">
            {fullSchedule.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <p>Your schedule is empty.</p>
                <p>Use the AI assistant or edit the schedule to add tasks.</p>
              </div>
            ) : (
              fullSchedule.map((block, index) => {
                const Icon =
                  block.type === 'work' ? Icons.Play : block.type === 'meeting' ? Icons.Briefcase : Icons.Coffee;
                const iconColor =
                  block.type === 'work' ? 'text-primary' : block.type === 'meeting' ? 'text-purple-500' : 'text-amber-500';

                const isOvertimeTask = completionTime && isValid(block.startTime) && block.startTime >= completionTime;

                return (
                  <div
                    key={block.id}
                    ref={(el) => itemRefs.current.set(block.id, el)}
                    draggable={isEditingSchedule}
                    onDragStart={() => (draggedItemIndex.current = index)}
                    onDragEnter={() => {
                      dragOverItemIndex.current = index;
                      setDragOverIndex(index);
                    }}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-lg bg-card hover:bg-secondary/50 transition-all",
                      isEditingSchedule && "cursor-grab",
                      dragOverIndex === index && "bg-secondary",
                      newlyAddedBlockId === block.id && "bg-yellow-100 dark:bg-yellow-900/50 ring-2 ring-yellow-400"
                    )}
                  >
                    <div className={cn("pt-1.5 transition-opacity", isEditingSchedule ? "opacity-100" : "opacity-0")}>
                      <Icons.GripVertical className="h-5 w-5 text-muted-foreground/50 hover:text-muted-foreground" />
                    </div>
                    <Icon className={`h-5 w-5 flex-shrink-0 mt-1.5 ${iconColor}`} />
                    {isEditingSchedule ? (
                      <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
                        <Input
                          value={block.task}
                          onChange={(e) => handleScheduleChange(index, 'task', e.target.value)}
                          className="font-semibold h-8 border-transparent hover:border-input focus:border-input p-1 bg-transparent col-span-2"
                        />
                        <div className="flex items-center gap-1 text-sm text-muted-foreground col-span-1">
                          <p className="p-1">{format(block.startTime, 'hh:mm a')}</p>
                          <span>-</span>
                          <Input
                            type="text"
                            value={String(block.duration)}
                            onChange={(e) => handleScheduleChange(index, 'duration', e.target.value)}
                            onBlur={() => handleDurationBlur(index)}
                            className="w-14 h-7 border-transparent hover:border-input focus:border-input p-1 bg-transparent"
                          />
                          <span>mins</span>
                          {isOvertimeTask && (
                            <div className="ml-2 flex items-center gap-1 text-orange-500" title="Overtime">
                              <Icons.Clock className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 justify-self-end" onClick={() => deleteScheduleBlock(index)}>
                          <Icons.Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between">
                        <div className={cn("pt-0.5", block.completed && "line-through text-muted-foreground")}>
                          <p className="font-semibold">{block.task}</p>
                          <p className="text-sm flex items-center gap-2">
                            {isValid(block.startTime)
                              ? `${format(block.startTime, 'hh:mm a')} - ${format(block.endTime, 'hh:mm a')}`
                              : 'Invalid time'}
                            {isOvertimeTask && (
                              <span
                                className="flex items-center gap-1 text-xs text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full"
                                title="Overtime"
                              >
                                <Icons.Clock className="h-3 w-3" />
                                Overtime
                              </span>
                            )}
                          </p>
                        </div>
                        <Checkbox
                          checked={block.completed}
                          onCheckedChange={() => onToggleCompletion(index)}
                          aria-label={`Mark ${block.task} as complete`}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
