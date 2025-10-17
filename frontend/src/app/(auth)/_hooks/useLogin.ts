import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useAuth } from "@/context/AuthContext";

// Types for login
export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  username: string;
};

export type LoginError = {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
};

// Hook for login functionality
export function useLogin() {
  const router = useRouter();
  const { setUser } = useAuth();

  return useMutation<LoginResponse, LoginError, LoginRequest>({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await api.post<ApiReturn<LoginResponse>>(
        "/auth/login",
        {
          username: credentials.username,
          password: credentials.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data) {
        throw new Error("Failed to login");
      }

      return response.data.data;
    },
    onSuccess: (userData) => {
      // Set user data in auth context
      setUser(userData);

      // Show success message
      toast.success("Login berhasil!");

      // Navigate to dashboard
      router.replace("/dashboard");
    },
    onError: (error) => {
      // Handle login error
      const errorMessage =
        error.response?.data?.error || error.message || "Login gagal";
      toast.error(errorMessage);
    },
  });
}

// Hook for logout functionality
export function useLogout() {
  const router = useRouter();
  const { setUser } = useAuth();

  return useMutation<void, LoginError, void>({
    mutationFn: async () => {
      const response = await api.post("/auth/logout");

      if (!response.data) {
        throw new Error("Failed to logout");
      }
    },
    onSuccess: () => {
      // Clear user data
      setUser(null);

      // Show success message
      toast.success("Logout berhasil!");

      // Navigate to login
      router.replace("/login");
    },
    onError: (error) => {
      // Handle logout error
      const errorMessage =
        error.response?.data?.error || error.message || "Logout gagal";
      toast.error(errorMessage);

      // Even if logout fails on server, clear local state
      setUser(null);
      router.replace("/login");
    },
  });
}
