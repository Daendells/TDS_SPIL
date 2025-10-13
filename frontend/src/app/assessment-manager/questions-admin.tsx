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
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import QuestionDialog from "./question-dialog";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";

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
  const api = useApi();

  const fetchQuestions = async (role: string) => {
    if (!role) return;
    
    setLoading(true);
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
      toast.error("Failed to fetch questions");
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
      toast.success("Question deleted successfully");
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      fetchQuestions(selectedRole);
    } catch (error) {
      toast.error("Failed to delete question");
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
                <SelectValue placeholder="Select a role..." />
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
                Add Question
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>
              Questions for {ROLES.find(r => r.value === selectedRole)?.label}
            </CardTitle>
            <CardDescription>
              {questions.length} question ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No questions found for this role. Click "Add Question" to create one.
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.questionId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          {question.category && (
                            <Badge variant="secondary">{question.category}</Badge>
                          )}
                          {question.isImage === "1" && (
                            <Badge variant="outline">Has Image</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-2">{question.questionText}</p>
                        {question.imageUrl && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Image: {question.imageUrl}
                          </p>
                        )}
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
                      <h4 className="text-sm font-medium">Options:</h4>
                      {question.options.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No options available</p>
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
                                Score: {option.score}
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
    </div>
  );
}