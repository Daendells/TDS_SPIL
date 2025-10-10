"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { ValueAssessmentData } from "./page";

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

interface Section2Props {
  onNext: () => void;
  onBack: () => void;
  assessmentData: ValueAssessmentData;
  updateAssessmentData: (data: Partial<ValueAssessmentData>) => void;
}

export default function Section2({ onNext, onBack, assessmentData, updateAssessmentData }: Section2Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>(assessmentData.section2Answers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api = useApi();

  // Fetch questions and options on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const questionsResponse = await api.get("/questions");
        const allQuestions = questionsResponse.data.data;
        
        const filteredQuestions = allQuestions.filter((q: Question) => q.role === "va_2");
        
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

    fetchData();
  }, [api]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentOptions = options.filter(option => option.questionId === currentQuestion?.questionId);

  const handleAnswerChange = (optionLetter: string) => {
    const newAnswers = { ...answers, [currentQuestion.questionId]: optionLetter };
    setAnswers(newAnswers);
    updateAssessmentData({ section2Answers: newAnswers });
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

  const jumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
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

      // Submit answers (you can implement the API call here)
      toast.success("Jawaban Section 2 berhasil disimpan");
      onNext();
      
    } catch (error) {
      console.error("Failed to submit answers:", error);
      toast.error("Gagal menyimpan jawaban");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat soal...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Tidak ada soal yang tersedia untuk Section 2</p>
          <Button onClick={onBack} className="mt-4">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <div className="flex justify-between items-center mb-6">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-16" />
            <div className="text-center">
              <h1 className="text-3xl font-bold uppercase text-gray-800 mb-2">
                Value Assessment Section 2
              </h1>
            </div>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-16" />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Panduan Pengisian:</h2>
          <div className="space-y-3 text-gray-700 mb-6">
            <p>Pada asesmen bagian 2 ini akan terdiri dari 60 pasang pernyataan, masing-masing berisi dua pernyataan (a dan b) bacalah masing-masing pernyataan dengan cermat.</p>
            <p>Pilihlah satu pernyataan yang paling menggambarkan sikap atau kebiasaan Anda dalam situasi kerja. Bila tidak ada satu pun dari pasangan pernyataan yang cocok, pilihlah yang Anda anggap benar.</p>
            <p>Jawablah dengan jujur dan sesuai dengan diri Anda, bukan berdasarkan jawaban yang Anda anggap ideal. Tidak ada jawaban benar atau salah dalam tes ini.</p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h3 className="font-bold text-blue-800 mb-2">Contoh:</h3>
            <div className="space-y-2 text-blue-700">
              <p><strong>a.</strong> saya adalah pekerja keras</p>
              <p><strong>b.</strong> saya tidak mudah murung</p>
            </div>
            <p className="text-blue-600 text-sm mt-2">
              Dalam hal ini apabila pernyataan "a" merupakan diri Anda maka pilihlah jawaban "a", begitu pun sebaliknya.
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Question Navigation Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm border p-6">
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
              {questions.map((_, index) => {
                const questionId = questions[index].questionId;
                const isAnswered = answers[questionId] !== undefined;
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => jumpToQuestion(index)}
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

          {/* Main Question Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">
                    Pernyataan {currentQuestionIndex + 1} dari {questions.length}
                  </h3>
                </div>

                <RadioGroup
                  value={answers[currentQuestion?.questionId] || ""}
                  onValueChange={(value) => handleAnswerChange(value)}
                >
                  <div className="space-y-6">
                    {currentOptions.map((option) => (
                      <div key={option.optionId} className="flex items-start space-x-4 p-6 rounded-lg border-2 hover:bg-gray-50 transition-colors">
                        <RadioGroupItem 
                          value={option.optionLetter} 
                          id={`option-${option.optionId}`}
                          className="mt-1"
                        />
                        <Label 
                          htmlFor={`option-${option.optionId}`} 
                          className="flex-1 cursor-pointer text-gray-700 leading-relaxed"
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-lg text-gray-800 min-w-[24px]">
                              {option.optionLetter}.
                            </span>
                            <span className="text-lg">
                              {option.optionText}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button 
                  onClick={handlePrevious}
                  variant="outline"
                  className="px-6 py-2"
                  disabled={currentQuestionIndex === 0}
                >
                  Soal Sebelumnya
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
                      {isSubmitting ? "Menyimpan..." : "Selesai Section 2"}
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