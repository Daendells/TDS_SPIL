import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useMutation, useQuery } from "@tanstack/react-query";

export type OptionPublicResponse = {
  optionId: number;
  optionLetter: string;
  optionText: string;
  isImage: number;
  imageUrl: string;
};

export type QuestionOptionPublicResponse = {
  questionId: number;
  questionText: string;
  category: string;
  isImage: string;
  imageUrl: string;
  options: OptionPublicResponse[];
  questionType: string;
};

export type QuizAssessmentSection = {
  assessmentId: number;
  assessmentName: string;
  usingTimer: boolean;
  timerLimitMinutes: number | null;
  tutorialContent?: string | null;
  tutorialTimerMinutes?: number | null;
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
  token: string;
  assessmentTypeId: number;
  answers: QuizAnswerSubmit[];
};

export type QuizAttemptResponse = {
  id: number;
  token: string;
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
    queryKey: ["new-recruiter-quiz", assessmentTypeId],
    enabled: !!assessmentTypeId && assessmentTypeId > 0,
    queryFn: async () => {
      const response = await api.get<ApiReturn<QuizDataResponse>>(`/api/quiz/${assessmentTypeId}`);
      if (!response.data) throw new Error("Failed to fetch quiz data");
      return response.data.data;
    },
  });
}

export function useSubmitQuiz() {
  return useMutation<QuizAttemptResponse, Error, QuizSubmitRequest>({
    mutationFn: async (payload) => {
      const response = await api.post<ApiReturn<QuizAttemptResponse>>(
        "/api/new-recruiters/quiz/submit",
        payload
      );
      if (!response.data) throw new Error("Failed to submit quiz");
      return response.data.data;
    },
  });
}
