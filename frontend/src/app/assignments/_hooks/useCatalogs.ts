"use client";
import { useEffect, useState, startTransition } from "react";
import { toast } from "sonner";
import { api } from "@/app/lib/api";
import { IAssessment, IUser } from "@/types/global-types";

export function useCatalogs() {
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/api/assessment-types");
      const raw = res.data?.data ?? res.data ?? [];
      const parsed: IAssessment[] = raw.map(
        (a: {
          id?: number;
          assessmentId?: number;
          assessmentTypeName?: string;
          assessmentName?: string;
          role?: string;
        }) => ({
          assessmentId: a.id ?? a.assessmentId ?? 0,
          assessmentName: a.assessmentTypeName ?? a.assessmentName ?? "",
          role: a.role ?? "",
        })
      );
      startTransition(() => setAssessments(parsed));
    } catch (err) {
      console.error("Failed to load assessment-types:", err);
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Gagal memuat assessment types");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/master-reports?page=next&page_size=9999");
      const raw = res.data?.data?.data ?? res.data?.data ?? [];
      const parsed: IUser[] = raw.map(
        (u: { id: number; nama: string; jabatan: string; seafarerCode: string }) => ({
          id: u.id,
          nama: u.nama,
          jabatan: u.jabatan,
          seafarerCode: u.seafarerCode,
        })
      );
      startTransition(() => setUsers(parsed));
    } catch (err) {
      console.error("Failed to load master-reports:", err);
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Gagal memuat seafarer list");
    }
  };

  useEffect(() => {
    fetchAssessments();
    fetchUsers();
  }, []);

  return {
    assessments,
    users,
    refresh: async () => Promise.all([fetchAssessments(), fetchUsers()]),
  };
}
