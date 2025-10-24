import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { IReport } from "@/types/global-types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

// Query key factory for report queries
export const reportKeys = {
  all: ["reports"] as const,
  bySeafarerCode: (seafarerCode: string) =>
    [...reportKeys.all, "seafarer", seafarerCode] as const,
};

// React Query hook for fetching report by seafarer code
export function useGetReportBySeafarerCode(seafarerCode: string) {
  const response = useQuery<IReport, Error>({
    queryKey: reportKeys.bySeafarerCode(seafarerCode),
    queryFn: async () => {
      console.log("Fetching report for seafarerCode:", seafarerCode);

      try {
        const response = await api.get<ApiResponse<IReport>>(
          `/reports/seafarer-code/${seafarerCode}`
        );

        console.log("Report API response:", response);
        console.log("Report data:", response.data?.data);

        if (!response.data?.data) {
          throw new Error("Failed to fetch report data");
        }

        return response.data.data;
      } catch (error) {
        console.error("Error fetching report:", error);
        throw error;
      }
    },
    enabled: Boolean(seafarerCode), // Only run query if seafarerCode exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 or authentication errors
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { status: number } };
        if (
          axiosError.response?.status === 404 ||
          axiosError.response?.status === 401
        ) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return response;
}
