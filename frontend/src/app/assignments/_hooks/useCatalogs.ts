"use client";
import { useState, useEffect } from "react";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { IAssessment, IUser } from "@/types/global-types";

export function useCatalogs() {
  const api = useApi();

  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 🔹 Fetch daftar assessment
  const fetchAssessments = async () => {
    setLoadingAssessments(true);
    try {
      const res = await api.get("/api/assessments");
      const data = res.data?.data || res.data || [];
      const normalized = data.map((a: any) => ({
        id: a.id ?? a.ID ?? a.AssessmentID,
        name: a.name ?? a.assessmentName ?? a.AssessmentName ?? "",
      }));
      setAssessments(normalized);
    } catch (err: any) {
      console.error("Gagal memuat assessments:", err);
      toast.error("Gagal memuat daftar Assessment");
    } finally {
      setLoadingAssessments(false);
    }
  };

  // 🔹 Fetch daftar user
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/api/assignments");
      const data = res.data?.data || res.data || [];
      const normalized = data.map((u: any) => ({
        id: u.id ?? u.ID,
        nama: u.nama ?? u.Nama ?? u.name ?? "",
        seamanCode: u.seamanCode ?? u.SeamanCode ?? "",
      }));
      setUsers(normalized);
    } catch (err: any) {
      console.error("Gagal memuat users:", err);
      toast.error("Gagal memuat daftar User");
    } finally {
      setLoadingUsers(false);
    }
  };

  // 🔹 Auto fetch ketika hook pertama kali dijalankan
  useEffect(() => {
    fetchAssessments();
    fetchUsers();
  }, []);

  return {
    assessments,
    users,
    loadingAssessments,
    loadingUsers,
    refreshCatalogs: () => {
      fetchAssessments();
      fetchUsers();
    },
  };
}
