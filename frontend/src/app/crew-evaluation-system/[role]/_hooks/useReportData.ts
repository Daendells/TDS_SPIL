import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import type { ReportData, ApiResponse } from "@/types/report-types";

// Query key factory for report queries
export const reportKeys = {
  all: ["reports"] as const,
  byIdentityNumber: (identityNumber: string) =>
    [...reportKeys.all, "identity", identityNumber] as const,
};

// React Query hook for fetching report by identity number (NIK/KTP/Paspor)
export function useGetReportByIdentityNumber(identityNumber: string) {
  const response = useQuery<ReportData, Error>({
    queryKey: reportKeys.byIdentityNumber(identityNumber),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ReportData>>(
        `/reports/identity-number/${identityNumber}`
      );

      if (!response.data) {
        throw new Error("Failed to fetch report data");
      }

      return response.data.data;
    },
    enabled: Boolean(identityNumber),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return response;
}
