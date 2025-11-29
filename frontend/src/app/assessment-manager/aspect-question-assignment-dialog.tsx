"use client";

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Filter } from "lucide-react";
import { AspectResponse } from "@/types/aspect";
import { QuestionOptionResponse } from "@/types/assessment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AspectQuestionAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aspects: AspectResponse[];
  questions: QuestionOptionResponse[];
  onAssign: (questionIds: number[], aspectId: number | null) => Promise<void>;
  loading?: boolean;
}

export function AspectQuestionAssignmentDialog({
  open,
  onOpenChange,
  aspects,
  questions,
  onAssign,
  loading = false,
}: AspectQuestionAssignmentDialogProps) {
  const [selectedAspectId, setSelectedAspectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [targetAspectId, setTargetAspectId] = useState<string>("0");
  const [activeTab, setActiveTab] = useState<"filter" | "assign">("filter");

  // Filter questions based on search and aspect
  const filteredQuestions = useMemo(() => {
    let filtered = questions;

    // Filter by aspect
    if (selectedAspectId !== "all") {
      if (selectedAspectId === "unassigned") {
        filtered = filtered.filter((q) => !q.aspectId);
      } else {
        const aspectId = parseInt(selectedAspectId);
        filtered = filtered.filter((q) => q.aspectId === aspectId);
      }
    }

    // Filter by search query (question number or text)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q, index) => {
        const questionNumber = (index + 1).toString();
        const questionText = q.questionText.toLowerCase();
        return questionNumber.includes(query) || questionText.includes(query);
      });
    }

    return filtered;
  }, [questions, selectedAspectId, searchQuery]);

  // Get aspect by ID
  const getAspectById = (aspectId?: number | null) => {
    if (!aspectId) return null;
    return aspects.find((a) => a.id === aspectId);
  };

  // Get question count per aspect
  const getAspectQuestionCount = (aspectId: number) => {
    return questions.filter((q) => q.aspectId === aspectId).length;
  };

  const unassignedCount = questions.filter((q) => !q.aspectId).length;

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds(filteredQuestions.map((q) => q.questionId));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  // Handle individual selection
  const handleSelectQuestion = (questionId: number, checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds((prev) => [...prev, questionId]);
    } else {
      setSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
    }
  };

  // Handle assign
  const handleAssign = async () => {
    if (selectedQuestionIds.length === 0) return;

    const aspectId = targetAspectId === "0" ? null : parseInt(targetAspectId);
    await onAssign(selectedQuestionIds, aspectId);

    // Reset state
    setSelectedQuestionIds([]);
    setTargetAspectId("0");
    setSearchQuery("");
    setActiveTab("filter");
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedQuestionIds([]);
    setTargetAspectId("0");
    setSearchQuery("");
    setSelectedAspectId("all");
    setActiveTab("filter");
    onOpenChange(false);
  };

  const allFilteredSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedQuestionIds.includes(q.questionId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assign Questions to Aspects</DialogTitle>
          <DialogDescription>
            Filter dan pilih pertanyaan, kemudian assign ke aspect yang diinginkan
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "filter" | "assign")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filter">
              1. Filter & Pilih Questions
              {selectedQuestionIds.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedQuestionIds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assign" disabled={selectedQuestionIds.length === 0}>
              2. Assign to Aspect
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filter" className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by Aspect
                </label>
                <Select value={selectedAspectId} onValueChange={setSelectedAspectId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Questions ({questions.length})</SelectItem>
                    <SelectItem value="unassigned">Belum Di-assign ({unassignedCount})</SelectItem>
                    {aspects.map((aspect) => (
                      <SelectItem key={aspect.id} value={aspect.id.toString()}>
                        {aspect.name} ({getAspectQuestionCount(aspect.id)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Question
                </label>
                <Input
                  placeholder="Cari berdasarkan nomor atau teks pertanyaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Question List */}
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                  <span className="text-sm font-medium">
                    Pilih Semua ({filteredQuestions.length} questions)
                  </span>
                </div>
                {selectedQuestionIds.length > 0 && (
                  <Button size="sm" onClick={() => setActiveTab("assign")}>
                    Lanjut ke Assign →
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[400px]">
                <div className="p-2 space-y-2">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Tidak ada pertanyaan yang sesuai dengan filter
                    </div>
                  ) : (
                    filteredQuestions.map((question) => {
                      const originalIndex = questions.findIndex(
                        (q) => q.questionId === question.questionId
                      );
                      const questionNumber = originalIndex + 1;
                      const currentAspect = getAspectById(question.aspectId);

                      return (
                        <div
                          key={question.questionId}
                          className={`border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                            selectedQuestionIds.includes(question.questionId)
                              ? "bg-blue-50 border-blue-300"
                              : ""
                          }`}
                          onClick={() => {
                            const isCurrentlyChecked = selectedQuestionIds.includes(
                              question.questionId
                            );
                            handleSelectQuestion(question.questionId, !isCurrentlyChecked);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedQuestionIds.includes(question.questionId)}
                              onCheckedChange={(checked) =>
                                handleSelectQuestion(question.questionId, checked as boolean)
                              }
                              className="mt-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline">Q{questionNumber}</Badge>
                                {currentAspect ? (
                                  <Badge variant="default" className="bg-blue-600">
                                    {currentAspect.name}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">No Aspect</Badge>
                                )}
                                {question.category && (
                                  <Badge variant="outline">{question.category}</Badge>
                                )}
                              </div>
                              <p className="text-sm line-clamp-2">{question.questionText}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="assign" className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{selectedQuestionIds.length} Questions Selected</Badge>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Pilih Aspect Target</label>
                <Select value={targetAspectId} onValueChange={setTargetAspectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih aspect...">
                      {targetAspectId === "0" ? (
                        <span className="text-muted-foreground">Hapus Assignment</span>
                      ) : (
                        aspects.find((a) => a.id.toString() === targetAspectId)?.name
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      <span className="text-muted-foreground">Hapus Assignment</span>
                    </SelectItem>
                    {aspects.map((aspect) => (
                      <SelectItem key={aspect.id} value={aspect.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{aspect.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {aspect.weight}%
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getAspectQuestionCount(aspect.id)} questions
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    {selectedQuestionIds.length} pertanyaan akan{" "}
                    {targetAspectId === "0" ? (
                      <strong>dihapus assignment-nya</strong>
                    ) : (
                      <>
                        di-assign ke aspect{" "}
                        <strong>
                          {aspects.find((a) => a.id.toString() === targetAspectId)?.name}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab("filter")} className="flex-1">
                ← Kembali ke Filter
              </Button>
              <Button onClick={handleAssign} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign ${selectedQuestionIds.length} Questions`
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
