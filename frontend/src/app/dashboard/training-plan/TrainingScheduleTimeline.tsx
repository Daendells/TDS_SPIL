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

interface WeekSlot {
  weekLabel: string;
  weekNumber: 1 | 2 | 3 | 4;
  date: Date;
}

export default function TrainingScheduleTimeline({
  summary,
  program,
  competencyMapping,
}: TrainingScheduleTimelineProps) {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [originalSchedules, setOriginalSchedules] = useState<ScheduleItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null);
  const [dragOverWeek, setDragOverWeek] = useState<string | null>(null);
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

    // Backend now sends ISO timestamps (2025-10-22T00:00:00Z) instead of "I-10" format
    const allEntries: Array<{ code: string; dateStr: string; type: 1 | 2 }> = [
      ...Object.entries(summary.trainingMateri1).map(([code, dateStr]) => ({
        code,
        dateStr,
        type: 1 as 1 | 2,
      })),
      ...Object.entries(summary.trainingMateri2).map(([code, dateStr]) => ({
        code,
        dateStr,
        type: 2 as 1 | 2,
      })),
    ];

    allEntries.forEach((entry) => {
      if (!entry.dateStr || entry.dateStr === "-") return;

      // Parse ISO timestamp directly from database
      const date = new Date(entry.dateStr);
      if (isNaN(date.getTime())) return; // Skip invalid dates

      const scheduleId = summary.scheduleIds?.[entry.code]?.[entry.type.toString()] || 0;

      schedulesArray.push({
        id: scheduleId,
        competencyCode: entry.code,
        competencyName: getCompetencyName(entry.code),
        trainingMaterial: getTrainingMaterial(entry.code, entry.type),
        category: summary.category[entry.code] || "NM",
        materialType: entry.type,
        scheduledDate: date,
      });
    });

    return schedulesArray.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  };

  useEffect(() => {
    const parsedSchedules = parseSchedules();
    setSchedules(parsedSchedules);
    setOriginalSchedules(
      parsedSchedules.map((s) => ({ ...s, scheduledDate: new Date(s.scheduledDate) }))
    );
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
    return schedulesData.filter(
      (schedule) =>
        schedule.scheduledDate.getMonth() === month.getMonth() &&
        schedule.scheduledDate.getFullYear() === month.getFullYear()
    );
  };

  const getWeekSlotsForMonth = (month: Date): WeekSlot[] => {
    return [
      { weekLabel: "I", weekNumber: 1, date: new Date(month.getFullYear(), month.getMonth(), 1) },
      { weekLabel: "II", weekNumber: 2, date: new Date(month.getFullYear(), month.getMonth(), 8) },
      {
        weekLabel: "III",
        weekNumber: 3,
        date: new Date(month.getFullYear(), month.getMonth(), 15),
      },
      { weekLabel: "IV", weekNumber: 4, date: new Date(month.getFullYear(), month.getMonth(), 22) },
    ];
  };

  const getSchedulesForWeek = (
    schedulesData: ScheduleItem[],
    weekSlot: WeekSlot
  ): ScheduleItem[] => {
    return schedulesData.filter((schedule) => {
      const scheduleWeek = getWeekLabel(schedule.scheduledDate);
      return (
        scheduleWeek === weekSlot.weekLabel &&
        schedule.scheduledDate.getMonth() === weekSlot.date.getMonth() &&
        schedule.scheduledDate.getFullYear() === weekSlot.date.getFullYear()
      );
    });
  };

  const getWeekKey = (month: Date, weekLabel: string): string => {
    return `${month.getFullYear()}-${month.getMonth()}-${weekLabel}`;
  };

  const handleDragStart = (e: React.DragEvent, item: ScheduleItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverWeek = (e: React.DragEvent, weekKey: string) => {
    e.preventDefault();
    setDragOverWeek(weekKey);
  };

  const handleDragLeave = () => {
    setDragOverWeek(null);
  };

  const handleDropOnWeek = (e: React.DragEvent, weekSlot: WeekSlot) => {
    e.preventDefault();

    if (!draggedItem) {
      setDraggedItem(null);
      setDragOverWeek(null);
      return;
    }

    const newSchedules = [...schedules];
    const draggedIndex = newSchedules.findIndex((s) => s.id === draggedItem.id);

    newSchedules[draggedIndex].scheduledDate = new Date(weekSlot.date);

    newSchedules.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    setSchedules(newSchedules);
    setDraggedItem(null);
    setDragOverWeek(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverWeek(null);
  };

  const hasChanges = () => {
    return (
      JSON.stringify(schedules.map((s) => ({ id: s.id, date: s.scheduledDate.getTime() }))) !==
      JSON.stringify(originalSchedules.map((s) => ({ id: s.id, date: s.scheduledDate.getTime() })))
    );
  };

  const handleSave = async () => {
    const swaps = schedules
      .filter((schedule) => {
        const original = originalSchedules.find((o) => o.id === schedule.id);
        return original && original.scheduledDate.getTime() !== schedule.scheduledDate.getTime();
      })
      .map((schedule) => ({
        id: schedule.id,
        scheduledDate: schedule.scheduledDate.toISOString(),
      }));

    if (swaps.length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      await swapSchedules.mutateAsync({ swaps, program });
      setOriginalSchedules(
        schedules.map((s) => ({ ...s, scheduledDate: new Date(s.scheduledDate) }))
      );
      setEditMode(false);
      toast.success("Schedules saved successfully!");
    } catch {
      toast.error("Failed to save schedules");
    }
  };

  const handleReset = () => {
    setSchedules(
      originalSchedules.map((s) => ({ ...s, scheduledDate: new Date(s.scheduledDate) }))
    );
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
                      {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {monthSchedules.length} training{monthSchedules.length !== 1 ? "s" : ""}
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
                      {getWeekSlotsForMonth(month).map((weekSlot) => {
                        const weekSchedules = getSchedulesForWeek(schedules, weekSlot);
                        const weekKey = getWeekKey(month, weekSlot.weekLabel);
                        const isWeekDragOver = dragOverWeek === weekKey;

                        return (
                          <div
                            key={weekSlot.weekLabel}
                            onDragOver={(e) => editMode && handleDragOverWeek(e, weekKey)}
                            onDragLeave={editMode ? handleDragLeave : undefined}
                            onDrop={(e) => editMode && handleDropOnWeek(e, weekSlot)}
                            className={`min-h-[60px] p-3 rounded-lg border-2 transition-all ${
                              editMode
                                ? isWeekDragOver
                                  ? "border-blue-400 bg-blue-50"
                                  : "border-dashed border-gray-300 bg-gray-50/50"
                                : "border-transparent bg-muted/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-12 text-center pt-1">
                                <div className="text-lg font-bold">{weekSlot.weekLabel}</div>
                                <div className="text-xs text-muted-foreground">Week</div>
                              </div>

                              <div className="flex-1 space-y-2">
                                {weekSchedules.length > 0 ? (
                                  weekSchedules.map((schedule) => (
                                    <div
                                      key={schedule.id}
                                      draggable={editMode}
                                      onDragStart={(e) => editMode && handleDragStart(e, schedule)}
                                      onDragEnd={editMode ? handleDragEnd : undefined}
                                      className={`flex items-center gap-3 p-2 rounded-md transition-all ${
                                        editMode
                                          ? `cursor-move ${
                                              draggedItem?.id === schedule.id
                                                ? "opacity-50 bg-blue-200"
                                                : "bg-white hover:bg-gray-50 shadow-sm"
                                            }`
                                          : "bg-white shadow-sm"
                                      }`}
                                    >
                                      <Badge
                                        variant={
                                          schedule.category === "M" ? "destructive" : "secondary"
                                        }
                                        className={`font-medium ${schedule.category !== "M" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
                                      >
                                        {schedule.category}
                                      </Badge>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {schedule.trainingMaterial}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {schedule.competencyCode} - {schedule.competencyName}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-muted-foreground italic py-2">
                                    {editMode ? "Drop training here" : "No training scheduled"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
