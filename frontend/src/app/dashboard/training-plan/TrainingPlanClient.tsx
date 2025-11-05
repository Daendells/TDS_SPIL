"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, TrendingUp, Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/skeleton-card";
import {
  useGetTrainingPlan,
  useGetCompetencyMapping,
  useGetPrograms,
  useGenerateSchedules,
  type TrainingPlanParticipant,
  type TrainingPlanSummary,
} from "./_hooks/useTrainingPlan";
import TrainingScheduleTimeline from "./TrainingScheduleTimeline";

export default function TrainingPlanClient() {
  const [selectedProgram, setSelectedProgram] = useState("SDP");
  const [selectedParticipant, setSelectedParticipant] = useState<TrainingPlanParticipant | null>(null);

  // React Query hooks
  const { data: programs, isLoading: programsLoading } = useGetPrograms();
  const { data: trainingPlan, isLoading: planLoading, error: planError } = useGetTrainingPlan(selectedProgram);
  const { data: competencyMapping, isLoading: mappingLoading } = useGetCompetencyMapping(selectedProgram);
  const generateSchedules = useGenerateSchedules();

  // Handle program change
  const handleProgramChange = (program: string) => {
    setSelectedProgram(program);
  };

  // Handle schedule generation
  const handleGenerateSchedules = async () => {
    try {
      await generateSchedules.mutateAsync({ program: selectedProgram });
      toast.success("Training schedules generated successfully!");
    } catch (error) {
      toast.error("Failed to generate training schedules");
      console.error("Schedule generation error:", error);
    }
  };

  // Get competency badge color based on category
  const getCompetencyBadgeColor = (category: string) => {
    // Support both full label and short code
    return category === "M" || category === "Mandatory" ? "destructive" : "secondary";
  };

  // Get readiness badge color
  const getReadinessBadgeColor = (readiness: string) => {
    switch (readiness.toLowerCase()) {
      case "ready now":
        return "default";
      case "ready 1-2 years":
        return "secondary";
      case "ready 3+ years":
        return "outline";
      default:
        return "outline";
    }
  };

  // Show error notification if training plan fetch fails
  if (planError) {
    toast.error("Failed to fetch training plan data");
  }

  // Loading state
  if (programsLoading || planLoading || !trainingPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Plan</h1>
          <p className="text-muted-foreground">
            Manage and generate training schedules based on competency gaps
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedProgram} onValueChange={handleProgramChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              {programs?.map((program) => (
                <SelectItem key={program.code} value={program.code}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerateSchedules}
            disabled={generateSchedules.isPending}
            className="gap-2"
          >
            {generateSchedules.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Generate Schedules
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {trainingPlan && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainingPlan?.participants?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active seafarers in {selectedProgram}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mandatory Training</CardTitle>
              <Badge variant="destructive" className="h-4 w-4 rounded-full p-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainingPlan?.summary?.category ? Object.values(trainingPlan.summary.category).filter(cat => cat === "M").length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Critical competencies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non Mandatory Training</CardTitle>
              <Badge className="h-4 w-4 rounded-full p-0 bg-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainingPlan?.summary?.category ? Object.values(trainingPlan.summary.category).filter(cat => cat === "NM").length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Non-critical competencies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Gap Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainingPlan?.participants && trainingPlan.participants.length > 0
                  ? (
                      (
                        trainingPlan.participants.reduce((sum, p) => sum + p.total, 0) /
                        trainingPlan.participants.length
                      ).toFixed(2)
                    )
                  : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Average competency gaps
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="summary">Gap Summary</TabsTrigger>
          <TabsTrigger value="mapping">Competency Mapping</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Plan Participants</CardTitle>
              <CardDescription>
                Seafarers requiring training based on competency gap analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seaman Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Vessel</TableHead>
                      <TableHead>Total Gaps</TableHead>
                      <TableHead>Readiness</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingPlan?.participants?.map((participant) => (
                      <TableRow key={participant.no}>
                        <TableCell className="font-medium">
                          {participant.seamanCode}
                        </TableCell>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>{participant.position || '-'}</TableCell>
                        <TableCell>{participant.vesselName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.total}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getReadinessBadgeColor(participant.readiness)}>
                            {participant.readiness}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedParticipant(participant)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {participant.name}
                                </DialogTitle>
                                <DialogDescription>
                                  {participant.seamanCode}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedParticipant && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium">Vessel</p>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedParticipant.vesselName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Total Gaps</p>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedParticipant.total}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Competency Gaps</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      {Object.entries(selectedParticipant.gaps)
                                        .filter(([key, value]) => value === "1" || value === "X" || value === 1)
                                        .map(([key]) => (
                                          <Badge key={key} variant="secondary" className="text-xs">
                                            {key.toUpperCase()}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competency Gap Summary</CardTitle>
              <CardDescription>
                Overview of competency gaps across all participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingPlan?.summary?.total && Object.entries(trainingPlan.summary.total).map(([competencyCode, totalParticipants]) => (
                  <div key={competencyCode} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{competencyCode}</span>
                        <Badge
                          variant={getCompetencyBadgeColor(trainingPlan.summary.category?.[competencyCode] || "")}
                          className={trainingPlan.summary.category?.[competencyCode] === "NM" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                        >
                          {trainingPlan.summary.category?.[competencyCode] === "M" ? "Mandatory" : "Non-Mandatory"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {totalParticipants} participants
                        </span>
                        <span className="text-sm font-medium">
                          {trainingPlan.summary.percentageGap?.[competencyCode]?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                    <Progress value={trainingPlan.summary.percentageGap?.[competencyCode] || 0} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competency Mapping Tab */}
        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competency Mapping</CardTitle>
              <CardDescription>
                Training topics mapped to competency areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mappingLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {competencyMapping && Object.entries(competencyMapping).map(([code, mapping]) => (
                    <div key={code} className="space-y-2">
                      <h4 className="font-medium">{mapping.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {mapping.training_topics?.map((topic, index) => (
                          <Badge key={index} variant="outline">
                            {topic}
                          </Badge>
                        )) || null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            
            <CardContent>
              {trainingPlan?.summary && (
                Object.keys(trainingPlan.summary.trainingMateri1).length > 0 || 
                Object.keys(trainingPlan.summary.trainingMateri2).length > 0
              ) ? (
                <TrainingScheduleTimeline 
                  summary={trainingPlan.summary}
                  program={selectedProgram}
                />
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Schedules Generated
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Generate Schedules" to create training schedules for this program.
                  </p>
                  <Button
                    onClick={handleGenerateSchedules}
                    disabled={generateSchedules.isPending}
                    className="gap-2"
                  >
                    {generateSchedules.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Calendar className="h-4 w-4" />
                    )}
                    Generate Schedules
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}