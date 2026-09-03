"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/app/lib/api";
import { toast } from "sonner";

export interface DISCCandidate {
  id: string;
  candidateCode: string;
  name: string;
  nik: string;
  email: string;
  date: string;
  dominantType: "D" | "I" | "S" | "C";
  traitM: string;
  traitL: string;
  traitPk: string;
  consistency: string;
  graph1: { d: number; i: number; s: number; c: number };
  graph2: { d: number; i: number; s: number; c: number };
  graph3: { d: number; i: number; s: number; c: number };
  descWords: string;
  character: string;
  motivation: string;
  jobEmphasis: string;
  workMask: string;
  underPressure: string;
}

export interface DISCSummary {
  totalCandidates: number;
  dominantCounts: { D: number; I: number; S: number; C: number };
  consistencyCounts: Record<string, number>;
  consistentPercentage: number;
  topTraits: Array<{ trait: string; count: number }>;
  avgGraph1: { d: number; i: number; s: number; c: number };
  avgGraph2: { d: number; i: number; s: number; c: number };
  avgGraph3: { d: number; i: number; s: number; c: number };
  avgStressShift: number;
  executiveInsights: string[];
}

export function mapBackendToCandidate(d: any): DISCCandidate {
  return {
    id: String(d.id),
    candidateCode: d.candidate_code || `DISC-${d.id}`,
    name: d.name || "",
    nik: d.nik || "-",
    email: d.email || "-",
    date: d.test_date || "-",
    dominantType: (d.dominant_type as "D" | "I" | "S" | "C") || "D",
    traitM: d.trait_m || "-",
    traitL: d.trait_l || "-",
    traitPk: d.trait_pk || "-",
    consistency: d.consistency || "Still Consistent",
    graph1: {
      d: Number(d.g1_d ?? 0),
      i: Number(d.g1_i ?? 0),
      s: Number(d.g1_s ?? 0),
      c: Number(d.g1_c ?? 0),
    },
    graph2: {
      d: Number(d.g2_d ?? 0),
      i: Number(d.g2_i ?? 0),
      s: Number(d.g2_s ?? 0),
      c: Number(d.g2_c ?? 0),
    },
    graph3: {
      d: Number(d.g3_d ?? 0),
      i: Number(d.g3_i ?? 0),
      s: Number(d.g3_s ?? 0),
      c: Number(d.g3_c ?? 0),
    },
    descWords: d.desc_words || "-",
    character: d.character_summary || "-",
    motivation: d.self_motivation || "-",
    jobEmphasis: d.job_emphasis || "-",
    workMask: d.work_mask || "-",
    underPressure: d.under_pressure || "-",
  };
}

export function getCandidateDimensions(candidate: DISCCandidate | null, summary?: DISCSummary) {
  if (!candidate) return null;

  const vectorG1 = [candidate.graph1.d, candidate.graph1.i, candidate.graph1.s, candidate.graph1.c];
  const vectorG2 = [candidate.graph2.d, candidate.graph2.i, candidate.graph2.s, candidate.graph2.c];
  const vectorG3 = [candidate.graph3.d, candidate.graph3.i, candidate.graph3.s, candidate.graph3.c];

  const shiftScore = Math.sqrt(
    Math.pow(candidate.graph1.d - candidate.graph2.d, 2) +
      Math.pow(candidate.graph1.i - candidate.graph2.i, 2) +
      Math.pow(candidate.graph1.s - candidate.graph2.s, 2) +
      Math.pow(candidate.graph1.c - candidate.graph2.c, 2)
  );

  const batchAvgG3 = summary
    ? [summary.avgGraph3.d, summary.avgGraph3.i, summary.avgGraph3.s, summary.avgGraph3.c]
    : [0.85, 0.82, -0.34, 1.06];

  return {
    candidate,
    vectorG1,
    vectorG2,
    vectorG3,
    batchAvgG3,
    shiftScore: Number(shiftScore.toFixed(2)),
  };
}

export function useDISCAnalytics() {
  const [candidates, setCandidates] = useState<DISCCandidate[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [summary, setSummary] = useState<DISCSummary>({
    totalCandidates: 0,
    dominantCounts: { D: 0, I: 0, S: 0, C: 0 },
    consistencyCounts: {},
    consistentPercentage: 0,
    topTraits: [],
    avgGraph1: { d: 0, i: 0, s: 0, c: 0 },
    avgGraph2: { d: 0, i: 0, s: 0, c: 0 },
    avgGraph3: { d: 0, i: 0, s: 0, c: 0 },
    avgStressShift: 0,
    executiveInsights: [],
  });

  const [selectedCandidate, setSelectedCandidate] = useState<DISCCandidate | null>(null);
  const [comparisonCandidate, setComparisonCandidate] = useState<DISCCandidate | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string>("Database MySQL SPIL (582 Kandidat)");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/disc-analytics/summary");
      if (res.data && res.data.data) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.error("fetchSummary error:", err);
      setError(err?.response?.data?.error || err.message);
    }
  }, []);

  // Fetch Candidates List
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/disc-analytics/candidates", {
        params: {
          page: 1,
          pageSize: 1000,
        },
      });

      if (res.data && res.data.data && Array.isArray(res.data.data.items)) {
        const mapped = res.data.data.items.map(mapBackendToCandidate);
        setCandidates(mapped);
        setTotalCount(res.data.data.total);

        if (mapped.length > 0) {
          setSelectedCandidate((prev) => prev ?? mapped[0]);
          setComparisonCandidate((prev) => prev ?? mapped[1] ?? mapped[0]);
        }
      }
    } catch (err: any) {
      console.error("fetchCandidates error:", err);
      setError(err?.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchSummary();
    fetchCandidates();
  }, [fetchSummary, fetchCandidates]);

  // Upload CSV to Backend (Incremental by default, or Replace)
  const uploadCSVFile = useCallback(
    async (file: File, mode: "incremental" | "replace" = "incremental") => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post(`/api/v1/disc-analytics/upload?mode=${mode}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const data = res.data?.data;
        setSourceTitle(`Upload: ${file.name}`);

        if (mode === "incremental") {
          toast.success(
            `Sinkronisasi selesai: ${data?.inserted ?? 0} data baru ditambahkan, ${data?.updated ?? 0} diperbarui.`
          );
        } else {
          toast.success(`Berhasil mengganti database dengan ${data?.totalImported ?? 0} data baru!`);
        }

        // Refresh data
        await fetchSummary();
        await fetchCandidates();
      } catch (err: any) {
        const msg = err?.response?.data?.error || err.message || "Gagal mengunggah file CSV.";
        toast.error(msg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [fetchSummary, fetchCandidates]
  );

  // Connect Google Account for Private Google Sheets OAuth
  const connectGoogleAccount = useCallback(async () => {
    try {
      const redirectUri = window.location.origin + "/spreadsheet-analytics/google-callback";
      const res = await api.get("/api/v1/disc-analytics/auth/google/url", {
        params: { redirectUri },
      });

      if (res.data?.data?.authUrl) {
        window.location.href = res.data.data.authUrl;
      }
    } catch (err: any) {
      toast.error("Gagal mendapatkan link login Google: " + (err?.response?.data?.error || err.message));
    }
  }, []);

  // Sync from Google Spreadsheet Live URL
  const syncGoogleSheet = useCallback(
    async (sheetUrl: string) => {
      setIsUploading(true);
      try {
        const accessToken = typeof window !== "undefined" ? sessionStorage.getItem("google_access_token") || "" : "";

        const res = await api.post("/api/v1/disc-analytics/sync-sheet", {
          url: sheetUrl,
          accessToken,
        });

        const data = res.data?.data;
        setSourceTitle("Live Sync: Google Spreadsheet");
        toast.success(
          `Sync Google Sheets berhasil: +${data?.inserted ?? 0} baru, ${data?.updated ?? 0} diperbarui, ${data?.skipped ?? 0} tidak berubah.`
        );

        await fetchSummary();
        await fetchCandidates();
      } catch (err: any) {
        const msg = err?.response?.data?.error || err.message || "Gagal sinkronisasi Google Spreadsheet.";
        toast.error(msg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [fetchSummary, fetchCandidates]
  );

  // Reset Dataset to default 582 in Backend
  const resetToRealDataset = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post("/api/v1/disc-analytics/reset");
      setSourceTitle("Database MySQL SPIL (582 Kandidat)");
      toast.success("Dataset berhasil direset ke 582 data kandidat asli.");

      await fetchSummary();
      await fetchCandidates();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || "Gagal mereset dataset.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSummary, fetchCandidates]);

  return {
    candidates,
    totalCount,
    sourceTitle,
    summary,
    selectedCandidate,
    setSelectedCandidate,
    comparisonCandidate,
    setComparisonCandidate,
    isLoading,
    isUploading,
    error,
    uploadCSVFile,
    syncGoogleSheet,
    connectGoogleAccount,
    resetToRealDataset,
    getCandidateDimensions: (c: DISCCandidate | null) => getCandidateDimensions(c, summary),
    refetch: () => {
      fetchSummary();
      fetchCandidates();
    },
  };
}
