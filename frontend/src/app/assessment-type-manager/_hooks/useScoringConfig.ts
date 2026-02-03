import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useQuery, useMutation } from "@tanstack/react-query";

export interface ScoringConfig {
  assessmentTypeId: number;
  assessmentTypeName: string;
  scoringType: "default" | "custom";
  scoringFormula?: string | null;
  usePercentage: boolean;
}

export interface UpdateScoringConfigRequest {
  assessmentTypeId: number;
  scoringType: "default" | "custom";
  scoringFormula?: string | null;
  usePercentage?: boolean;
}

export interface FormulaValidationRequest {
  formula: string;
  testScore: number;
  testMaxScore: number;
}

export interface FormulaValidationResponse {
  isValid: boolean;
  result?: number;
  error?: string;
}

// Get scoring configuration
export function useGetScoringConfig(assessmentTypeId: number) {
  return useQuery<ScoringConfig>({
    queryKey: ["scoring-config", assessmentTypeId],
    enabled: !!assessmentTypeId && assessmentTypeId > 0,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<ScoringConfig>>(
          `/api/scoring-config/${assessmentTypeId}`
        );
        return response.data.data;
      } catch (error) {
        console.error("Error fetching scoring config:", error);
        throw error;
      }
    },
  });
}

// Update scoring configuration
export function useUpdateScoringConfig() {
  return useMutation<ScoringConfig, Error, UpdateScoringConfigRequest>({
    mutationFn: async (payload) => {
      const response = await api.put<ApiReturn<ScoringConfig>>(
        `/api/scoring-config/${payload.assessmentTypeId}`,
        payload
      );
      return response.data.data;
    },
  });
}

// Validate formula
export function useValidateFormula() {
  return useMutation<FormulaValidationResponse, Error, FormulaValidationRequest>({
    mutationFn: async (payload) => {
      const response = await api.post<ApiReturn<FormulaValidationResponse>>(
        "/api/scoring-config/validate-formula",
        payload
      );
      return response.data.data;
    },
  });
}
