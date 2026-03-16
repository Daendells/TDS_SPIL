import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { AssessmentResponse } from "@/types/assessment";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useGetAssessmentByRole(role: string) {
  return useQuery<AssessmentResponse>({
    queryKey: ["assessment", role],
    enabled: !!role,
    queryFn: async () => {
      const response = await api.get<ApiReturn<AssessmentResponse>>(
        `/api/assessments/public/${role}`
      );

      if (!response.data) {
        throw new Error("Failed to fetch assessment data");
      }

      return response.data.data;
    },
  });
}

interface AssessmentResultSubmit {
  token: string;
  role: string;
  answers: { [questionId: number]: number };
}

interface AssessmentResultResponse {
  id: number;
  token: string;
  role: string;
  submittedAt: string;
}

export function usePostAssessmentResults(onSuccess?: () => void) {
  return useMutation<AssessmentResultResponse, Error, AssessmentResultSubmit>({
    mutationFn: async (data) => {
      const response = await api.post<ApiReturn<AssessmentResultResponse>>(
        "/api/new-recruiters/assessment-results/submit",
        data
      );

      if (!response.data || !response.data.data) {
        throw new Error("Failed to submit assessment results");
      }

      return response.data.data;
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });
}
