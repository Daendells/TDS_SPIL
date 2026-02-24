import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type {
  IReport,
  IPaginationData,
  IPaginationRequest,
  ApiResponse,
} from "@/types/global-types";

interface IdpCountData {
  mdp: number;
  fdp: number;
  sdp: number;
}

// Query key factory for reports queries
export const reportKeys = {
  all: ["reports"] as const,
  list: () => [...reportKeys.all, "list"] as const,
  paginated: (request: IPaginationRequest) => [...reportKeys.list(), request] as const,
  idpCount: () => [...reportKeys.all, "idp-count"] as const,
};

// React Query hook for fetching IDP (Integrated Development Programs) count
export function useGetIdpCount(batchId?: number | null) {
  const response = useQuery<IdpCountData, Error>({
    queryKey: batchId ? [...reportKeys.idpCount(), batchId] : reportKeys.idpCount(),
    queryFn: async () => {
      // Add required Page and PageSize parameters matching DashboardRequest structure
      const params = new URLSearchParams({
        page: "next",
        page_size: "1000",
        anchor_id: "0",
      });

      if (batchId) {
        params.append("batch_id", batchId.toString());
      }

      // We need to get the batchId from somewhere or pass it as an argument.
      // Since useGetIdpCount is usually called in the same component as useGetReports,
      // let's modify it to accept components state if needed, but for now
      // let's check how it's used in DashboardClient.

      const response = await api.get<ApiResponse<IdpCountData>>(
        `/reports/idp-count?${params.toString()}`
      );

      if (!response.data) {
        throw new Error("Failed to fetch IDP count data");
      }

      return response.data.data;
    },
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

// React Query hook for fetching paginated reports
export function useGetReports(paginationRequest: IPaginationRequest) {
  const response = useQuery<IPaginationData<IReport>, Error>({
    queryKey: reportKeys.paginated(paginationRequest),
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<IPaginationData<IReport>>>(`/reports`, {
          params: {
            anchor_id: (paginationRequest.anchorId ?? 0).toString(),
            page: paginationRequest.page,
            page_size: paginationRequest.pageSize,
            filter: paginationRequest.filter,
            batch_id: paginationRequest.batchId,
          },
        });

        if (!response.data) {
          console.error("Response data is empty");
          throw new Error("Failed to fetch reports data");
        }

        console.log("Returning pagination data:", response.data.data);
        return response.data.data;
      } catch (error) {
        console.error("Error fetching reports:", error);
        throw error;
      }
    },
    enabled: true, // Always enabled since paginationRequest is always provided
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  return response;
}
