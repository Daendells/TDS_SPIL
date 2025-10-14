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
import { Plus, Edit, Trash2, Trash, FileText, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { useRouter } from "next/navigation";
import QuestionDialog from "./question-dialog";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";
import BulkDeleteConfirmationDialog from "./bulk-delete-confirmation-dialog";

interface Question {
  questionId: number;
  role: string;
  questionText: string;
  category?: string;
  isImage?: string;
  imageUrl?: string;
}

interface Option {
  optionId: number;
  questionId: number;
  optionLetter: string;
  optionText: string;
  score: number;
  isImage: number;
}

interface QuestionWithOptions extends Question {
  options: Option[];
}

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
  "Visioner"
];

export default function QuestionsAdmin() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithOptions | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionWithOptions | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const api = useApi();
  const router = useRouter();

  const fetchQuestions = async (role: string) => {
    if (!role) return;
    
    setLoading(true);
    setSelectedQuestions([]); // Reset selected questions when role changes
    try {
      const questionsResponse = await api.get(`/api/questions/role/${role}`);
      const questionsData = questionsResponse.data.data || [];
      
      const questionsWithOptions = await Promise.all(
        questionsData.map(async (question: Question) => {
          try {
            const optionsResponse = await api.get(`/api/options/question/${question.questionId}`);
            return {
              ...question,
              options: optionsResponse.data.data || []
            };
          } catch (error) {
            return {
              ...question,
              options: []
            };
          }
        })
      );
      
      setQuestions(questionsWithOptions);
    } catch (error) {
      toast.error("Gagal mengambil pertanyaan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRole) {
      fetchQuestions(selectedRole);
    }
  }, [selectedRole]);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setDialogOpen(true);
  };

  const handleCrewEvaluationForm = () => {
    window.open('http://localhost:3000/crew-evaluation-system', '_blank');
  };

  const handleValueAssessmentForm = () => {
    window.open('http://localhost:3000/value-assessment', '_blank');
  };

  const handleEditQuestion = (question: QuestionWithOptions) => {
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleDeleteQuestion = (question: QuestionWithOptions) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/api/questions/${questionToDelete.questionId}`);
      toast.success("Pertanyaan berhasil dihapus");
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      fetchQuestions(selectedRole);
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
      fetchQuestions(selectedRole);
    }
  };

  const handleSelectQuestion = (questionId: number, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(questions.map(q => q.questionId));
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
      await api.delete('/api/questions/bulk', {
        data: { questionIds: selectedQuestions }
      });
      toast.success(`${selectedQuestions.length} pertanyaan berhasil dihapus`);
      setSelectedQuestions([]);
      setBulkDeleteDialogOpen(false);
      fetchQuestions(selectedRole);
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
          <h1 className="text-3xl font-bold tracking-tight">Assessment Manager</h1>        
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
              <Button onClick={handleAddQuestion} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Pertanyaan
              </Button>
            )}            
            {selectedRole && ['va_1', 'va_2', 'va_3'].includes(selectedRole) && (
              <Button 
                onClick={handleValueAssessmentForm} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <FileText className="h-4 w-4" />
                Value Assessment Form
              </Button>
            )}            
            {selectedRole && !['va_1', 'va_2', 'va_3'].includes(selectedRole) && (
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
                  Pertanyaan untuk {ROLES.find(r => r.value === selectedRole)?.label}
                </CardTitle>
                <CardDescription>
                  {questions.length} question ditemukan
                </CardDescription>
              </div>
              {questions.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedQuestions.length === questions.length && questions.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
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
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                  Tidak ada pertanyaan ditemukan untuk posisi ini. Klik "Tambah Pertanyaan" untuk membuat satu.
                </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.questionId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedQuestions.includes(question.questionId)}
                          onCheckedChange={(checked) => 
                            handleSelectQuestion(question.questionId, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Pertanyaan {index + 1}</Badge>
                            {question.category && (
                              <Badge variant="secondary">{question.category}</Badge>
                            )}
                            {question.isImage === "1" && (
                              <Badge variant="outline">Ada Gambar</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-2">{question.questionText}</p>
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
                        <p className="text-sm text-muted-foreground">Tidak ada opsi tersedia</p>
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
                                <span className="text-sm">{option.optionText}</span>
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
        question={editingQuestion}
        role={selectedRole}
        categories={selectedRole === "va_1" ? VA_1_CATEGORIES : []}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        question={questionToDelete}
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