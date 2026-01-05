"use client";
import { useState, useEffect } from "react";
import { IReport, ICompetencyType, IMentoringReport } from "@/types/global-types";
import { api } from "@/app/lib/api";
import { toast } from "sonner";

export function useMasterReportUI() {
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Form states
  const [form, setForm] = useState({
    nama: "",
    seamanCode: "",
    seafarerCode: "",
  });

  // Edit states
  const [editingRow, setEditingRow] = useState<IReport | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Competency states
  const [competencyTypes, setCompetencyTypes] = useState<ICompetencyType[]>([]);
  const [selectedCompetencies, setSelectedCompetencies] = useState<number[]>([]);
  const [competencySearchOpen, setCompetencySearchOpen] = useState(false);
  const [loadingCompetencies, setLoadingCompetencies] = useState(false);

  // Mentoring states
  const [linkedMentoringReports, setLinkedMentoringReports] = useState<IMentoringReport[]>([]);
  const [loadingLinkedMentoring, setLoadingLinkedMentoring] = useState(false);
  const [mentoringDetailsDialogOpen, setMentoringDetailsDialogOpen] = useState(false);
  const [selectedPersonForMentoring, setSelectedPersonForMentoring] = useState<IReport | null>(
    null
  );

  // Function to fetch mentoring reports linked to a specific person
  const fetchLinkedMentoringReports = async (personName: string) => {
    if (!personName || personName.trim() === "") {
      setLinkedMentoringReports([]);
      return;
    }

    setLoadingLinkedMentoring(true);
    try {
      const response = await api.get(`/api/master-reports/mentoring-programs`, {
        params: { personName: personName },
      });

      // The response format is { data: [...] }
      const reports = response.data?.data || [];

      // Ensure reports is always an array
      const finalReports = Array.isArray(reports) ? reports : [];
      setLinkedMentoringReports(finalReports);
    } catch {
      setLinkedMentoringReports([]);
    } finally {
      setLoadingLinkedMentoring(false);
    }
  };

  // Fetch competency types on mount
  useEffect(() => {
    const fetchCompetencyTypes = async () => {
      setLoadingCompetencies(true);
      try {
        const response = await api.get("/api/competency-types");
        const types = response.data?.data || response.data || [];
        setCompetencyTypes(types);
      } catch {
        toast.error("Failed to load competency types");
      } finally {
        setLoadingCompetencies(false);
      }
    };

    fetchCompetencyTypes();
  }, []);

  // Form validation
  const isFormValid = () => {
    return (
      form.nama.trim() !== "" && form.seamanCode.trim() !== "" && form.seafarerCode.trim() !== ""
    );
  };

  const isEditFormValid = () => {
    return (
      editingRow &&
      editingRow.nama?.trim() !== "" &&
      editingRow.seamanCode?.trim() !== ""
      // seafarerCode is now optional
    );
  };

  // Competency management
  const toggleCompetencySelection = (typeId: number) => {
    setSelectedCompetencies((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const removeCompetency = (typeId: number) => {
    setSelectedCompetencies((prev) => prev.filter((id) => id !== typeId));
  };

  // Form reset functions
  const resetForm = () => {
    setForm({ nama: "", seamanCode: "", seafarerCode: "" });
  };

  const resetEditForm = () => {
    setEditingRow(null);
    setSelectedCompetencies([]);
  };

  return {
    // Dialog states
    openDialog,
    setOpenDialog,
    confirmDeleteDialog,
    setConfirmDeleteDialog,
    openEditDialog,
    setOpenEditDialog,

    // Form states
    form,
    setForm,

    // Edit states
    editingRow,
    setEditingRow,
    isEditMode,
    setIsEditMode,
    selectedIds,
    setSelectedIds,

    // Pagination
    currentPage,
    setCurrentPage,

    // Competency states
    competencyTypes,
    selectedCompetencies,
    setSelectedCompetencies,
    competencySearchOpen,
    setCompetencySearchOpen,
    loadingCompetencies,

    // Mentoring states
    linkedMentoringReports,
    setLinkedMentoringReports,
    loadingLinkedMentoring,
    fetchLinkedMentoringReports,
    mentoringDetailsDialogOpen,
    setMentoringDetailsDialogOpen,
    selectedPersonForMentoring,
    setSelectedPersonForMentoring,

    // Validation functions
    isFormValid,
    isEditFormValid,

    // Competency management functions
    toggleCompetencySelection,
    removeCompetency,

    // Reset functions
    resetForm,
    resetEditForm,
  };
}
