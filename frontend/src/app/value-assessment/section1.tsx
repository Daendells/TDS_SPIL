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

interface Section1Props {
  onNext: () => void;
  onBack: () => void;
  assessmentData: ValueAssessmentData;
  updateAssessmentData: (data: Partial<ValueAssessmentData>) => void;
}

export default function Section1({ onNext, onBack, assessmentData, updateAssessmentData }: Section1Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: number }>(assessmentData.section1Answers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const api = useApi();

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time's up, auto submit
      handleSubmit();
    }
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch questions and options on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const questionsResponse = await api.get("/questions");
        const allQuestions = questionsResponse.data.data;
        
        const filteredQuestions = allQuestions.filter((q: Question) => q.role === "va_1");
        
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

  const handleAnswerChange = (optionId: number) => {
    const newAnswers = { ...answers, [currentQuestion.questionId]: optionId };
    setAnswers(newAnswers);
    updateAssessmentData({ section1Answers: newAnswers });
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
      toast.success("Jawaban Section 1 berhasil disimpan");
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
          <p className="text-gray-600">Tidak ada soal yang tersedia untuk Section 1</p>
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
                Value Assessment Section 1
              </h1>
            </div>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-16" />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Panduan Pengisian:</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Bacalah dengan cermat setiap situasi yang disajikan.</p>
            <p>2. Pilih satu jawaban yang paling menggambarkan tindakan yang akan Anda ambil dalam situasi tersebut.</p>
            <p>3. Tidak ada jawaban benar atau salah, pilihlah jawaban yang paling menggambarkan diri Anda dan sesuai dengan kebiasaan Anda bekerja, bukan jawaban yang Anda anggap ideal.</p>
            <p>4. Kerjakan asesmen ini secara mandiri tanpa berdiskusi dengan orang lain.</p>
            <p>5. <strong>Waktu pengerjaan: 30 Menit</strong></p>
          </div>
          
          {/* Timer */}
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center">
              <span className="text-red-600 font-bold text-xl">
                Waktu tersisa: {formatTime(timeLeft)}
              </span>
            </div>
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Soal {currentQuestionIndex + 1} dari {questions.length}
                  </h3>
                </div>
                
                <div className="text-gray-700 text-lg leading-relaxed mb-6">
                  {currentQuestion?.questionText}
                </div>

                <RadioGroup
                  value={answers[currentQuestion?.questionId]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(parseInt(value))}
                >
                  <div className="space-y-4">
                    {currentOptions.map((option) => (
                      <div key={option.optionId} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50">
                        <RadioGroupItem 
                          value={option.optionId.toString()} 
                          id={`option-${option.optionId}`}
                          className="mt-1"
                        />
                        <Label 
                          htmlFor={`option-${option.optionId}`} 
                          className="flex-1 cursor-pointer text-gray-700 leading-relaxed"
                        >
                          <span className="font-medium">{option.optionLetter}.</span> {option.optionText}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Navigation Buttons */}
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
                      {isSubmitting ? "Menyimpan..." : "Selesai Section 1"}
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