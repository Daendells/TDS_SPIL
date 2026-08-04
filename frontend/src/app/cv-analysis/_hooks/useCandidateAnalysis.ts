import { useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TargetRoleItem {
  role: string;
  description?: string;
}

export interface RoleFitItem {
  role: string;
  fit_score: number;
  strengths: string[];
  weaknesses: string[];
  skill_gap: string[];
  reason: string;
}

export interface CandidateAnalysisResult {
  candidate_name: string;
  profile_summary: string;
  best_fit_role: string;
  best_fit_score: number;
  role_fits: RoleFitItem[];
}

export interface InterviewQuestionItem {
  number: number;
  category: string;
  question: string;
  reason: string;
}

export interface InterviewQuestionsResult {
  candidate_name: string;
  role: string;
  questions: InterviewQuestionItem[];
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

export function useCandidateAnalysis() {
  const [analysisResult, setAnalysisResult] =
    useState<CandidateAnalysisResult | null>(null);
  const [interviewResult, setInterviewResult] =
    useState<InterviewQuestionsResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * analyze — Analisis 1 CV terhadap role IT yang dipilih/ditambahkan.
   * @param candidateName Nama kandidat (opsional)
   * @param cvText Teks CV yang sudah diekstrak dari PDF
   * @param targetRoles Array role dan deskripsinya
   */
  const analyze = useCallback(
    async (candidateName: string, cvText: string, targetRoles?: TargetRoleItem[]) => {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);
      setInterviewResult(null);
      try {
        const res = await fetch(`${API_BASE}/api/candidate-analysis`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            candidate_name: candidateName,
            cv_text: cvText,
            target_roles: targetRoles,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal menganalisis CV");
        setAnalysisResult(json.data as CandidateAnalysisResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * generateInterviewQuestions — Generate 10 pertanyaan interview on-demand.
   * @param candidateName Nama kandidat
   * @param cvText Teks CV
   * @param role Role yang dipilih user
   */
  const generateInterviewQuestions = useCallback(
    async (candidateName: string, cvText: string, role: string) => {
      setIsGeneratingQuestions(true);
      setError(null);
      setInterviewResult(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/candidate-analysis/interview-questions`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              candidate_name: candidateName,
              cv_text: cvText,
              role,
            }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal generate pertanyaan");
        setInterviewResult(json.data as InterviewQuestionsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsGeneratingQuestions(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setAnalysisResult(null);
    setInterviewResult(null);
    setError(null);
  }, []);

  return {
    analysisResult,
    interviewResult,
    isAnalyzing,
    isGeneratingQuestions,
    error,
    analyze,
    generateInterviewQuestions,
    reset,
  };
}
