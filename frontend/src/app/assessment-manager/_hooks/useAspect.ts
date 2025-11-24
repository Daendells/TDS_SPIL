"use client";

import { useApi } from "@/hooks/use-api";
import { ApiReturn } from "@/app/types/api";
import { AspectResponse, AspectCreatePayload, AspectUpdatePayload } from "@/types/aspect";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useGetAspectsByAssessmentId(assessmentId: number) {
  const api = useApi();

  return useQuery({
    queryKey: ["aspects", "assessment", assessmentId],
    queryFn: async () => {
      const response = await api.get<ApiReturn<AspectResponse[]>>(
        `/api/aspects/assessment/${assessmentId}`
      );
      return response.data.data;
    },
    enabled: assessmentId > 0,
  });
}

export function useGetAllAspects() {
  const api = useApi();

  return useQuery({
    queryKey: ["aspects"],
    queryFn: async () => {
      const response = await api.get<ApiReturn<AspectResponse[]>>("/api/aspects");
      return response.data.data;
    },
  });
}

export function useCreateAspect() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AspectCreatePayload) => {
      const response = await api.post<ApiReturn<AspectResponse>>("/api/aspects", payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aspects"] });
    },
  });
}

export function useUpdateAspect() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AspectUpdatePayload }) => {
      const response = await api.put<ApiReturn<AspectResponse>>(`/api/aspects/${id}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aspects"] });
    },
  });
}

export function useDeleteAspect() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiReturn<null>>(`/api/aspects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aspects"] });
    },
  });
}

export function useAssignAspectToQuestion() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      aspectId,
    }: {
      questionId: number;
      aspectId: number | null;
    }) => {
      const response = await api.put<ApiReturn<null>>(`/api/questions/${questionId}/aspect`, {
        aspectId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["aspects"] });
    },
  });
}
