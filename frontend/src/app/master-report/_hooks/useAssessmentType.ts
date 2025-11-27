import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useQuery, useMutation } from "@tanstack/react-query";

export interface AssessmentType {
  id: number;
  assessmentTypeName: string;
  startTime?: string;
  endTime?: string;
  maxAttempts?: number;
}

export interface AssessmentTypeUpdateRequest {
  id: number;
  assessmentTypeName: string;
  startTime?: string;
  endTime?: string;
  maxAttempts?: number;
}

// Get all assessment types
export function useGetAllAssessmentTypes() {
  return useQuery<AssessmentType[]>({
    queryKey: ["assessment-types"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssessmentType[]>>("/api/assessment-types");
        return response.data.data || [];
      } catch (error) {
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update assessment type
export function useUpdateAssessmentType() {
  return useMutation({
    mutationFn: async (payload: AssessmentTypeUpdateRequest) => {
      try {
        const response = await api.put<ApiReturn<AssessmentType>>(
          `/api/assessment-types/${payload.id}`,
          payload
        );
        return response.data.data;
      } catch (error) {
        throw error;
      }
    },
  });
}
