"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import api from "@/app/lib/api";

interface AnalysisAspects {
  technical_skill: number;
  experience: number;
  education: number;
  communication: number;
  leadership: number;
  problem_solving: number;
  cultural_fit: number;
}

export interface InterviewQuestion {
  category?: string;
  question: string;
  reason: string;
}

export interface CVAnalysisResult {
  score: number;
  recommended_min_score: number;
  recommendedMinScore: number;
  min_score_explanation: string;
  minScoreExplanation: string;
  score_explanation: string;
  scoreExplanation: string;
  strengths: string[];
  weaknesses: string[];
  profile_summary: string;
  profileSummary: string;
  interview_questions: InterviewQuestion[];
  interviewQuestions: InterviewQuestion[];
  aspects: AnalysisAspects;
}

export interface CandidateItem {
  id: string;
  name: string;
  cv_text: string;
}

export interface JobFitScoreBreakdown {
  technical_skills: number;
  experience: number;
  education: number;
  projects: number;
  certifications: number;
}

export interface CandidateRankItem {
  candidate_id: string;
  candidate_name: string;
  job_fit_score: number;
  strengths: string[];
  missing_skills: string[];
  short_summary: string;
  score_breakdown: JobFitScoreBreakdown;
}

export interface CandidateRankingResult {
  job_title: string;
  total_candidates: number;
  rankings: CandidateRankItem[];
}

export interface RoleRecommendationItem {
  role: string;
  job_fit_score: number;
  brief_reason: string;
  matching_skills: string[];
  missing_skills: string[];
  score_breakdown: JobFitScoreBreakdown;
}

export interface RoleRecommendationResult {
  candidate_name: string;
  recommended_roles: RoleRecommendationItem[];
}

export interface TargetRoleItem {
  role: string;
  description: string;
}

export interface PersonBestRoleItem {
  candidate_id: string;
  candidate_name: string;
  best_role: string;
  job_fit_score: number;
  brief_reason: string;
  matching_skills: string[];
  missing_skills: string[];
}

export interface CandidateEvaluationItem {
  candidate_id: string;
  candidate_name: string;
  job_fit_score: number;
  score_explanation: string;
  min_score: number;
  min_score_explanation: string;
  strengths: string[];
  weaknesses: string[];
  profile_summary: string;
  interview_questions: InterviewQuestion[];
  aspects: AnalysisAspects;
  score_breakdown: JobFitScoreBreakdown;
}

export interface RoleCandidateRanking {
  role: string;
  description: string;
  candidates: CandidateEvaluationItem[];
}

export interface UnifiedCVAnalysisResult {
  person_best_roles: PersonBestRoleItem[];
  role_rankings: RoleCandidateRanking[];
}

export function useCVAnalysis() {
  const [analysisResult, setAnalysisResult] =
    useState<CVAnalysisResult | null>(null);
  const [rankingResult, setRankingResult] =
    useState<CandidateRankingResult | null>(null);
  const [roleRecommendationResult, setRoleRecommendationResult] =
    useState<RoleRecommendationResult | null>(null);
  const [unifiedResult, setUnifiedResult] =
    useState<UnifiedCVAnalysisResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCV = useCallback(async (cvText: string, role: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await api.post("/api/cv-analysis/analyze", {
        cv_text: cvText,
        role: role,
      });

      const data = response.data;
      if (data.error) {
        throw new Error(data.error);
      }

      const rawData = data.data || {};
      const normalizedResult: CVAnalysisResult = {
        score: rawData.score ?? 0,
        recommended_min_score: rawData.recommended_min_score ?? rawData.recommendedMinScore ?? 70,
        recommendedMinScore: rawData.recommended_min_score ?? rawData.recommendedMinScore ?? 70,
        min_score_explanation: rawData.min_score_explanation || rawData.minScoreExplanation || "Rekomendasi skor minimum berdasarkan standar kualifikasi role.",
        minScoreExplanation: rawData.min_score_explanation || rawData.minScoreExplanation || "Rekomendasi skor minimum berdasarkan standar kualifikasi role.",
        score_explanation: rawData.score_explanation || rawData.scoreExplanation || "",
        scoreExplanation: rawData.score_explanation || rawData.scoreExplanation || "",
        strengths: Array.isArray(rawData.strengths) ? rawData.strengths : [],
        weaknesses: Array.isArray(rawData.weaknesses) ? rawData.weaknesses : [],
        profile_summary: rawData.profile_summary || rawData.profileSummary || "",
        profileSummary: rawData.profile_summary || rawData.profileSummary || "",
        interview_questions: Array.isArray(rawData.interview_questions)
          ? rawData.interview_questions
          : Array.isArray(rawData.interviewQuestions)
          ? rawData.interviewQuestions
          : [],
        interviewQuestions: Array.isArray(rawData.interview_questions)
          ? rawData.interview_questions
          : Array.isArray(rawData.interviewQuestions)
          ? rawData.interviewQuestions
          : [],
        aspects: rawData.aspects || {
          technical_skill: 0,
          experience: 0,
          education: 0,
          communication: 0,
          leadership: 0,
          problem_solving: 0,
          cultural_fit: 0,
        },
      };

      setAnalysisResult(normalizedResult);
      toast.success("Analisis CV berhasil diselesaikan");
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || "Gagal melakukan analisis CV";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rankCandidates = useCallback(
    async (jobDescription: string, role: string, candidates: CandidateItem[]) => {
      setIsLoading(true);
      setError(null);
      setRankingResult(null);

      try {
        const response = await api.post("/api/cv-analysis/rank-candidates", {
          job_description: jobDescription,
          role: role,
          candidates: candidates,
        });

        const data = response.data;
        if (data.error) {
          throw new Error(data.error);
        }

        setRankingResult(data.data);
        toast.success("Peringkat kandidat berhasil dihitung");
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.message || "Gagal melakukan ranking kandidat";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const recommendRoles = useCallback(
    async (candidateName: string, cvText: string, roles?: string[]) => {
      setIsLoading(true);
      setError(null);
      setRoleRecommendationResult(null);

      try {
        const response = await api.post("/api/cv-analysis/recommend-roles", {
          candidate_name: candidateName,
          cv_text: cvText,
          roles: roles || [],
        });

        const data = response.data;
        if (data.error) {
          throw new Error(data.error);
        }

        setRoleRecommendationResult(data.data);
        toast.success("Rekomendasi role terbaik berhasil dianalisis");
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.message || "Gagal melakukan rekomendasi role";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const analyzeUnifiedCVs = useCallback(
    async (candidates: CandidateItem[], targetRoles: TargetRoleItem[]) => {
      setIsLoading(true);
      setError(null);
      setUnifiedResult(null);

      try {
        const response = await api.post("/api/cv-analysis/unified-analysis", {
          candidates,
          target_roles: targetRoles,
        });

        const data = response.data;
        if (data.error) {
          throw new Error(data.error);
        }

        setUnifiedResult(data.data);
        toast.success("Analisis CV & Job Fit Unified berhasil diselesaikan");
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.message || "Gagal melakukan Analisis CV Unified";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setRankingResult(null);
    setRoleRecommendationResult(null);
    setUnifiedResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    analysisResult,
    rankingResult,
    roleRecommendationResult,
    unifiedResult,
    isLoading,
    error,
    analyzeCV,
    rankCandidates,
    recommendRoles,
    analyzeUnifiedCVs,
    resetAnalysis,
  };
}