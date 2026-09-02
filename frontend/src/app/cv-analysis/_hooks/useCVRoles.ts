import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";

export interface CVRoleItem {
  id: number;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCVRoleRequest {
  name: string;
  description?: string;
  category?: string;
}

export interface UpdateCVRoleRequest {
  name?: string;
  description?: string;
  category?: string;
}

// Hook untuk mengambil seluruh CV Roles dari database
export function useGetCVRoles() {
  return useQuery({
    queryKey: ["cv-roles"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<CVRoleItem[]>>("/api/cv-roles");
        return response.data.data || [];
      } catch (error) {
        console.error("Error fetching CV roles:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook untuk membuat CV Role baru
export function useCreateCVRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCVRoleRequest) => {
      const response = await api.post<ApiReturn<CVRoleItem>>("/api/cv-roles", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cv-roles"] });
    },
  });
}

// Hook untuk mengupdate CV Role
export function useUpdateCVRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCVRoleRequest }) => {
      const response = await api.put<ApiReturn<CVRoleItem>>(`/api/cv-roles/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cv-roles"] });
    },
  });
}

// Hook untuk menghapus CV Role
export function useDeleteCVRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/cv-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cv-roles"] });
    },
  });
}
