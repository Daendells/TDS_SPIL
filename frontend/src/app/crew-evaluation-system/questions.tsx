"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { AssessmentData } from "./page";

interface Question {
  questionId: number;
  role: string;
  questionText: string;
}

interface Option {
  optionId: number;
  questionId: number;
  optionLetter: string;
  optionText: string;
  score: number;
  isImage: number;
}

interface QuestionsProps {
  onBack: () => void;
  assessmentData: AssessmentData;
  updateAssessmentData: (data: Partial<AssessmentData>) => void;
}

export default function Questions({ onBack, assessmentData, updateAssessmentData }: QuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: number }>(assessmentData.answers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api = useApi();

  // Fetch questions and options on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const questionsResponse = await api.get("/questions");
        const allQuestions = questionsResponse.data.data;
        
        const filteredQuestions = allQuestions.filter((q: Question) => q.role === assessmentData.rank);
        
        filteredQuestions.sort((a: Question, b: Question) => a.questionId - b.questionId);
        
        setQuestions(filteredQuestions);
        
        const optionsResponse = await api.get("/options");
        const allOptions = optionsResponse.data.data;
        
        const questionIds = filteredQuestions.map((q: Question) => q.questionId);
        const filteredOptions = allOptions.filter((o: Option) => questionIds.includes(o.questionId));
        
        filteredOptions.sort((a: Option, b: Option) => {
          if (a.questionId !== b.questionId) {
            return a.questionId - b.questionId;
          }
          return a.optionLetter.localeCompare(b.optionLetter);
        });
        
        setOptions(filteredOptions);
        
      } catch (error) {
        console.error("Failed to fetch questions and options:", error);
        toast.error("Gagal memuat soal dan pilihan jawaban");
      } finally {
        setLoading(false);
      }
    };

    if (assessmentData.rank) {
      fetchData();
    }
  }, [api, assessmentData.rank]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentOptions = options.filter(option => option.questionId === currentQuestion?.questionId);

  const handleAnswerChange = (optionId: number) => {
    const newAnswers = { ...answers, [currentQuestion.questionId]: optionId };
    setAnswers(newAnswers);
    updateAssessmentData({ answers: newAnswers });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionJump = (questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Check if all questions are answered
      const unansweredQuestions = questions.filter(q => !answers[q.questionId]);
      if (unansweredQuestions.length > 0) {
        toast.error(`Masih ada ${unansweredQuestions.length} soal yang belum dijawab`);
        return;
      }

      toast.success("Asesmen berhasil diselesaikan!");
      console.log("Assessment completed:", {
        ...assessmentData,
        answers
      });
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      toast.error("Gagal mengirim hasil asesmen");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat soal...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <p className="text-gray-600">Tidak ada soal yang tersedia untuk rank yang dipilih.</p>
              <Button onClick={onBack} className="mt-4">
                Kembali
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-4">
          <div className="flex justify-between items-center mb-6">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-16" />
            <div className="text-center">
              <h1 className="text-3xl font-bold uppercase text-gray-800 mb-2">
                Crew Evaluation System
              </h1>
              
            </div>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-16" />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Question Navigation Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Navigasi Soal</h3>
              
              {/* Progress Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Progress:</div>
                <div className="text-lg font-bold text-gray-800">
                  {Object.keys(answers).length} / {questions.length}
                </div>
                <div className="text-sm text-gray-500">soal terjawab</div>
              </div>

              {/* Question Numbers Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const isAnswered = answers[question.questionId] !== undefined;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.questionId}
                      onClick={() => handleQuestionJump(index)}
                      className={`
                        w-10 h-10 rounded-lg border-2 font-medium text-sm transition-all
                        ${isCurrent 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : isAnswered 
                            ? 'bg-gray-800 text-white border-gray-800' 
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Soal saat ini</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-800 rounded"></div>
                  <span className="text-gray-600">Sudah dijawab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-600">Belum dijawab</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Question Section */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-4">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    Soal {currentQuestionIndex + 1} dari {questions.length}
                  </h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {currentQuestion?.questionText}
                </p>
              </div>

              {/* Options */}
              <RadioGroup 
                value={answers[currentQuestion?.questionId]?.toString() || ""} 
                onValueChange={(value) => handleAnswerChange(parseInt(value))}
              >
                <div className="space-y-4">
                  {currentOptions.map((option) => (
                    <div key={option.optionId} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem 
                        value={option.optionId.toString()} 
                        id={`option-${option.optionId}`}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`option-${option.optionId}`} 
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium text-gray-800 mr-2">
                          {option.optionLetter.toUpperCase()}.
                        </span>
                        <span className="text-gray-700">
                          {option.optionText}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex justify-between pt-6 border-t">
                <Button 
                  onClick={currentQuestionIndex === 0 ? onBack : handlePrevious}
                  variant="outline"
                  className="px-6 py-2"
                >
                  {currentQuestionIndex === 0 ? "Kembali ke Identitas" : "Soal Sebelumnya"}
                </Button>
                
                <div className="flex gap-3">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button 
                      onClick={handleNext}
                      className="px-6 py-2 bg-gray-800 hover:bg-gray-700"
                    >
                      Soal Berikutnya
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? "Mengirim..." : "Selesai"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}