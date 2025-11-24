"use client";
import { useState, useEffect, useDeferredValue, startTransition } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { IAssignmentFlat, IAssignmentCreate, IAssignmentUpdate } from "@/types/global-types";

export function useAssignments() {
  const api = useApi();

  const [assignments, setAssignments] = useState<IAssignmentFlat[]>([]);
  const [allAssignments, setAllAssignments] = useState<IAssignmentFlat[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  /** 🔹 Page Size & Filters */
  const [pageSize, setPageSize] = useState<number>(20);
  const [filterAssessment, setFilterAssessment] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  /** 🔹 Fetch all assignments (no pagination backend) */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/assignments");

      const raw = res.data?.results ?? res.data?.data?.results ?? res.data?.data ?? [];

      const parsed: IAssignmentFlat[] = Array.isArray(raw)
        ? raw.map(
            (a: {
              id: number;
              seafarerCode: string;
              nama: string;
              assessmentTypeId: number;
              assessmentType: string;
              attempts?: number;
              Attempts?: number;
              status?: string;
            }) => ({
              id: a.id,
              seafarerCode: a.seafarerCode,
              nama: a.nama,
              assessmentTypeId: a.assessmentTypeId,
              assessmentType: a.assessmentType,
              attempts: a.attempts ?? a.Attempts ?? 0,
              status: (a.status ?? "ASSIGNED").toUpperCase(),
            })
          )
        : [];

      startTransition(() => {
        setAllAssignments(parsed);
        setAssignments(parsed);
      });
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Gagal memuat assignments");
    } finally {
      setLoading(false);
    }
  };

  /** 🔎 Filtering (Search + Filter + Page Size) */
  useEffect(() => {
    let filtered = [...allAssignments];

    // 🔍 Search
    if (deferredQuery) {
      const q = deferredQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.nama.toLowerCase().includes(q) ||
          a.seafarerCode.toLowerCase().includes(q) ||
          a.assessmentType.toLowerCase().includes(q)
      );
    }

    // 🎯 Filter Assessment
    if (filterAssessment !== "ALL") {
      filtered = filtered.filter((a) => a.assessmentTypeId === Number(filterAssessment));
    }

    // 🎯 Filter Status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    // 📌 Page Size (client)
    const sliced = pageSize === -1 ? filtered : filtered.slice(0, pageSize);

    startTransition(() => setAssignments(sliced));
  }, [deferredQuery, allAssignments, filterAssessment, filterStatus, pageSize]);

  /** CRUD */
  const createAssignment = async (payload: IAssignmentCreate) => {
    setLoading(true);
    try {
      const res = await api.post("/api/assignments", payload);
      toast.success("Assignment berhasil ditambahkan");
      await fetchAll();
      return res.data;
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Gagal menambah assignment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (id: number, payload: IAssignmentUpdate) => {
    setLoading(true);
    try {
      const res = await api.put(`/api/assignments/${id}`, payload);
      toast.success("Assignment berhasil diperbarui");
      await fetchAll();
      return res.data;
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Gagal memperbarui assignment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id: number) => {
    setLoading(true);
    try {
      await api.delete(`/api/assignments/${id}`);
      toast.success("Assignment berhasil dihapus");
      await fetchAll();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Gagal menghapus assignment");
    } finally {
      setLoading(false);
    }
  };

  // Load initial
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Exports */
  return {
    loading,
    assignments,
    allAssignments,
    searchQuery,
    setSearchQuery,

    pageSize,
    setPageSize,

    filterAssessment,
    setFilterAssessment,

    filterStatus,
    setFilterStatus,

    fetchAll,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
