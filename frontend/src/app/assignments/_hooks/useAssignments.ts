"use client";
import { useState, useEffect, startTransition } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { IAssignment } from "@/types/global-types";
import { useDebounce } from "use-debounce";

export function useAssignments() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<IAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);

  // ✅ Fetch all 10 latest assignments
  const fetchAll = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/assignments?limit=10`);
      const data = response.data?.data || [];
      startTransition(() => {
        setAssignments(data);
        setFilteredAssignments(data);
      });
      toast.success("Assignments loaded");
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error(err.response?.data?.error || "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search filter (by user name, seaman code, or assessment name)
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredAssignments(assignments);
      return;
    }

    const searchLower = debouncedSearch.toLowerCase();
    const filtered = assignments.filter((a) => {
      const userName = (a.User?.Nama || "").toLowerCase();
      const seamanCode = (a.User?.SeamanCode || "").toLowerCase();
      const assessmentName = (a.Assessment?.name || "").toLowerCase();
      const note = (a.Note || "").toLowerCase();
      const status = (a.Status || "").toLowerCase();
      return (
        userName.includes(searchLower) ||
        seamanCode.includes(searchLower) ||
        assessmentName.includes(searchLower) ||
        note.includes(searchLower) ||
        status.includes(searchLower)
      );
    });
    startTransition(() => {
      setFilteredAssignments(filtered);
    });
  }, [debouncedSearch, assignments]);

  // 🟢 Auto load on mount
  useEffect(() => {
    fetchAll();
  }, []);

  const createAssignment = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.post("/api/assignments", payload);
      toast.success("Assignment created!");
      await fetchAll();
      return res.data;
    } catch (err: any) {
      console.error("Failed to create assignment:", err);
      toast.error(err.response?.data?.error || "Failed to create assignment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (id: number, payload: any) => {
    setLoading(true);
    try {
      const res = await api.put(`/api/assignments/${id}`, payload);
      toast.success("Assignment updated!");
      await fetchAll();
      return res.data;
    } catch (err: any) {
      console.error("Failed to update assignment:", err);
      toast.error(err.response?.data?.error || "Failed to update assignment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id: number) => {
    setLoading(true);
    try {
      await api.delete(`/api/assignments/${id}`);
      toast.success("Assignment deleted!");
      await fetchAll();
    } catch (err: any) {
      console.error("Failed to delete assignment:", err);
      toast.error(err.response?.data?.error || "Failed to delete assignment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    assignments: filteredAssignments,
    allAssignments: assignments,
    searchQuery,
    setSearchQuery,
    fetchAll,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
