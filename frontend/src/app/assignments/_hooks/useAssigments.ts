"use client";
import { useState, useEffect, useDeferredValue, startTransition } from "react";
import { toast } from "sonner";
import { api } from "@/app/lib/api";
import {
  IAssignmentFlat,
  IAssignmentCreate,
  IAssignmentUpdate,
  IReport,
} from "@/types/global-types";

export function useAssignments() {
  const [assignments, setAssignments] = useState<IAssignmentFlat[]>([]);
  const [allAssignments, setAllAssignments] = useState<IAssignmentFlat[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  /** 🔹 Page Size & Filters */
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [filterAssessment, setFilterAssessment] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterBatch, setFilterBatch] = useState<string>("ALL");
  const [batchSeafarerCodes, setBatchSeafarerCodes] = useState<Set<string> | null>(null);

  /** 🔹 Fetch batch members when filterBatch changes */
  useEffect(() => {
    const fetchBatchMembers = async () => {
      if (filterBatch === "ALL" || !filterBatch) {
        setBatchSeafarerCodes(null);
        return;
      }

      try {
        setLoading(true);
        // We use master-reports endpoint to get seafarers in this batch
        const res = await api.get(`/api/master-reports?batch_id=${filterBatch}&page_size=1000`);
        const reports = res.data?.data?.data || res.data?.data || res.data || [];

        const codes = new Set<string>();
        reports.forEach((r: IReport) => {
          if (r.seafarerCode) codes.add(r.seafarerCode);
        });

        setBatchSeafarerCodes(codes);
      } catch (err) {
        console.error("Failed to fetch batch members", err);
        setBatchSeafarerCodes(new Set()); // Empty set so no assignments show
      } finally {
        setLoading(false);
      }
    };

    fetchBatchMembers();
  }, [filterBatch]);

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

    // 🎯 Filter Batch (using the cross-referenced codes)
    if (batchSeafarerCodes !== null) {
      filtered = filtered.filter((a) => batchSeafarerCodes.has(a.seafarerCode));
    }

    // 📌 Page Size (client-side pagination)
    setFilteredCount(filtered.length);

    if (pageSize === -1) {
      startTransition(() => {
        setAssignments(filtered);
        setCurrentPage(1);
      });
    } else {
      const startIndex = (currentPage - 1) * pageSize;
      const sliced = filtered.slice(startIndex, startIndex + pageSize);

      startTransition(() => setAssignments(sliced));
    }
  }, [
    deferredQuery,
    allAssignments,
    filterAssessment,
    filterStatus,
    batchSeafarerCodes,
    pageSize,
    currentPage,
  ]);

  const navigatePage = (page: "prev" | "next") => {
    setCurrentPage((prev) => {
      if (page === "prev") return Math.max(1, prev - 1);
      return prev + 1;
    });
  };

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

    filterBatch,
    setFilterBatch,

    currentPage,
    navigatePage,
    totalCount: allAssignments.length,
    filteredCount,

    fetchAll,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
