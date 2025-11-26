import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { ReportData, ApiResponse } from "@/types/report-types";

// Query key factory for report queries
export const reportKeys = {
  all: ["reports"] as const,
  bySeafarerCode: (seafarerCode: string) => [...reportKeys.all, "seafarer", seafarerCode] as const,
};

// React Query hook for fetching report by seafarer code
export function useGetReportBySeafarerCode(seafarerCode: string) {
  const response = useQuery<ReportData, Error>({
    queryKey: reportKeys.bySeafarerCode(seafarerCode),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ReportData>>(
        `/reports/seafarer-code/${seafarerCode}`
      );

      if (!response.data) {
        throw new Error("Failed to fetch report data");
      }

      return response.data.data;
    },
    enabled: Boolean(seafarerCode), // Only run query if seafarerCode exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return response;
}
