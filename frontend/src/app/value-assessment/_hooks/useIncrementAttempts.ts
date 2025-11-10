import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useMutation } from "@tanstack/react-query";

interface SeafarerAssessmentResponse {
  id: number;
  seafarerCode: string;
  assessmentTypeId: number;
  status: string;
  attemptsCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useIncrementAttempts() {
  const mutation = useMutation({
    mutationFn: async (payload: {
      seafarerCode: string;
      assessmentTypeId: number;
    }) => {
      const response = await api.post<ApiReturn<SeafarerAssessmentResponse>>(
        `/api/seafarer-assessments/increment-attempts/${payload.seafarerCode}/${payload.assessmentTypeId}`
      );

      if (!response.data || !response.data.data) {
        throw new Error("Failed to increment attempts");
      }

      return response.data.data;
    },
  });

  return mutation;
}
