import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { AssessmentPayload, AssessmentResponse } from "@/types/assessment";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useGetAssessmentByRole(role: string) {
  const response = useQuery<AssessmentResponse>({
    queryKey: ["assessment", role],
    enabled: !!role,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssessmentResponse>>(
          `/api/assessments/${role}`
        );

        if (!response.data) {
          throw new Error("Failed to fetch assessment data");
        }

        return response.data.data;
      } catch (error: unknown) {
        // If assessment doesn't exist (404), return a default structure
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status === 404) {
          console.log(
            `No assessment found for role: ${role}, returning default structure`
          );
          return {
            assessmentId: 0,
            role: role,
            usingTimer: false,
            timerLimitMinutes: 60,
            questions: [],
          } as AssessmentResponse;
        }
        console.error("Error fetching assessment:", error);
        throw error;
      }
    },
  });

  return response;
}

export function useGetAssessmentById(assessmentId: number) {
  const response = useQuery<AssessmentResponse>({
    queryKey: ["assessment", "id", assessmentId],
    enabled: !!assessmentId && assessmentId > 0,
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<AssessmentResponse>>(
          `/api/assessments/id/${assessmentId}`
        );

        if (!response.data) {
          throw new Error("Failed to fetch assessment data");
        }

        return response.data.data;
      } catch (error: unknown) {
        console.error("Error fetching assessment:", error);
        throw error;
      }
    },
  });

  return response;
}

export function useUpdateAssessmentById() {
  return useMutation<AssessmentResponse, Error, AssessmentPayload>({
    mutationFn: async (payload) => {
      const response = await api.put<ApiReturn<AssessmentResponse>>(
        `/api/assessments/${payload.id}`,
        {
          role: payload.role,
          usingTimer: payload.usingTimer,
          timerLimitMinutes: payload.timerLimitMinutes,
        }
      );

      if (!response.data) {
        throw new Error("Failed to update assessment data");
      }

      return response.data.data;
    },
  });
}

export function useGetAllAssessments() {
  return useQuery<
    {
      assessmentId: number;
      role: string;
      assessmentName: string;
      usingTimer: boolean;
      timerLimitMinutes: number | null;
    }[]
  >({
    queryKey: ["assessments"],
    queryFn: async () => {
      try {
        const response = await api.get<
          ApiReturn<
            {
              assessmentId: number;
              role: string;
              assessmentName: string;
              usingTimer: boolean;
              timerLimitMinutes: number | null;
            }[]
          >
        >(`/api/assessments`);

        if (!response.data) {
          throw new Error("Failed to fetch assessments data");
        }

        return response.data.data;
      } catch (error: unknown) {
        console.error("Error fetching assessments:", error);
        throw error;
      }
    },
  });
}

export function usePostAssessment() {
  return useMutation<AssessmentResponse, Error, AssessmentPayload>({
    mutationFn: async (payload) => {
      const response = await api.post<ApiReturn<AssessmentResponse>>(
        `/api/assessments`,
        {
          role: payload.role,
          assessmentName: payload.assessmentName,
          usingTimer: payload.usingTimer,
          timerLimitMinutes: payload.timerLimitMinutes,
        }
      );

      if (!response.data) {
        throw new Error("Failed to update assessment data");
      }

      return response.data.data;
    },
  });
}

export function useUploadAssessmentImage() {
  return useMutation<{ imageUrl: string }, Error, File>({
    mutationFn: async (file: File) => {
      // Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Ukuran file tidak boleh lebih dari 10MB");
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Tipe file harus berupa gambar (JPEG, PNG, GIF, WebP)");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload to backend
      const response = await api.post<ApiReturn<{ imageUrl: string }>>(
        `/api/assessments/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data?.data?.imageUrl) {
        throw new Error("Gagal mendapatkan URL gambar dari server");
      }

      return response.data.data;
    },
  });
}
