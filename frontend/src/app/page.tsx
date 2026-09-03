"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "universal-cookie";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loginSso = searchParams.get("login_sso");
    const clientId = searchParams.get("client_id");

    // Jika ada parameter login_sso dari Fleet Portal / SSO
    if (loginSso === "true") {
      const apiBase = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8081";
      const params = new URLSearchParams();
      if (clientId) {
        params.set("client_id", clientId);
      }
      const target = `${apiBase}/api/auth/sso/initiate${params.toString() ? `?${params.toString()}` : ""}`;
      window.location.href = target;
      return;
    }

    // Jika tidak ada SSO trigger, cek status login
    const cookies = new Cookies();
    const token = cookies.get("Authorization");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mx-auto" />
        <p className="text-sm font-medium text-slate-600">Menghubungkan ke Talent Development System...</p>
      </div>
    </div>
  );
}
