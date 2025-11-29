import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useQuery, useMutation } from "@tanstack/react-query";

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
  role: string;
  usingTimer: boolean;
  timerLimitMinutes: number;
  questions: QuestionOptionPublicResponse[];
}

export function useGetAssessmentByRole(role: string) {
  const response = useQuery<AssessmentPublicResponse>({
    queryKey: ["ces-assessment", role],
    enabled: !!role,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssessmentPublicResponse>>(
          `/api/assessments/public/${role}`
        );

        if (!response.data) {
          throw new Error("Failed to fetch assessment data");
        }

        return response.data.data;
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status === 404) {
          console.log(`No assessment found for role: ${role}, returning default structure`);
          return {
            assessmentId: 0,
            role: role,
            usingTimer: false,
            timerLimitMinutes: 60,
            questions: [],
          } as AssessmentPublicResponse;
        }
        console.error("Error fetching assessment:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return response;
}

interface CESResultSubmit {
  seafarerCode: string;
  role: string;
  answers: { [questionId: number]: number };
}

interface CESResultResponse {
  id: number;
  seafarerCode: string;
  role: string;
  answers: { [questionId: number]: number };
  submittedAt: string;
}

export function usePostCESResults(onSuccess?: () => void) {
  const mutation = useMutation<CESResultResponse, Error, CESResultSubmit>({
    mutationFn: async (data: CESResultSubmit) => {
      try {
        const response = await api.post<ApiReturn<CESResultResponse>>(
          "/assessment-results/submit",
          data
        );

        if (!response.data || !response.data.data) {
          throw new Error("Failed to submit assessment results");
        }

        return response.data.data;
      } catch (error: unknown) {
        console.error("Error submitting assessment results:", error);
        throw error;
      }
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  return mutation;
}
