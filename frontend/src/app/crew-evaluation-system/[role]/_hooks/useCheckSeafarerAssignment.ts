import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import type { ReportData } from "@/types/report-types";
import { useQuery } from "@tanstack/react-query";

export interface AssignmentCheckResponse {
  isAssigned: boolean;
  message: string;
  seafarerCode: string;
  assessmentTypeId: number;
  personalData?: ReportData;
  attemptsCount: number;
  maxAttempts: number | null;
}

export function useCheckSeafarerAssignment(
  seafarerCode: string,
  assessmentTypeId: number
) {
  const response = useQuery<AssignmentCheckResponse>({
    queryKey: ["ces-seafarer-assignment", seafarerCode, assessmentTypeId],
    enabled: !!seafarerCode && !!assessmentTypeId,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssignmentCheckResponse>>(
          `/api/seafarer-assessments/check-assignment/${seafarerCode}/${assessmentTypeId}`
        );

        if (!response.data || !response.data.data) {
          throw new Error("Failed to check seafarer assignment");
        }

        return response.data.data;
      } catch (error: unknown) {
        console.error("Error checking seafarer assignment:", error);
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  return response;
}
