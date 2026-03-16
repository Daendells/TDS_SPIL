import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useMutation } from "@tanstack/react-query";

interface AssignmentResponse {
  id: number;
  token: string;
  assessmentTypeId: number;
  status: string;
  attemptsCount: number;
}

export function useIncrementAttempts() {
  return useMutation({
    mutationFn: async (payload: { token: string; assessmentTypeId: number }) => {
      const response = await api.post<ApiReturn<AssignmentResponse>>(
        `/api/new-recruiters/increment-attempts/${payload.token}/${payload.assessmentTypeId}`
      );

      if (!response.data || !response.data.data) {
        throw new Error("Failed to increment attempts");
      }

      return response.data.data;
    },
  });
}
