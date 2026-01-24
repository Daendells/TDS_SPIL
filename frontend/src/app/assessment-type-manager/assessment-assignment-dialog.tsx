"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useGetUnassignedAssessments,
  useAssignAssessment,
} from "@/app/assessment-manager/_hooks/useAssessment";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface AssessmentAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentTypeId: number | null;
  assessmentTypeName: string;
}

export default function AssessmentAssignmentDialog({
  open,
  onOpenChange,
  assessmentTypeId,
  assessmentTypeName,
}: AssessmentAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const { data: unassignedAssessments, isLoading: isLoadingAssessments } =
    useGetUnassignedAssessments();
  const assignMutation = useAssignAssessment();

  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedAssessmentIds([]);
    }
  }, [open]);

  const handleCheckboxChange = (assessmentId: number, Checked: boolean) => {
    if (Checked) {
      setSelectedAssessmentIds((prev) => [...prev, assessmentId]);
    } else {
      setSelectedAssessmentIds((prev) => prev.filter((id) => id !== assessmentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && unassignedAssessments) {
      setSelectedAssessmentIds(unassignedAssessments.map((a) => a.assessmentId));
    } else {
      setSelectedAssessmentIds([]);
    }
  };

  const handleSubmit = async () => {
    if (!assessmentTypeId) return;
    if (selectedAssessmentIds.length === 0) {
      toast.error("Pilih minimal satu assessment");
      return;
    }

    setIsSubmitting(true);
    try {
      // Process assignments sequentially or in parallel
      await Promise.all(
        selectedAssessmentIds.map((id) =>
          assignMutation.mutateAsync({
            assessmentId: id,
            assessmentTypeId: assessmentTypeId,
          })
        )
      );

      toast.success(
        `${selectedAssessmentIds.length} assessment berhasil ditambahkan ke ${assessmentTypeName}`
      );
      queryClient.invalidateQueries({ queryKey: ["assessments", "unassigned"] });
      // Also invalidate fetching assessments by type if that query exists
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning assessments:", error);
      toast.error("Gagal menambahkan assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kelola Assessment - {assessmentTypeName}</DialogTitle>
          <DialogDescription>
            Pilih assessment yang belum terdaftar untuk ditambahkan ke tipe ini.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoadingAssessments ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : !unassignedAssessments || unassignedAssessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              Tidak ada assessment yang tersedia (unassigned).
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedAssessmentIds.length === unassignedAssessments.length &&
                    unassignedAssessments.length > 0
                  }
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
                <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                  Pilih Semua
                </Label>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                {unassignedAssessments.map((assessment) => (
                  <div
                    key={assessment.assessmentId}
                    className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Checkbox
                      id={`assessment-${assessment.assessmentId}`}
                      checked={selectedAssessmentIds.includes(assessment.assessmentId)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(assessment.assessmentId, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`assessment-${assessment.assessmentId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {assessment.assessmentName}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Role: {assessment.role}{" "}
                        {assessment.usingTimer ? `(${assessment.timerLimitMinutes} menit)` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedAssessmentIds.length === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tambahkan ({selectedAssessmentIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
