import { useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CandidateItem {
  id: string;
  name: string;
  cv_text: string;
}

export interface CandidateRankingItem {
  rank: number;
  candidate_id: string;
  candidate_name: string;
  fit_score: number;
  profile_summary: string;
  strengths: string[];
  weaknesses: string[];
  skill_gap: string[];
  reason: string;
}

export interface RoleAnalysisResult {
  role: string;
  total_candidates: number;
  recommended_candidate: string;
  recommendation_reason: string;
  rankings: CandidateRankingItem[];
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useRoleAnalysis() {
  const [result, setResult] = useState<RoleAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * analyze — Ranking banyak kandidat terhadap satu role yang dipilih.
   * @param role Nama role (e.g., "Frontend Developer")
   * @param candidates Array kandidat beserta CV text mereka
   * @param jobDescription Deskripsi pekerjaan (opsional)
   */
  const analyze = useCallback(
    async (role: string, candidates: CandidateItem[], jobDescription?: string) => {
      setIsAnalyzing(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`${API_BASE}/api/role-analysis`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ role, candidates, job_description: jobDescription }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal menganalisis role");
        setResult(json.data as RoleAnalysisResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isAnalyzing, error, analyze, reset };
}
