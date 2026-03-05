"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import api from "@/app/lib/api";
import { toast } from "sonner";

type ApiError = { response?: { data?: { error?: string } } };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Batch {
  id: number;
  batchNo: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed";
  snapshotAt?: string;
  reportCount: number;
}

export interface BatchSnapshot {
  id: number;
  batchId: number;
  reportId: number;
  snapshotAt: string;
  nama: string;
  seamanCode: string;
  seafarerCode: string;
  jabatan: string;
  vesselName: string;
  konditeReview: number;
  kpiVessel: number;
  performanceScore: number;
  valueAssessment: number;
  assessmentCenter: number;
  potentialScore: number;
  havQuadran: number;
  havMapping: string;
  totalGap: number;
  talentClassified: string;
  talentClassified2: string;
  readiness: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useBatches() {
  const { data, error, isLoading } = useSWR<Batch[]>("/api/batches", async (url: string) => {
    const res = await api.get(url);
    return res.data.data;
  });

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const createBatch = async (startDate: Date, endDate: Date) => {
    setCreating(true);
    try {
      await api.post("/api/batches", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      await mutate("/api/batches");
      toast.success("Batch berhasil dibuat!");
      return true;
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.response?.data?.error || "Gagal membuat batch");
      return false;
    } finally {
      setCreating(false);
    }
  };

  const updateBatch = async (id: number, startDate: Date, endDate: Date) => {
    setUpdating(true);
    try {
      await api.put(`/api/batches/${id}`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      await mutate("/api/batches");
      toast.success("Batch berhasil diupdate!");
      return true;
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.response?.data?.error || "Gagal mengupdate batch");
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    batches: data || [],
    loading: isLoading,
    error,
    createBatch,
    isCreating: creating,
    updateBatch,
    isUpdating: updating,
  };
}

export function useSnapshots(batchId: number | null) {
  const { data, error, isLoading } = useSWR<BatchSnapshot[]>(
    batchId ? `/api/batches/${batchId}/snapshots` : null,
    async (url: string) => {
      const res = await api.get(url);
      return res.data.data;
    }
  );

  return {
    snapshots: data || [],
    loading: isLoading,
    error,
  };
}
