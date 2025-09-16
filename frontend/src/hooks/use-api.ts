"use client";

import axios, { AxiosInstance } from "axios";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export function useApi(): AxiosInstance {
  const router = useRouter();

  // useMemo, so we dont recreate axios instance on every render
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
      withCredentials: true,
    });

    // Response Interceptor
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          router.replace("/login");
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [router]);

  return api;
}
