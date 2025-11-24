import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Save, RotateCcw, Edit } from "lucide-react";
import { toast } from "sonner";
import { useSwapSchedules } from "./_hooks/useTrainingPlan";
import type { TrainingPlanSummary } from "./_hooks/useTrainingPlan";

interface TrainingScheduleTimelineProps {
  summary: TrainingPlanSummary;
  program: string;
  competencyMapping?: {
    [key: string]: {
      name: string;
      training_topics: string[];
    };
  };
}

interface ScheduleItem {
  id: number;
  competencyCode: string;
  competencyName: string;
  trainingMaterial: string;
  category: string;
  materialType: 1 | 2;
  scheduledDate: Date;
}

export default function TrainingScheduleTimeline({ summary, program, competencyMapping }: TrainingScheduleTimelineProps) {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [originalSchedules, setOriginalSchedules] = useState<ScheduleItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<ScheduleItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const swapSchedules = useSwapSchedules();

  const toggleMonth = (monthKey: string) => {
    const newCollapsed = new Set(collapsedMonths);
    if (newCollapsed.has(monthKey)) {
      newCollapsed.delete(monthKey);
    } else {
      newCollapsed.add(monthKey);
    }
    setCollapsedMonths(newCollapsed);
  };

  const weekLabelToDay = (label: string): number => {
    switch (label.trim().toUpperCase()) {
      case "I":
        return 1;
      case "II":
        return 8;
      case "III":
        return 15;
      case "IV":
        return 22;
      default:
        return 1;
    }
  };

  const getWeekLabel = (date: Date): string => {
    const d = date.getDate();
    if (d <= 7) return "I";
    if (d <= 14) return "II";
    if (d <= 21) return "III";
    return "IV";
  };

  const getCompetencyName = (competencyCode: string): string => {
    return competencyMapping?.[competencyCode]?.name || competencyCode;
  };

  const getTrainingMaterial = (competencyCode: string, materialType: 1 | 2): string => {
    const topics = competencyMapping?.[competencyCode]?.training_topics;
    if (!topics || topics.length === 0) return "Training Material";
    return topics[materialType - 1] || topics[0] || "Training Material";
  };

  const parseSchedules = (): ScheduleItem[] => {
    const schedulesArray: ScheduleItem[] = [];

    Object.entries(summary.trainingMateri1).forEach(([competencyCode, dateStr]) => {
      if (dateStr && dateStr !== "-") {
        const [weekLabel, month] = dateStr.split("-");
        let year = 2025;
        const monthNum = parseInt(month);
        if (monthNum >= 1 && monthNum <= 9) {
          year = 2026;
        }
        const date = new Date(year, monthNum - 1, weekLabelToDay(weekLabel));
        
        const scheduleId = summary.scheduleIds?.[competencyCode]?.["1"] || 0;
        
        schedulesArray.push({
          id: scheduleId,
          competencyCode,
          competencyName: getCompetencyName(competencyCode),
          trainingMaterial: getTrainingMaterial(competencyCode, 1),
          category: summary.category[competencyCode] || "NM",
          materialType: 1,
          scheduledDate: date,
        });
      }
    });

    Object.entries(summary.trainingMateri2).forEach(([competencyCode, dateStr]) => {
      if (dateStr && dateStr !== "-") {
        const [weekLabel, month] = dateStr.split("-");
        let year = 2025;
        const monthNum = parseInt(month);
        if (monthNum >= 1 && monthNum <= 9) {
          year = 2026;
        }
        const date = new Date(year, monthNum - 1, weekLabelToDay(weekLabel));
        
        const scheduleId = summary.scheduleIds?.[competencyCode]?.["2"] || 0;
        
        schedulesArray.push({
          id: scheduleId,
          competencyCode,
          competencyName: getCompetencyName(competencyCode),
          trainingMaterial: getTrainingMaterial(competencyCode, 2),
          category: summary.category[competencyCode] || "NM",
          materialType: 2,
          scheduledDate: date,
        });
      }
    });

    return schedulesArray.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  };

  useEffect(() => {
    const parsedSchedules = parseSchedules();
    setSchedules(parsedSchedules);
    setOriginalSchedules(parsedSchedules.map(s => ({ ...s, scheduledDate: new Date(s.scheduledDate) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  const generateMonthsToDisplay = (schedulesData: ScheduleItem[]): Date[] => {
    if (schedulesData.length === 0) return [];

    const startDate = new Date(schedulesData[0].scheduledDate);
    const endDate = new Date(schedulesData[schedulesData.length - 1].scheduledDate);
    
    const months: Date[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const getSchedulesForMonth = (schedulesData: ScheduleItem[], month: Date): ScheduleItem[] => {
    return schedulesData.filter(schedule => 
      schedule.scheduledDate.getMonth() === month.getMonth() &&
      schedule.scheduledDate.getFullYear() === month.getFullYear()
    );
  };

  const handleDragStart = (e: React.DragEvent, item: ScheduleItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, item: ScheduleItem) => {
    e.preventDefault();
    setDragOverItem(item);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: ScheduleItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newSchedules = [...schedules];
    const draggedIndex = newSchedules.findIndex(s => s.id === draggedItem.id);
    const targetIndex = newSchedules.findIndex(s => s.id === targetItem.id);

    const tempDate = newSchedules[draggedIndex].scheduledDate;
    newSchedules[draggedIndex].scheduledDate = newSchedules[targetIndex].scheduledDate;
    newSchedules[targetIndex].scheduledDate = tempDate;

    newSchedules.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    
    setSchedules(newSchedules);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const hasChanges = () => {
    return JSON.stringify(schedules.map(s => ({ id: s.id, date: s.scheduledDate.getTime() }))) !== 
           JSON.stringify(originalSchedules.map(s => ({ id: s.id, date: s.scheduledDate.getTime() })));
  };

  const handleSave = async () => {
    const swaps = schedules
      .filter((schedule) => {
        const original = originalSchedules.find(o => o.id === schedule.id);
        return original && original.scheduledDate.getTime() !== schedule.scheduledDate.getTime();
      })
      .map(schedule => ({
        id: schedule.id,
        scheduledDate: schedule.scheduledDate.toISOString(),
      }));

    if (swaps.length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      await swapSchedules.mutateAsync({ swaps, program });
      setOriginalSchedules(schedules.map(s => ({ ...s, scheduledDate: new Date(s.scheduledDate) })));
      setEditMode(false);
      toast.success("Schedules saved successfully!");
    } catch (error) {
      toast.error("Failed to save schedules");
      console.error("Save error:", error);
    }
  };

  const handleReset = () => {
    setSchedules(originalSchedules.map(s => ({ ...s, scheduledDate: new Date(s.scheduledDate) })));
    setEditMode(false);
    toast.info("Changes reset");
  };

  const monthsToDisplay = generateMonthsToDisplay(schedules);

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No training schedules available for {program}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Training Schedule Timeline ({program})</h3>
        <div className="flex items-center gap-2">
          {!editMode && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Schedules
            </Button>
          )}
          {editMode && hasChanges() && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={swapSchedules.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {swapSchedules.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
          {editMode && !hasChanges() && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {monthsToDisplay.map((month, monthIndex) => {
          const monthSchedules = getSchedulesForMonth(schedules, month);
          const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
          const isCollapsed = collapsedMonths.has(monthKey);
          
          return (
            <Card key={monthIndex} className="overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="bg-muted p-4 border-b cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => toggleMonth(monthKey)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {monthSchedules.length} training{monthSchedules.length !== 1 ? 's' : ''}
                      </Badge>
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
                
                {!isCollapsed && (
                  <div className="p-4">
                    <div className="space-y-3">
                      {monthSchedules.length > 0 ? (
                        monthSchedules
                          .sort((a, b) => a.scheduledDate.getDate() - b.scheduledDate.getDate())
                          .map((schedule) => (
                            <div
                              key={schedule.id}
                              draggable={editMode}
                              onDragStart={(e) => editMode && handleDragStart(e, schedule)}
                              onDragOver={(e) => editMode && handleDragOver(e, schedule)}
                              onDragLeave={editMode ? handleDragLeave : undefined}
                              onDrop={(e) => editMode && handleDrop(e, schedule)}
                              onDragEnd={editMode ? handleDragEnd : undefined}
                              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                                editMode 
                                  ? `cursor-move ${
                                      draggedItem?.id === schedule.id 
                                        ? 'opacity-50 bg-blue-100' 
                                        : dragOverItem?.id === schedule.id
                                        ? 'bg-blue-50 border-2 border-blue-300'
                                        : 'bg-muted/50 hover:bg-muted/70'
                                    }`
                                  : 'bg-muted/50'
                              }`}
                            >
                              <div className="flex-shrink-0 w-12 text-center">
                                <div className="text-lg font-bold">
                                  {getWeekLabel(schedule.scheduledDate)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Week
                                </div>
                              </div>
                              
                              <div className="flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge 
                                    variant={schedule.category === 'M' ? 'destructive' : 'secondary'}
                                    className={`font-medium ${schedule.category !== 'M' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}`}
                                  >
                                    {schedule.category}
                                  </Badge>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {schedule.competencyCode} - {schedule.competencyName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {schedule.trainingMaterial}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-xs text-muted-foreground">
                                  Week {getWeekLabel(schedule.scheduledDate)} of {month.toLocaleDateString('en-US', { month: 'long' })}
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No trainings scheduled for this month
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}