"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "universal-cookie";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const loginSso = searchParams.get("login_sso");

    // Jika ada parameter login_sso dari Fleet Portal / SSO
    if (loginSso === "true") {
      const apiBase = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8081";
      // TDS is a single OAuth client and must use the client ID configured on
      // its backend. The portal query can be stale when duplicate application
      // records exist, so it must not override TDS credentials.
      const target = `${apiBase}/api/auth/sso/initiate`;
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
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mx-auto" />
        <p className="text-sm font-medium text-slate-600">
          Menghubungkan ke Talent Development System...
        </p>
      </div>
    </div>
  );
}
