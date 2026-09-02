import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";

export interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: "admin" | "viewer";
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: "admin" | "viewer";
}

// Hook untuk get semua users
export const useGetUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<User[]>>("/api/users");
        return response.data.data || [];
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook untuk get user by ID
export const useGetUserById = (id: number) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      try {
        const response = await api.get<ApiReturn<User>>(`/api/users/${id}`);
        return response.data.data;
      } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
      }
    },
    enabled: !!id,
  });
};

// Hook untuk create user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      try {
        const response = await api.post<ApiReturn<User>>("/api/users", data);
        return response.data.data;
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Hook untuk update user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserRequest }) => {
      try {
        const response = await api.put<ApiReturn<User>>(`/api/users/${id}`, data);
        return response.data.data;
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Hook untuk delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        await api.delete(`/api/users/${id}`);
      } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
