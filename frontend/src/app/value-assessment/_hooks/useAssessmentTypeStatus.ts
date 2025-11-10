import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useQuery } from "@tanstack/react-query";

export interface AssessmentTypeStatus {
  id: number;
  assessmentTypeName: string;
  startTime: string | null;
  endTime: string | null;
  maxAttempts: number | null;
  isOpen: boolean;
  openMessage: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
}

export function useCheckAssessmentTypeStatus(assessmentTypeId: number) {
  const response = useQuery<AssessmentTypeStatus>({
    queryKey: ["assessment-type-status", assessmentTypeId],
    enabled: !!assessmentTypeId,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssessmentTypeStatus>>(
          `/api/assessment-types/check-status/${assessmentTypeId}`
        );

        if (!response.data || !response.data.data) {
          throw new Error("Failed to fetch assessment type status");
        }

        return response.data.data;
      } catch (error: unknown) {
        console.error("Error fetching assessment type status:", error);
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return response;
}
