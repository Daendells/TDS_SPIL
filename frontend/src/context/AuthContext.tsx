"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export type User = {
  id: number;
  username: string;
  role?: "admin" | "viewer" | string;
} | null;

type AuthContextType = {
  user: User;
  setUser: (user: User) => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeTokenPayload(token: string): { sub?: number | string; username?: string; role?: string; expired?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  // Initialize and verify user from JWT cookie & localStorage on mount
  useEffect(() => {
    try {
      const token = cookies.get("Authorization");
      if (token) {
        const payload = decodeTokenPayload(token);
        if (payload && payload.username) {
          const resolvedUser: User = {
            id: Number(payload.sub) || 0,
            username: payload.username,
            role: payload.role || "viewer",
          };
          setUser(resolvedUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("USER", JSON.stringify(resolvedUser));
          }
          return;
        }
      }

      const stored = typeof window !== "undefined" ? localStorage.getItem("USER") : null;
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to initialize auth state:", e);
    }
  }, []);

  // Save to localStorage whenever user state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("USER", JSON.stringify(user));
      } else {
        localStorage.removeItem("USER");
      }
    }
  }, [user]);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  return <AuthContext.Provider value={{ user, setUser, isAdmin }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

