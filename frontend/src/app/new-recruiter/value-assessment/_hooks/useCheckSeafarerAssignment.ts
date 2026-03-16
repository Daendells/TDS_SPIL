import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useQuery } from "@tanstack/react-query";

export interface NewRecruiterPersonalData {
  id: number;
  nama: string;
  seafarerCode: string;
  rank: string;
  academyName: string;
  phone?: string | null;
  email?: string | null;
}

export interface AssignmentCheckResponse {
  isAssigned: boolean;
  message: string;
  token: string;
  assessmentTypeId: number;
  personalData?: NewRecruiterPersonalData;
  attemptsCount: number;
  maxAttempts: number | null;
}

const getFriendlyAssignmentError = (error: unknown) => {
  const apiError = error as {
    response?: { status?: number; data?: { error?: string } };
    message?: string;
  };

  const serverMessage = apiError?.response?.data?.error?.trim();
  if (serverMessage) {
    return serverMessage;
  }

  if (apiError?.response?.status === 401) {
    return "Token tidak valid atau Anda tidak memiliki akses ke assessment ini.";
  }

  if (apiError?.response?.status === 404) {
    return "Data assessment tidak ditemukan. Silakan hubungi administrator.";
  }

  return "Terjadi kendala saat verifikasi token. Silakan coba lagi.";
};

export function useCheckSeafarerAssignment(token: string, assessmentTypeId: number) {
  return useQuery<AssignmentCheckResponse>({
    queryKey: ["new-recruiter-assignment", token, assessmentTypeId],
    enabled: !!token && !!assessmentTypeId,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssignmentCheckResponse>>(
          `/api/new-recruiters/check-assignment/${token}/${assessmentTypeId}`
        );

        if (!response.data || !response.data.data) {
          throw new Error("Data verifikasi token tidak ditemukan.");
        }

        return response.data.data;
      } catch (error) {
        throw new Error(getFriendlyAssignmentError(error));
      }
    },
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  });
}
