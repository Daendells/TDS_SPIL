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
import {
  Plus,
  Edit,
  Trash2,
  Trash,
  FileText,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuestion,
  useBulkDeleteQuestions,
  useGetQuestionsByAssessmentId,
  useBulkUpdateAspect,
} from "./_hooks/useQuestion";
import QuestionDialog from "./question-dialog";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";
import BulkDeleteConfirmationDialog from "./bulk-delete-confirmation-dialog";
import BulkAssignAspectDialog from "./bulk-assign-aspect-dialog";
import AddAssessmentDialog from "./add-assessment-dialog";
import AssessmentConfigDialog from "@/components/assessment-config-dialog";
import { AspectManager } from "./aspect-manager";
import { QuestionAspectSelector } from "./question-aspect-selector";
import { useGetAllAssessments } from "./_hooks/useAssessment";
import { useGetAspectsByAssessmentId } from "./_hooks/useAspect";
import { QuestionOptionResponse } from "@/types/assessment";
import Image from "next/image";
import { BASE_URL } from "../lib/api";
import { AspectResponse } from "@/types/aspect";

const VA_1_CATEGORIES = [
  "Integrity",
  "Customer Oriented",
  "Competitive",
  "Team Work",
  "Visioner",
];

export default function QuestionsAdmin() {
  const queryClient = useQueryClient();

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number>(0);
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
  const [bulkAssignAspectDialogOpen, setBulkAssignAspectDialogOpen] =
    useState(false);
  const [bulkAssignAspectLoading, setBulkAssignAspectLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [addAssessmentDialogOpen, setAddAssessmentDialogOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] =
    useState<QuestionOptionResponse | null>(null);

  const deleteQuestionMutation = useDeleteQuestion();
  const bulkDeleteMutation = useBulkDeleteQuestions();
  const bulkUpdateAspectMutation = useBulkUpdateAspect();

  const { data: assessments } = useGetAllAssessments();

  const {
    data: questionsData,
    isLoading: loading,
    error,
    refetch,
  } = useGetQuestionsByAssessmentId(selectedAssessmentId);

  const { data: aspectsData } =
    useGetAspectsByAssessmentId(selectedAssessmentId);

  useEffect(() => {
    if (questionsData && questionsData.data) {
      setQuestions(questionsData.data);
      setSelectedQuestions([]);
    } else if (selectedAssessmentId > 0) {
      setQuestions([]);
      setSelectedQuestions([]);
    }
  }, [questionsData, selectedAssessmentId]);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setDialogOpen(true);
  };

  const handleCrewEvaluationForm = () => {
    window.open("/crew-evaluation-system", "_blank");
  };

  const handleValueAssessmentForm = () => {
    window.open("/value-assessment", "_blank");
  };

  const handleConfigClick = () => {
    setConfigDialogOpen(true);
  };

  const handleEditQuestion = (question: QuestionOptionResponse) => {
    setEditingQuestion(question);
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
    setEditingQuestion(null);
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
      await bulkDeleteMutation.mutateAsync(selectedQuestions);
      toast.success(`${selectedQuestions.length} pertanyaan berhasil dihapus`);
      setSelectedQuestions([]);
      setBulkDeleteDialogOpen(false);
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


  const handleConfirmBulkAssignAspect = async (aspectId: number | null) => {
    setBulkAssignAspectLoading(true);
    try {
      await bulkUpdateAspectMutation.mutateAsync({
        questionIds: selectedQuestions,
        aspectId,
      });
      toast.success(
        `Aspect berhasil diassign ke ${selectedQuestions.length} pertanyaan`
      );
      setSelectedQuestions([]);
      setBulkAssignAspectDialogOpen(false);
    } catch (error) {
      toast.error("Gagal mengassign aspect ke pertanyaan yang dipilih");
      console.error(error);
    } finally {
      setBulkAssignAspectLoading(false);
    }
  };

  const handleCancelBulkAssignAspect = () => {
    setBulkAssignAspectDialogOpen(false);
  };

  const handleAddAssessmentSuccess = () => {
    setAddAssessmentDialogOpen(false);
    // Invalidate assessments query to refetch the list
    queryClient.invalidateQueries({ queryKey: ["assessments"] });
  };

  const getAspectName = (aspectId?: number) => {
    if (!aspectId || !aspectsData) return null;
    const aspect = aspectsData.find((a: AspectResponse) => a.id === aspectId);
    return aspect ? aspect.name : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assessment Manager
          </h1>
        </div>
        <Button
          onClick={() => setAddAssessmentDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Assessment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Posisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedAssessmentId.toString()}
              onValueChange={(value) => {
                const assessmentId = parseInt(value);
                setSelectedAssessmentId(assessmentId);
                const assessment = assessments?.find(
                  (a) => a.assessmentId === assessmentId
                );
                if (assessment) {
                  setSelectedRole(assessment.role);
                }
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Pilih posisi" />
              </SelectTrigger>
              <SelectContent>
                {assessments?.map((assessment) => (
                  <SelectItem
                    key={assessment.assessmentId}
                    value={assessment.assessmentId.toString()}
                  >
                    {assessment.assessmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAssessmentId > 0 && (
              <>
                <Button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Pertanyaan
                </Button>
                <Button
                  onClick={handleConfigClick}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Konfigurasi Assessment
                </Button>
              </>
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

      {selectedAssessmentId > 0 && (
        <AspectManager
          assessmentId={selectedAssessmentId}
          assessmentName={
            assessments?.find((a) => a.assessmentId === selectedAssessmentId)
              ?.assessmentName || "Assessment"
          }
        />
      )}

      {selectedAssessmentId > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Pertanyaan untuk{" "}
                  {assessments?.find(
                    (a) => a.assessmentId === selectedAssessmentId
                  )?.assessmentName || "Assessment"}
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
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat pertanyaan...</div>
            ) : error && !questionsData ? (
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

                            {getAspectName(question.aspectId) && (
                              <Badge variant="default" className="bg-blue-600">
                                {getAspectName(question.aspectId)}
                              </Badge>
                            )}
                            {question.isImage === 1 && (
                              <Badge variant="outline">Ada Gambar</Badge>
                            )}
                          </div>
                          {question.imageUrl && (
                            <Image
                              src={BASE_URL + question.imageUrl}
                              alt={`Gambar untuk pertanyaan ${index + 1}`}
                              width={300}
                              height={200}
                              className="mb-2 rounded"
                            />
                          )}
                          <p className="text-sm font-medium mb-2">
                            {question.questionText}
                          </p>
                          <div className="mt-2 flex gap-2 items-center">
                            <span className="text-xs text-muted-foreground mr-2">
                              Aspect:
                            </span>
                            <QuestionAspectSelector
                              questionId={question.questionId}
                              currentAspectId={question.aspectId}
                              assessmentId={selectedAssessmentId}
                              aspects={aspectsData ?? []}
                              onSuccess={() => refetch()}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
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
                                <div className="flex flex-col gap-2">
                                  {option.imageUrl && (
                                    <Image
                                      src={BASE_URL + option.imageUrl}
                                      alt={option.optionLetter}
                                      width={300}
                                      height={200}
                                      className="rounded"
                                    />
                                  )}
                                  <span className="text-sm">
                                    {option.optionText}
                                  </span>
                                </div>
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
        question={
          editingQuestion
            ? {
                questionId: editingQuestion.questionId,
                assessmentId: selectedAssessmentId,
                questionText: editingQuestion.questionText,
                category: editingQuestion.category,
                isImage: editingQuestion.isImage.toString(),
                imageUrl: editingQuestion.imageUrl,
                aspectId: editingQuestion.aspectId,
                options: editingQuestion.options.map((option) => ({
                  ...option,
                  score: option.score ?? 0,
                })),
              }
            : null
        }
        assessmentId={selectedAssessmentId}
        role={selectedRole}
        categories={selectedRole === "va_1" ? VA_1_CATEGORIES : []}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        question={null}
        loading={deleteLoading}
      />

      <BulkDeleteConfirmationDialog
        open={bulkDeleteDialogOpen}
        onConfirm={handleConfirmBulkDelete}
        onCancel={handleCancelBulkDelete}
        selectedCount={selectedQuestions.length}
        loading={bulkDeleteLoading}
      />

      <BulkAssignAspectDialog
        open={bulkAssignAspectDialogOpen}
        onConfirm={handleConfirmBulkAssignAspect}
        onCancel={handleCancelBulkAssignAspect}
        selectedCount={selectedQuestions.length}
        aspects={aspectsData ?? []}
        loading={bulkAssignAspectLoading}
      />

      <AssessmentConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        selectedRole={selectedRole}
        onAssessmentChange={() => refetch()}
      />

      <AddAssessmentDialog
        open={addAssessmentDialogOpen}
        setOpen={setAddAssessmentDialogOpen}
        onSuccess={handleAddAssessmentSuccess}
      />
    </div>
  );
}
