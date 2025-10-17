import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { QuestionOptionResponse } from "@/types/assessment";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Types for question operations
export type QuestionCreatePayload = {
  role: string;
  questionText: string;
  category?: string;
  isImage?: number;
  imageUrl?: string;
  options: {
    optionLetter: string;
    optionText: string;
    score: number;
    isImage?: number;
  }[];
};

export type QuestionUpdatePayload = {
  questionText: string;
  category?: string;
  isImage?: number;
  imageUrl?: string;
  options: {
    optionId?: number;
    optionLetter: string;
    optionText: string;
    score: number;
    isImage?: number;
  }[];
};

// Hook for deleting a question with options
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: number) => {
      const response = await api.delete<ApiReturn<void>>(
        `/api/questions-with-options/${questionId}`
      );

      if (!response.data) {
        throw new Error("Failed to delete question");
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate assessment queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["assessment"] });
    },
  });
}

// Hook for updating a question with options
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation<
    QuestionOptionResponse,
    Error,
    { questionId: number; data: QuestionUpdatePayload }
  >({
    mutationFn: async ({ questionId, data }) => {
      const response = await api.put<ApiReturn<QuestionOptionResponse>>(
        `/api/questions-with-options/${questionId}`,
        data
      );

      if (!response.data) {
        throw new Error("Failed to update question");
      }

      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate assessment queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["assessment"] });
    },
  });
}

export function useBulkDeleteQuestions() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number[]>({
    mutationFn: async (questionIds: number[]) => {
      const response = await api.delete<ApiReturn<void>>(
        `/api/questions-with-options/bulk-delete`,
        { data: { questionIds } }
      );

      if (!response.data) {
        throw new Error("Failed to bulk delete questions");
      }
    },
    onSuccess: () => {
      // Invalidate assessment queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["assessment"] });
    },
  });
}

// Hook for creating a new question with options
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation<QuestionOptionResponse, Error, QuestionCreatePayload>({
    mutationFn: async (data) => {
      const response = await api.post<ApiReturn<QuestionOptionResponse>>(
        `/api/questions-with-options`,
        data
      );

      if (!response.data) {
        throw new Error("Failed to create question");
      }

      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate assessment queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["assessment"] });
    },
  });
}
