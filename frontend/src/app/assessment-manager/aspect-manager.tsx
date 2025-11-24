"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, AlertCircle, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { AspectResponse } from "@/types/aspect";
import {
  useGetAspectsByAssessmentId,
  useDeleteAspect,
} from "./_hooks/useAspect";
import { useGetQuestionsByAssessmentId, useBulkUpdateAspect } from "./_hooks/useQuestion";
import { AspectDialog } from "./aspect-dialog";
import { AspectQuestionAssignmentDialog } from "./aspect-question-assignment-dialog";
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

interface AspectManagerProps {
  assessmentId: number;
  assessmentName: string;
}

export function AspectManager({
  assessmentId,
  assessmentName,
}: AspectManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAspect, setEditingAspect] = useState<AspectResponse | null>(
    null
  );
  const [deletingAspect, setDeletingAspect] = useState<AspectResponse | null>(
    null
  );

  const {
    data: aspectsData,
    isLoading,
    refetch,
  } = useGetAspectsByAssessmentId(assessmentId);
  const { data: questionsData, refetch: refetchQuestions } = useGetQuestionsByAssessmentId(assessmentId);
  const bulkUpdateAspectMutation = useBulkUpdateAspect();
  const deleteAspectMutation = useDeleteAspect();

  const aspects = aspectsData ?? [];
  const questions = questionsData?.data ?? [];
  const totalWeight = aspects.reduce((sum: number, aspect: AspectResponse) => sum + aspect.weight, 0);
  const isWeightValid = totalWeight === 100;

  // Count questions assigned to each aspect
  const getQuestionCount = (aspectId: number) => {
    return questions.filter((q: { aspectId: number }) => q.aspectId === aspectId).length;
  };

  const handleAdd = () => {
    setEditingAspect(null);
    setDialogOpen(true);
  };

  const handleEdit = (aspect: AspectResponse) => {
    setEditingAspect(aspect);
    setDialogOpen(true);
  };

  const handleDeleteClick = (aspect: AspectResponse) => {
    setDeletingAspect(aspect);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAspect) return;

    try {
      await deleteAspectMutation.mutateAsync(deletingAspect.id);
      toast.success("Aspect berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingAspect(null);
    } catch (error) {
      console.error("Error deleting aspect:", error);
      toast.error("Gagal menghapus aspect");
    }
  };

  const handleAssignQuestions = async (questionIds: number[], aspectId: number | null) => {
    try {
      await bulkUpdateAspectMutation.mutateAsync({ questionIds, aspectId });
      toast.success(`${questionIds.length} pertanyaan berhasil di-assign`);
      refetchQuestions();
      setAssignmentDialogOpen(false);
    } catch (error) {
      console.error("Error assigning questions:", error);
      toast.error("Gagal assign pertanyaan");
      throw error;
    }
  };

  if (assessmentId <= 0) {
    return null;
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Aspect Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola aspects untuk {assessmentName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setAssignmentDialogOpen(true)}
              size="sm"
              variant="outline"
              disabled={questions.length === 0 || aspects.length === 0}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Manage Assignments
            </Button>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Aspect
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!isWeightValid && aspects.length > 0 && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Total weight: {totalWeight}%. Harus 100% untuk valid.
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Memuat aspects...
            </div>
          ) : aspects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada aspect untuk assessment ini.
              <br />
              <Button variant="link" onClick={handleAdd} className="mt-2">
                Tambah aspect pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="text-center">Weight (%)</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aspects.map((aspect: AspectResponse) => (
                  <TableRow key={aspect.id}>
                    <TableCell className="font-medium">{aspect.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={aspect.weight > 0 ? "default" : "secondary"}
                      >
                        {aspect.weight}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getQuestionCount(aspect.id) > 0 ? (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {getQuestionCount(aspect.id)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(aspect)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(aspect)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={isWeightValid ? "default" : "destructive"}>
                      {totalWeight}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {questions.length} total questions
                    </Badge>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AspectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assessmentId={assessmentId}
        aspect={editingAspect}
        onSuccess={() => refetch()}
      />

      <AspectQuestionAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        aspects={aspects}
        questions={questions}
        onAssign={handleAssignQuestions}
        loading={bulkUpdateAspectMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Aspect</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus aspect &quot;
              {deletingAspect?.name}&quot;? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
