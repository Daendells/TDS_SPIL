import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useMutation, useQuery } from "@tanstack/react-query";

export type OptionPublicResponse = {
  optionId: number;
  optionLetter: string;
  optionText: string;
  isImage: number; // 0 or 1 from backend
  imageUrl: string;
};

export type QuestionOptionPublicResponse = {
  questionId: number;
  questionText: string;
  category: string;
  isImage: string; // "0" or "1" from backend
  imageUrl: string;
  options: OptionPublicResponse[];
  questionType: string;
};

export type QuizAssessmentSection = {
  assessmentId: number;
  assessmentName: string;
  usingTimer: boolean;
  timerLimitMinutes: number | null;
  questions: QuestionOptionPublicResponse[];
};

export type QuizDataResponse = {
  assessmentTypeId: number;
  assessmentTypeName: string;
  assessments: QuizAssessmentSection[];
  totalQuestions: number;
};

export type QuizAnswerSubmit = {
  questionId: number;
  selectedOptions?: number[];
  textAnswer?: string;
};

export type QuizSubmitRequest = {
  seamanCode: string;
  assessmentTypeId: number;
  answers: QuizAnswerSubmit[];
};

export type OptionHistoryData = {
  optionId: number;
  optionLetter: string;
  optionText: string;
  imageUrl?: string;
  isSelected: boolean;
  scorePercentage: number;
  isCorrect: boolean;
};

export type QuizAnswerDetailResponse = {
  questionId: number;
  questionText: string;
  questionType: string;
  selectedOptions?: number[];
  textAnswer?: string;
  correctOptions?: number[];
  acceptableAnswers?: string[];
  isCorrect: boolean;
  scoreEarned: number;
  maxScore: number;
  assessmentId?: number;
  assessmentName?: string;
  options?: OptionHistoryData[];
};

export type QuizAttemptDetailResponse = {
  id: number;
  seamanCode: string;
  assessmentTypeId: number;
  assessmentTypeName: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  completedAt: string;
  completedAtFormatted: string;
  answers: QuizAnswerDetailResponse[];
};

export type QuizAttemptResponse = {
  id: number;
  seamanCode: string;
  assessmentTypeId: number;
  assessmentTypeName: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  completedAt: string;
  completedAtFormatted: string;
};

export function useGetQuizData(assessmentTypeId: number) {
  return useQuery<QuizDataResponse>({
    queryKey: ["quiz", assessmentTypeId],
    enabled: !!assessmentTypeId && assessmentTypeId > 0,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<QuizDataResponse>>(
          `/api/quiz/${assessmentTypeId}`
        );
        if (!response.data) throw new Error("Failed to fetch quiz data");
        return response.data.data;
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        throw error;
      }
    },
  });
}

export function useSubmitQuiz() {
  return useMutation<QuizAttemptResponse, Error, QuizSubmitRequest>({
    mutationFn: async (payload) => {
      const response = await api.post<ApiReturn<QuizAttemptResponse>>("/api/quiz/submit", payload);
      if (!response.data) throw new Error("Failed to submit quiz");
      return response.data.data;
    },
  });
}

export function useGetQuizHistory(seamanCode?: string) {
  return useQuery<QuizAttemptResponse[]>({
    queryKey: ["quizHistory", seamanCode],
    queryFn: async () => {
      const params = seamanCode ? { seamanCode } : {};
      const response = await api.get<ApiReturn<QuizAttemptResponse[]>>("/api/quiz/history", {
        params,
      });
      if (!response.data) throw new Error("Failed to fetch quiz history");
      return response.data.data;
    },
  });
}

export function useGetQuizAttempt(attemptId: number) {
  return useQuery<QuizAttemptDetailResponse>({
    queryKey: ["quizAttempt", attemptId],
    enabled: !!attemptId && attemptId > 0,
    queryFn: async () => {
      const response = await api.get<ApiReturn<QuizAttemptDetailResponse>>(
        `/api/quiz/history/${attemptId}`
      );
      if (!response.data) throw new Error("Failed to fetch quiz attempt");
      return response.data.data;
    },
  });
}
