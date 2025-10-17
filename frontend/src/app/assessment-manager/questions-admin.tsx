"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Trash, FileText } from "lucide-react";
import { toast } from "sonner";
import { useDeleteQuestion, useBulkDeleteQuestions } from "./_hooks/useQuestion";
import QuestionDialog from "./question-dialog";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";
import BulkDeleteConfirmationDialog from "./bulk-delete-confirmation-dialog";
import { useGetAssessmentByRole } from "./_hooks/useAssessment";
import { QuestionOptionResponse } from "@/types/assessment";

const ROLES = [
  { value: "va_1", label: "VA_1 (COREVA)" },
  { value: "va_2", label: "VA_2 (Value Assessment)" },
  { value: "va_3", label: "VA_3 (Value Assessment)" },
  { value: "kkm", label: "KKM (Crew Evaluation)" },
  { value: "masinis_2", label: "Masinis 2 (Crew Evaluation)" },
  { value: "masinis_3", label: "Masinis 3 (Crew Evaluation)" },
  { value: "masinis_4", label: "Masinis 4 (Crew Evaluation)" },
  { value: "mualim_1", label: "Mualim 1 (Crew Evaluation)" },
  { value: "mualim_2", label: "Mualim 2 (Crew Evaluation)" },
  { value: "mualim_3", label: "Mualim 3 (Crew Evaluation)" },
  { value: "nahkoda", label: "Nahkoda (Crew Evaluation)" },
];

const VA_1_CATEGORIES = [
  "Integrity",
  "Customer Oriented",
  "Competitive",
  "Team Work",
  "Visioner",
];

export default function QuestionsAdmin() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionOptionResponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] =
    useState<QuestionOptionResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // React Query mutation for deleting questions
  const deleteQuestionMutation = useDeleteQuestion();
  const bulkDeleteMutation = useBulkDeleteQuestions();

  const {
    data: assessmentData,
    isLoading: loading,
    error,
    refetch,
  } = useGetAssessmentByRole(selectedRole);

  // Update questions when assessment data changes
  useEffect(() => {
    if (assessmentData && assessmentData.questions) {
      setQuestions(assessmentData.questions);
      setSelectedQuestions([]); // Reset selected questions when data changes
    } else if (selectedRole) {
      setQuestions([]);
      setSelectedQuestions([]);
    }
  }, [assessmentData, selectedRole]);

  const handleAddQuestion = () => {
    setDialogOpen(true);
  };

  const handleCrewEvaluationForm = () => {
    window.open("/crew-evaluation-system", "_blank");
  };

  const handleValueAssessmentForm = () => {
    window.open("/value-assessment", "_blank");
  };

  const handleEditQuestion = () => {
    // TODO: Pass question data to dialog for editing
    setDialogOpen(true);
  };

  const handleDeleteQuestion = (question: QuestionOptionResponse) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteQuestionMutation.mutateAsync(questionToDelete.questionId);
      toast.success("Pertanyaan berhasil dihapus");
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      // No need to call refetch() - mutation handles query invalidation
    } catch (error) {
      toast.error("Gagal menghapus pertanyaan");
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    if (refresh) {
      refetch();
    }
  };

  const handleSelectQuestion = (questionId: number, checked: boolean) => {
    if (checked) {
      setSelectedQuestions((prev) => [...prev, questionId]);
    } else {
      setSelectedQuestions((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(questions.map((q) => q.questionId));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedQuestions.length === 0) {
      toast.error("Silakan pilih pertanyaan untuk dihapus");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      // Use bulk delete endpoint for better performance
      await bulkDeleteMutation.mutateAsync(selectedQuestions);
      toast.success(`${selectedQuestions.length} pertanyaan berhasil dihapus`);
      setSelectedQuestions([]);
      setBulkDeleteDialogOpen(false);
      // No need to call refetch() - mutations handle query invalidation automatically
    } catch (error) {
      toast.error("Gagal menghapus pertanyaan yang dipilih");
      console.error(error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleCancelBulkDelete = () => {
    setBulkDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assessment Manager
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Posisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Pilih posisi..." />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRole && (
              <Button
                onClick={handleAddQuestion}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Pertanyaan
              </Button>
            )}
            {selectedRole &&
              ["va_1", "va_2", "va_3"].includes(selectedRole) && (
                <Button
                  onClick={handleValueAssessmentForm}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="h-4 w-4" />
                  Value Assessment Form
                </Button>
              )}
            {selectedRole &&
              !["va_1", "va_2", "va_3"].includes(selectedRole) && (
                <Button
                  onClick={handleCrewEvaluationForm}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="h-4 w-4" />
                  Crew Evaluation Form
                </Button>
              )}
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Pertanyaan untuk{" "}
                  {ROLES.find((r) => r.value === selectedRole)?.label}
                </CardTitle>
                <CardDescription>
                  {questions.length} question ditemukan
                </CardDescription>
              </div>
              {questions.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        selectedQuestions.length === questions.length &&
                        questions.length > 0
                      }
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked as boolean)
                      }
                    />
                    <span className="text-sm font-medium">Pilih Semua</span>
                  </div>
                  {selectedQuestions.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteLoading}
                      className="flex items-center gap-2"
                    >
                      <Trash className="h-4 w-4" />
                      Hapus Terpilih ({selectedQuestions.length})
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat pertanyaan...</div>
            ) : error && !assessmentData ? (
              <div className="text-center py-8 text-red-500">
                Error memuat data: {error.message}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada pertanyaan ditemukan untuk posisi ini. Klik {"'"}
                Tambah Pertanyaan{"'"} untuk membuat satu.
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.questionId}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedQuestions.includes(
                            question.questionId
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectQuestion(
                              question.questionId,
                              checked as boolean
                            )
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              Pertanyaan {index + 1}
                            </Badge>
                            {question.category && (
                              <Badge variant="secondary">
                                {question.category}
                              </Badge>
                            )}
                            {question.isImage === 1 && (
                              <Badge variant="outline">Ada Gambar</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-2">
                            {question.questionText}
                          </p>
                          {question.imageUrl && (
                            <p className="text-xs text-muted-foreground mb-2">
                              Gambar: {question.imageUrl}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuestion()}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Opsi:</h4>
                      {question.options.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Tidak ada opsi tersedia
                        </p>
                      ) : (
                        <div className="grid gap-2">
                          {question.options.map((option) => (
                            <div
                              key={option.optionId}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {option.optionLetter.toUpperCase()}
                                </Badge>
                                <span className="text-sm">
                                  {option.optionText}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Skor: {option.score}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <QuestionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        question={null} // TODO: Fix type compatibility between QuestionOptionResponse and Question
        role={selectedRole}
        categories={selectedRole === "va_1" ? VA_1_CATEGORIES : []}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        question={null} // TODO: Fix type compatibility between QuestionOptionResponse and QuestionWithOptions
        loading={deleteLoading}
      />

      <BulkDeleteConfirmationDialog
        open={bulkDeleteDialogOpen}
        onConfirm={handleConfirmBulkDelete}
        onCancel={handleCancelBulkDelete}
        selectedCount={selectedQuestions.length}
        loading={bulkDeleteLoading}
      />
    </div>
  );
}
