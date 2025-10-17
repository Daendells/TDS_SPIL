import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { AssessmentPayload, AssessmentResponse } from "@/types/assessment";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useGetAssessmentByRole(role: string) {
  const response = useQuery<AssessmentResponse>({
    queryKey: ["assessment", role],
    enabled: !!role,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssessmentResponse>>(
          `/api/assessments/${role}`
        );

        if (!response.data) {
          throw new Error("Failed to fetch assessment data");
        }

        return response.data.data;
      } catch (error: unknown) {
        // If assessment doesn't exist (404), return a default structure
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status === 404) {
          console.log(
            `No assessment found for role: ${role}, returning default structure`
          );
          return {
            assessmentId: 0,
            role: role,
            usingTimer: false,
            timerLimitMinutes: 60,
            questions: [],
          } as AssessmentResponse;
        }
        console.error("Error fetching assessment:", error);
        throw error;
      }
    },
  });

  return response;
}

export function useUpdateAssessmentById() {
  return useMutation<AssessmentResponse, Error, AssessmentPayload>({
    mutationFn: async (payload) => {
      const response = await api.put<ApiReturn<AssessmentResponse>>(
        `/api/assessments/${payload.id}`,
        {
          role: payload.role,
          usingTimer: payload.usingTimer,
          timerLimitMinutes: payload.timerLimitMinutes,
        }
      );

      if (!response.data) {
        throw new Error("Failed to update assessment data");
      }

      return response.data.data;
    },
  });
}
