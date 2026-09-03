import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/app/lib/api";
import { ApiReturn } from "@/app/types/api";
import { useAuth } from "@/context/AuthContext";
import { withBasePath } from "@/lib/base-path";
import Cookies from "universal-cookie";

const cookies = new Cookies();

// Types for login
export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  username: string;
  role?: string;
  token: string;
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
      // Decode JWT token payload as secondary verification
      let resolvedRole = userData.role;
      if (!resolvedRole && userData.token) {
        try {
          const parts = userData.token.split(".");
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            if (payload.role) resolvedRole = payload.role;
          }
        } catch (e) {
          console.warn("Failed to decode token payload:", e);
        }
      }
      if (!resolvedRole) resolvedRole = "viewer";

      // Store token in cookie (manually from frontend)
      cookies.set("Authorization", userData.token, {
        path: "/",
        maxAge: 3600 * 6, // 6 hours
        sameSite: "lax",
      });

      const userObject = {
        id: userData.id,
        username: userData.username,
        role: resolvedRole,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("USER", JSON.stringify(userObject));
      }

      // Set user data in auth context
      setUser(userObject);

      // Show success message
      toast.success("Login berhasil!");

      // Navigate to dashboard with window.location to ensure full page reload
      window.location.href = withBasePath("/dashboard");
    },
    onError: (error) => {
      // Handle login error
      const errorMessage = error.response?.data?.error || error.message || "Login gagal";
      toast.error(errorMessage);
    },
  });
}

// Hook for logout functionality
export function useLogout() {
  const { setUser } = useAuth();

  return useMutation<void, LoginError, void>({
    mutationFn: async () => {
      const response = await api.post("/auth/logout");

      if (!response.data) {
        throw new Error("Failed to logout");
      }
    },
    onSuccess: () => {
      // Remove token cookie
      cookies.remove("Authorization", { path: "/" });

      // Clear user data
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("USER");
      }

      // Show success message
      toast.success("Logout berhasil!");

      // Navigate to login with window.location to ensure full page reload
      window.location.href = withBasePath("/login");
    },
    onError: (error) => {
      // Handle logout error
      const errorMessage = error.response?.data?.error || error.message || "Logout gagal";
      toast.error(errorMessage);

      // Even if logout fails on server, clear local state
      cookies.remove("Authorization", { path: "/" });
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("USER");
      }
      window.location.href = withBasePath("/login");
    },
  });
}
