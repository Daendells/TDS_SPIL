import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  competencyCode: string;
  competencyName: string;
  trainingMaterial: string;
  category: string;
  materialType: 1 | 2;
  scheduledDate: Date;
}

export default function TrainingScheduleTimeline({ summary, program, competencyMapping }: TrainingScheduleTimelineProps) {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (monthKey: string) => {
    const newCollapsed = new Set(collapsedMonths);
    if (newCollapsed.has(monthKey)) {
      newCollapsed.delete(monthKey);
    } else {
      newCollapsed.add(monthKey);
    }
    setCollapsedMonths(newCollapsed);
  };

  // Helper untuk memetakan label minggu ke tanggal representatif (1, 8, 15, 22)
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

  // Get competency name from mapping
  const getCompetencyName = (competencyCode: string): string => {
    return competencyMapping?.[competencyCode]?.name || competencyCode;
  };

  // Get training material from mapping based on material type
  const getTrainingMaterial = (competencyCode: string, materialType: 1 | 2): string => {
    const topics = competencyMapping?.[competencyCode]?.training_topics;
    if (!topics || topics.length === 0) return "Training Material";
    
    // materialType 1 = index 0, materialType 2 = index 1
    return topics[materialType - 1] || topics[0] || "Training Material";
  };

  // Parse and combine schedule data dari trainingMateri1 dan trainingMateri2 (format "I-10")
  const parseSchedules = (): ScheduleItem[] => {
    const schedules: ScheduleItem[] = [];

    // Parse Materi 1 schedules
    Object.entries(summary.trainingMateri1).forEach(([competencyCode, dateStr]) => {
      if (dateStr && dateStr !== "-") {
        const [weekLabel, month] = dateStr.split("-");
        let year = 2025;
        const monthNum = parseInt(month);
        if (monthNum >= 1 && monthNum <= 9) {
          year = 2026; // Januari–September 2026
        }
        const date = new Date(year, monthNum - 1, weekLabelToDay(weekLabel));
        
        schedules.push({
          competencyCode,
          competencyName: getCompetencyName(competencyCode),
          trainingMaterial: getTrainingMaterial(competencyCode, 1),
          category: summary.category[competencyCode] || "NM",
          materialType: 1,
          scheduledDate: date,
        });
      }
    });

    // Parse Materi 2 schedules
    Object.entries(summary.trainingMateri2).forEach(([competencyCode, dateStr]) => {
      if (dateStr && dateStr !== "-") {
        const [weekLabel, month] = dateStr.split("-");
        let year = 2025;
        const monthNum = parseInt(month);
        if (monthNum >= 1 && monthNum <= 9) {
          year = 2026; // Januari–September 2026
        }
        const date = new Date(year, monthNum - 1, weekLabelToDay(weekLabel));
        
        schedules.push({
          competencyCode,
          competencyName: getCompetencyName(competencyCode),
          trainingMaterial: getTrainingMaterial(competencyCode, 2),
          category: summary.category[competencyCode] || "NM",
          materialType: 2,
          scheduledDate: date,
        });
      }
    });

    // Sort by date
    return schedules.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  };

  // Generate months to display based on schedules
  const generateMonthsToDisplay = (schedules: ScheduleItem[]): Date[] => {
    if (schedules.length === 0) return [];

    const startDate = new Date(schedules[0].scheduledDate);
    const endDate = new Date(schedules[schedules.length - 1].scheduledDate);
    
    const months: Date[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  // Get schedules for a specific month
  const getSchedulesForMonth = (schedules: ScheduleItem[], month: Date): ScheduleItem[] => {
    return schedules.filter(schedule => 
      schedule.scheduledDate.getMonth() === month.getMonth() &&
      schedule.scheduledDate.getFullYear() === month.getFullYear()
    );
  };

  const schedules = parseSchedules();
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
        <div className="flex items-center gap-4 text-sm">
          
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
                    {/* Timeline view for the month */}
                    <div className="space-y-3">
                      {monthSchedules.length > 0 ? (
                        monthSchedules
                          .sort((a, b) => a.scheduledDate.getDate() - b.scheduledDate.getDate())
                          .map((schedule, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
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