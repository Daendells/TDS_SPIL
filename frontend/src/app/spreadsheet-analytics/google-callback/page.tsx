"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/app/lib/api";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setStatus("error");
      setErrorMessage(errorParam);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("Kode otorisasi Google tidak ditemukan.");
      return;
    }

    async function exchangeToken() {
      try {
        const redirectUri = window.location.origin + "/spreadsheet-analytics/google-callback";
        const res = await api.post("/api/v1/disc-analytics/auth/google/callback", {
          code,
          redirectUri,
        });

        if (res.data?.data?.accessToken) {
          sessionStorage.setItem("google_access_token", res.data.data.accessToken);
          setStatus("success");
          setTimeout(() => {
            router.push("/spreadsheet-analytics?google_auth=success");
          }, 1200);
        } else {
          throw new Error("Gagal menerima access token dari server.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.error || err.message || "Gagal menghubungkan akun Google."
        );
      }
    }

    exchangeToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center shadow-xs space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-slate-800 animate-spin mx-auto" />
            <h2 className="text-base font-bold text-slate-900">
              Menghubungkan Akun Google SPIL...
            </h2>
            <p className="text-xs text-slate-500">
              Sedang memverifikasi izin akses Google Spreadsheet dengan server.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">
              Akun Google Berhasil Terhubung!
            </h2>
            <p className="text-xs text-slate-500">
              Mengalihkan kembali ke halaman analitik...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">
              Gagal Menghubungkan Google
            </h2>
            <p className="text-xs text-rose-600">{errorMessage}</p>
            <button
              onClick={() => router.push("/spreadsheet-analytics")}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
            >
              Kembali ke Analitik
            </button>
          </>
        )}
      </div>
    </div>
  );
}
