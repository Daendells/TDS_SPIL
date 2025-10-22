import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { AssessmentResponse } from "@/types/assessment";
import { useQuery, useMutation } from "@tanstack/react-query";

export function useGetAssessmentByRole(role: string) {
  const response = useQuery<AssessmentResponse>({
    queryKey: ["assessment", role],
    enabled: !!role,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssessmentResponse>>(
          `/api/assessments/public/${role}`
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

interface AssessmentResultSubmit {
  seafarerCode: string;
  role: string;
  answers: { [questionId: number]: number };
}

interface AssessmentResultResponse {
  id: number;
  seafarerCode: string;
  role: string;
  answers: { [questionId: number]: number };
  submittedAt: string;
}

export function usePostAssessmentResults(onSuccess?: () => void) {
  const mutation = useMutation<
    AssessmentResultResponse,
    Error,
    AssessmentResultSubmit
  >({
    mutationFn: async (data: AssessmentResultSubmit) => {
      try {
        const response = await api.post<ApiReturn<AssessmentResultResponse>>(
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
