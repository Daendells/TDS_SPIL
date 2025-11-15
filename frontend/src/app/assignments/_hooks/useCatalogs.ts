"use client";
import { useEffect, useState, startTransition } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { IAssessment, IUser } from "@/types/global-types";
import axios from "axios";

export function useCatalogs() {
  const api = useApi();
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/api/assessment-types");
      const raw = res.data?.data ?? res.data ?? [];
      const parsed: IAssessment[] = raw.map((a: any) => ({
        assessmentId: a.id ?? a.assessmentId,
        assessmentName: a.assessmentTypeName ?? a.assessmentName,
        role: a.role ?? "",
      }));
      startTransition(() => setAssessments(parsed));
    } catch (err: any) {
      console.error("Failed to load assessment-types:", err);
      toast.error(err.response?.data?.error || "Gagal memuat assessment types");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/master-reports?page=next&page_size=9999");
      const raw = res.data?.data?.data ?? res.data?.data ?? [];
      const parsed: IUser[] = raw.map((u: any) => ({
        id: u.id,
        nama: u.nama,
        jabatan: u.jabatan,
        seafarerCode: u.seafarerCode,
      }));
      startTransition(() => setUsers(parsed));
    } catch (err: any) {
      console.error("Failed to load master-reports:", err);
      toast.error(err.response?.data?.error || "Gagal memuat seafarer list");
    }
  };

  useEffect(() => {
    fetchAssessments();
    fetchUsers();
  }, []);

  return {
    loading,
    assessments,
    users,
    refresh: async () => Promise.all([fetchAssessments(), fetchUsers()]),
  };
}
