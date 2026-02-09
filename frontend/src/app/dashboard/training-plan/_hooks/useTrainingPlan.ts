import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import type { ApiResponse } from "@/types/global-types";

// Training Plan Types
export interface TrainingPlanParticipant {
  no: number;
  vesselName: string;
  seamanCode: string;
  name: string;
  position: string; // Added position field for jabatan
  gaps: { [key: string]: string | number }; // Will contain gap values (1, X, or empty)
  total: number;
  readiness: string;
}

export interface TrainingPlanSummary {
  total: { [key: string]: number };
  percentageGap: { [key: string]: number };
  category: { [key: string]: string };
  trainingMateri1: { [key: string]: string };
  trainingMateri2: { [key: string]: string };
  scheduleIds: { [competencyCode: string]: { [materialType: string]: number } };
  isStartedStatus: { [competencyCode: string]: { [materialType: string]: boolean } };
}

export interface TrainingPlanResponse {
  participants: TrainingPlanParticipant[];
  summary: TrainingPlanSummary;
  program: string;
  totalCount: number;
  minDeadlineMonths: number; // Minimum total_readiness_update_months from active participants
}

export interface CompetencyMapping {
  [key: string]: {
    name: string;
    training_topics: string[];
  };
}

export interface ProgramInfo {
  code: string;
  name: string;
}

// Query key factory for training plan queries
export const trainingPlanKeys = {
  all: ["training-plan"] as const,
  list: () => [...trainingPlanKeys.all, "list"] as const,
  byProgram: (program: string) => [...trainingPlanKeys.list(), program] as const,
  competencyMapping: (program: string) =>
    [...trainingPlanKeys.all, "competency-mapping", program] as const,
  programs: () => [...trainingPlanKeys.all, "programs"] as const,
  overdueCount: (program: string) => [...trainingPlanKeys.all, "overdue-count", program] as const,
};

// React Query hook for fetching training plan data
export function useGetTrainingPlan(program: string = "SDP") {
  const response = useQuery<TrainingPlanResponse, Error>({
    queryKey: trainingPlanKeys.byProgram(program),
    queryFn: async () => {
      const response = await api.get<ApiResponse<TrainingPlanResponse>>(`/api/training-plan`, {
        params: { program },
      });

      if (!response.data || !response.data.success) {
        throw new Error("Failed to fetch training plan data");
      }

      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 or authentication errors
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response?.status === 404 || axiosError.response?.status === 401) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return response;
}

// React Query hook for fetching competency mapping
export function useGetCompetencyMapping(program: string = "SDP") {
  const response = useQuery<CompetencyMapping, Error>({
    queryKey: trainingPlanKeys.competencyMapping(program),
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ program: string; mapping: CompetencyMapping }>>(
        `/api/training-plan/competency-mapping`,
        {
          params: { program },
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error("Failed to fetch competency mapping");
      }

      return response.data.data.mapping;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (mapping doesn't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return response;
}

// React Query hook for fetching available programs
export function useGetPrograms() {
  const response = useQuery<ProgramInfo[], Error>({
    queryKey: trainingPlanKeys.programs(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProgramInfo[]>>(`/api/training-plan/programs`);

      if (!response.data || !response.data.success) {
        throw new Error("Failed to fetch programs");
      }

      return response.data.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (programs rarely change)
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return response;
}

// React Query mutation for generating training schedules
export function useGenerateSchedules() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { program: string; startDate?: string }>({
    mutationFn: async ({ program, startDate }) => {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/api/training-plan/generate-schedules`,
        { program, startDate }
      );

      if (!response.data || !response.data.success) {
        throw new Error("Failed to generate training schedules");
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch training plan data after successful generation
      queryClient.invalidateQueries({
        queryKey: trainingPlanKeys.byProgram(variables.program),
      });
    },
  });
}

export function useSwapSchedules() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { swaps: { id: number; scheduledDate: string }[]; program: string }
  >({
    mutationFn: async ({ swaps }) => {
      const response = await api.put<ApiResponse<{ message: string }>>(
        `/api/training-plan/swap-schedules`,
        { swaps }
      );

      if (!response.data || !response.data.success) {
        throw new Error("Failed to swap training schedules");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trainingPlanKeys.byProgram(variables.program),
      });
    },
  });
}

export function useToggleTrainingStarted() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { scheduleId: number; isStarted: boolean; apolloCourseName: string }
  >({
    mutationFn: async ({ scheduleId, isStarted, apolloCourseName }) => {
      const response = await api.put<ApiResponse<{ message: string }>>(
        `/api/training-plan/toggle-started/${scheduleId}`,
        { isStarted, apolloCourseName }
      );

      if (!response.data || !response.data.success) {
        throw new Error("Failed to toggle training started status");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingPlanKeys.list(),
      });
    },
  });
}

// React Query hook for fetching overdue unstarted training count
export function useGetOverdueCount(program: string = "SDP") {
  const response = useQuery<number, Error>({
    queryKey: trainingPlanKeys.overdueCount(program),
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ program: string; count: number }>>(
        `/api/training-plan/overdue-count`,
        {
          params: { program },
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error("Failed to fetch overdue count");
      }

      return response.data.data.count;
    },
    staleTime: 1 * 60 * 1000, // 1 minute (notifications should be fresh)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });

  return response;
}
