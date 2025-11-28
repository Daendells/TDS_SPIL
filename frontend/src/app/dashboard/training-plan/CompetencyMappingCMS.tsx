"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useGetCompetencyMappings,
  useGetAllTrainings,
  useUpdateCompetencyMapping,
  useDeleteCompetencyMapping,
  type CompetencyMappingFormData,
  type CompetencyMappingItem,
} from "./_hooks/useCompetencyMappingCMS";
import type { TrainingPlanResponse } from "./_hooks/useTrainingPlan";

interface CompetencyMappingCMSProps {
  program: string;
  trainingPlan?: TrainingPlanResponse;
}

export default function CompetencyMappingCMS({ program, trainingPlan }: CompetencyMappingCMSProps) {
  const [editingMapping, setEditingMapping] = useState<CompetencyMappingItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CompetencyMappingFormData>({
    competencyTypeId: 0,
    program: program,
    trainingMaterial1Id: null,
    trainingMaterial2Id: null,
  });

  const { data: mappings, isLoading: mappingsLoading } = useGetCompetencyMappings(program);
  const { data: trainings, isLoading: trainingsLoading } = useGetAllTrainings();
  const updateMutation = useUpdateCompetencyMapping();
  const deleteMutation = useDeleteCompetencyMapping();

  const sortedMappings =
    mappings
      ?.map((mapping) => {
        const competencyCode = mapping.competencyType?.code;
        const category =
          competencyCode && trainingPlan?.summary?.category
            ? trainingPlan.summary.category[competencyCode] || "NM"
            : "NM";
        const percentageGap =
          competencyCode && trainingPlan?.summary?.percentageGap
            ? trainingPlan.summary.percentageGap[competencyCode] || 0
            : 0;
        return {
          ...mapping,
          category,
          percentageGap,
        };
      })
      .sort((a, b) => {
        return (b.percentageGap || 0) - (a.percentageGap || 0);
      }) || [];

  const handleEdit = (mapping: CompetencyMappingItem) => {
    setEditingMapping(mapping);
    setFormData({
      competencyTypeId: mapping.competencyTypeId,
      program: mapping.program,
      trainingMaterial1Id: mapping.trainingMaterial1Id,
      trainingMaterial2Id: mapping.trainingMaterial2Id,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!editingMapping) return;

    try {
      await updateMutation.mutateAsync({
        id: editingMapping.id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      setEditingMapping(null);
    } catch {
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = (mapping: CompetencyMappingItem) => {
    setDeletingId(mapping.id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;

    try {
      await deleteMutation.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (mappingsLoading || trainingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Competency Mapping</h3>
          <p className="text-sm text-muted-foreground">
            Manage competency-to-training mappings for {program} program
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competency Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Training Material 1</TableHead>
              <TableHead>Training Material 2</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMappings && sortedMappings.length > 0 ? (
              sortedMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">
                    {mapping.competencyType?.code || "N/A"} -{" "}
                    {mapping.competencyType?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={mapping.category === "M" ? "destructive" : "secondary"}
                      className={
                        mapping.category === "NM" ? "bg-blue-500 text-white hover:bg-blue-600" : ""
                      }
                    >
                      {mapping.category === "M" ? "Mandatory" : "Non-Mandatory"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {mapping.trainingMaterial1?.topik_training || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.trainingMaterial2?.topik_training || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(mapping)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(mapping)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No competency mappings found for {program} program
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Competency Mapping</DialogTitle>
            <DialogDescription>
              Update training materials for {editingMapping?.competencyType?.code || "competency"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Competency</Label>
              <Input
                value={`${editingMapping?.competencyType?.code || "N/A"} - ${editingMapping?.competencyType?.name || "Unknown"}`}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Training Material 1</Label>
              <Select
                value={formData.trainingMaterial1Id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trainingMaterial1Id: value !== "none" ? parseInt(value) : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {trainings?.map((training) => (
                    <SelectItem key={training.no} value={training.no.toString()}>
                      {training.topik_training} ({training.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Training Material 2</Label>
              <Select
                value={formData.trainingMaterial2Id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trainingMaterial2Id: value !== "none" ? parseInt(value) : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {trainings?.map((training) => (
                    <SelectItem key={training.no} value={training.no.toString()}>
                      {training.topik_training} ({training.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competency Mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mapping for{" "}
              <span className="font-semibold">
                {mappings?.find((m) => m.id === deletingId)?.competencyType?.code}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
