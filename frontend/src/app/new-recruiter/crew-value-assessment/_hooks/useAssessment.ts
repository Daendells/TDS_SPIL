import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface OptionPublicResponse {
  optionId: number;
  optionLetter: string;
  optionText: string;
  isImage: number;
  imageUrl: string;
}

export interface QuestionOptionPublicResponse {
  questionId: number;
  questionText: string;
  category: string;
  isImage: number;
  imageUrl: string;
  options: OptionPublicResponse[];
}

export interface AssessmentPublicResponse {
  assessmentId: number;
  assessmentName: string;
  role: string;
  usingTimer: boolean;
  timerLimitMinutes: number;
  tutorialContent?: string | null;
  tutorialTimerMinutes?: number | null;
  questions: QuestionOptionPublicResponse[];
}

export function useGetAssessmentByRole(role: string) {
  return useQuery<AssessmentPublicResponse>({
    queryKey: ["new-recruiter-ces-assessment", role],
    enabled: !!role,
    queryFn: async () => {
      const response = await api.get<ApiReturn<AssessmentPublicResponse>>(
        `/api/assessments/public/${role}`
      );
      if (!response.data) {
        throw new Error("Failed to fetch assessment data");
      }
      return response.data.data;
    },
    staleTime: 300_000,
    gcTime: 600_000,
  });
}

interface CESResultSubmit {
  token: string;
  role: string;
  answers: { [questionId: number]: number };
}

interface CESResultResponse {
  id: number;
  token: string;
  role: string;
  submittedAt: string;
}

export function usePostCESResults(onSuccess?: () => void) {
  return useMutation<CESResultResponse, Error, CESResultSubmit>({
    mutationFn: async (data) => {
      const response = await api.post<ApiReturn<CESResultResponse>>(
        "/api/new-recruiters/assessment-results/submit",
        data
      );
      if (!response.data || !response.data.data) {
        throw new Error("Failed to submit assessment results");
      }
      return response.data.data;
    },
    onSuccess: () => onSuccess?.(),
  });
}
