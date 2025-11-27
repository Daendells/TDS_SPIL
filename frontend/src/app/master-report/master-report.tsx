"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Separator } from "@radix-ui/react-separator";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useMasterReports } from "./_hooks/master-report";
import { useMasterReportUI } from "./_hooks/useMasterReportUI";
import { useGetAllAssessmentTypes } from "./_hooks/useAssessmentType";
import type { IReport, IMentoringReport } from "@/types/global-types";

/* Dynamic sticky offset calculator */
function useDynamicStickyOffsets(ref: React.RefObject<HTMLDivElement | null>, pinnedCount = 2) {
  const [offsets, setOffsets] = useState<number[]>([]);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const updateOffsets = () => {
      const heads = container.querySelectorAll<HTMLTableCellElement>("thead th");
      const newOffsets: number[] = [];
      let runningLeft = 0;
      for (let i = 0; i < pinnedCount; i++) {
        newOffsets.push(runningLeft);
        runningLeft += heads[i]?.offsetWidth ?? 0;
      }
      setOffsets(newOffsets);
    };
    const observer = new ResizeObserver(updateOffsets);
    observer.observe(container);
    updateOffsets();
    return () => observer.disconnect();
  }, [ref, pinnedCount]);
  return offsets;
}

export default function MasterPage() {
  // Data hooks
  const {
    onCallApi,
    paginationData,
    availableMentoringReports,
    paginationRequest,
    setPaginationRequest,
    setPageSize,
    searchName,
    setSearchName,
    createReport,
    deleteReport,
    updateReport,
  } = useMasterReports(10);

  const { data: assessmentTypes = [] } = useGetAllAssessmentTypes();

  // UI hooks
  const {
    openDialog,
    setOpenDialog,
    confirmDeleteDialog,
    setConfirmDeleteDialog,
    openEditDialog,
    setOpenEditDialog,
    form,
    setForm,
    editingRow,
    setEditingRow,
    isEditMode,
    setIsEditMode,
    selectedIds,
    setSelectedIds,
    currentPage,
    setCurrentPage,
    competencyTypes,
    selectedCompetencies,
    setSelectedCompetencies,
    competencySearchOpen,
    setCompetencySearchOpen,
    loadingCompetencies,
    linkedMentoringReports,
    loadingLinkedMentoring,
    fetchLinkedMentoringReports,
    mentoringDetailsDialogOpen,
    setMentoringDetailsDialogOpen,
    selectedPersonForMentoring,
    setSelectedPersonForMentoring,
    isFormValid,
    isEditFormValid,
    toggleCompetencySelection,
    removeCompetency,
    resetForm,
    resetEditForm,
  } = useMasterReportUI();

  const tableRef = useRef<HTMLDivElement>(null);
  const offsets = useDynamicStickyOffsets(tableRef, 2);

  const PAGE_SIZES = [10, 20, 30, 50, 100];

  // Build dynamic columns with assessment types
  const STATIC_COLUMNS = [
    "No",
    "Name",
    "Seaman Code",
    "Seafarer Code",
    "Vessel Name",
    "Position",
    "IDP Program",
    "Age",
    "Certificate",
    "Kondite Review",
    "KPI Vessel",
    "Performance Score",
    "Competency Gap Analysis",
    "Total Gap",
    "Strength Analysis",
    "Hav Quadran",
    "Talent Classified",
    "Readiness",
    "Certificate Eligible",
    "Actions",
  ];

  // Add assessment type columns dynamically
  const assessmentTypeColumns = assessmentTypes.map((type) => type.assessmentTypeName);

  const TABLE_COLUMNS = [...STATIC_COLUMNS, ...assessmentTypeColumns];

  const navigatePage = (page: "prev" | "next") => {
    if (!paginationData) return;
    setCurrentPage((prev) => {
      if (page === "prev" && prev <= 1) return 1;
      return page === "next" ? prev + 1 : prev - 1;
    });

    setPaginationRequest({
      ...paginationRequest,
      page,
      anchorId: page === "next" ? paginationData.last_id : paginationData.first_id,
    });
  };

  const handleAdd = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields!");
      return;
    }

    try {
      await createReport(form);
      setForm({ nama: "", seamanCode: "", seafarerCode: "" });
      setOpenDialog(false);
      setPaginationRequest({ ...paginationRequest, anchorId: 0, page: "next" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to add report");
    }
  };

  const handleEdit = async () => {
    if (!isEditFormValid()) return toast.error("Please fill in all fields!");
    if (!editingRow) return;
    try {
      const updatePayload: any = {
        nama: editingRow.nama,
        seamanCode: editingRow.seamanCode,
        seafarerCode: editingRow.seafarerCode,
      };

      // Add optional fields if they have values
      if (editingRow.vesselName) {
        updatePayload.vesselName = editingRow.vesselName;
      }
      if (editingRow.jabatan) {
        updatePayload.jabatan = editingRow.jabatan;
      }
      if (editingRow.age) {
        updatePayload.age = editingRow.age;
      }
      if (editingRow.certificate) {
        updatePayload.certificate = editingRow.certificate;
      }
      if (editingRow.idpProgram) {
        updatePayload.idpProgram = editingRow.idpProgram;
      }
      if (editingRow.performanceScore) {
        updatePayload.performanceScore = editingRow.performanceScore;
      }
      if (editingRow.readiness) {
        updatePayload.readiness = editingRow.readiness;
      }
      if (editingRow.talentClassified) {
        updatePayload.talentClassified = editingRow.talentClassified;
      }

      // Add competencies if they were modified
      if (selectedCompetencies.length > 0) {
        updatePayload.competencies = selectedCompetencies.map((typeId) => ({
          competencyTypeId: typeId,
        }));
      } else {
        // Send empty array to clear competencies
        updatePayload.competencies = [];
      }

      console.log("Update payload:", updatePayload);
      await updateReport(editingRow.id, updatePayload);

      setOpenEditDialog(false);
      setEditingRow(null);
      setPaginationRequest({ ...paginationRequest });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to update report");
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) setSelectedIds(new Set());
    setIsEditMode((prev) => !prev);
  };

  const toggleRowSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!paginationData?.results) return;
    const ids = paginationData.results.map((r) => r.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    const newSet = new Set(selectedIds);
    if (allSelected) {
      ids.forEach((id) => newSet.delete(id));
    } else {
      ids.forEach((id) => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const confirmDelete = () => {
    if (selectedIds.size === 0) {
      toast.error("No rows selected!");
      return;
    }
    setConfirmDeleteDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    setConfirmDeleteDialog(false);
    try {
      for (const id of selectedIds) await deleteReport(id);
      setSelectedIds(new Set());
      setPaginationRequest({ ...paginationRequest, anchorId: 0, page: "next" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Delete failed");
    }
  };

  const handleRowClick = (row: IReport) => {
    if (!isEditMode) return;
    setEditingRow({ ...row });

    // Set selected competencies from row data
    const competencyIds =
      row.competencies
        ?.map((c) => c.competencyTypeId)
        .filter((id): id is number => id !== undefined) || [];
    setSelectedCompetencies(competencyIds);

    // Fetch mentoring reports linked to this person
    if (row.nama) {
      fetchLinkedMentoringReports(row.nama);
    }

    console.log("Editing row:", row);
    console.log("Existing competencies:", competencyIds);
    setOpenEditDialog(true);
  };

  const getRowNumber = (i: number) => (currentPage - 1) * paginationRequest.pageSize + i + 1;

  const handleViewMentoringPrograms = async (row: IReport, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking the button
    setSelectedPersonForMentoring(row);
    await fetchLinkedMentoringReports(row.nama);
    setMentoringDetailsDialogOpen(true);
  };

  function colorFromString(str: string | undefined | null) {
    if (!str) return "hsl(200, 70%, 70%)"; // Default color if undefined
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }

  // Helper function to get score for assessment type
  const getScoreForAssessmentType = (
    row: IReport & {
      reportScores?: Array<{ score?: number; assessmentType?: { assessmentTypeName?: string } }>;
    },
    assessmentTypeName: string
  ): number => {
    if (!row.reportScores || !Array.isArray(row.reportScores)) {
      return 0;
    }
    const scoreEntry = row.reportScores.find(
      (rs) => rs.assessmentType?.assessmentTypeName === assessmentTypeName
    );
    return scoreEntry?.score ?? 0;
  };

  const isAllCurrentPageSelected = () =>
    paginationData?.results?.every((r) => selectedIds.has(r.id)) ?? false;

  return (
    <div className="mt-8 p-4 m-6">
      {/* Header Section */}
      <div className="space-y-6 mb-6">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Image
              width={64}
              height={64}
              src="/images/logo1.png"
              alt="Company Logo"
              className="h-12 w-auto"
            />

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Master Table</h1>
              <p className="text-gray-500 mt-1">
                Kelola data induk pelaut, performa, dan rencana pengembangan individu.
              </p>
            </div>

            <Image
              width={64}
              height={64}
              src="/images/logo2.png"
              alt="Partner Logo"
              className="h-12 w-auto ml-auto"
            />
          </div>

          <Separator />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search by Name or Seafarer Code..."
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setCurrentPage(1);
            }}
            className="w-[300px]"
          />

          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant={isEditMode ? "destructive" : "outline"}
              onClick={toggleEditMode}
              className="flex items-center gap-2"
            >
              {isEditMode ? (
                <>
                  <XIcon className="w-4 h-4" /> Cancel
                </>
              ) : (
                <>
                  <EditIcon className="w-4 h-4" /> Edit
                </>
              )}
            </Button>

            {isEditMode && (
              <Button
                size="lg"
                variant="destructive"
                onClick={confirmDelete}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" /> Delete ({selectedIds.size})
              </Button>
            )}

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" /> Add Report
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Report</DialogTitle>
                  <DialogDescription>
                    Fill in the required information to create a new report.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div>
                    <Label htmlFor="nama">Name *</Label>
                    <Input
                      id="nama"
                      placeholder="Enter name"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seamanCode">Seaman Code *</Label>
                    <Input
                      id="seamanCode"
                      placeholder="Enter seaman code"
                      value={form.seamanCode}
                      onChange={(e) =>
                        setForm({ ...form, seamanCode: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="seafarerCode">Seafarer Code *</Label>
                    <Input
                      id="seafarerCode"
                      placeholder="Enter seafarer code"
                      value={form.seafarerCode}
                      onChange={(e) =>
                        setForm({ ...form, seafarerCode: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={!isFormValid() || onCallApi}>
                    {onCallApi ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Separator />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialog} onOpenChange={setConfirmDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected reports will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <p className="text-gray-700">
            Are you sure you want to delete {selectedIds.size} selected{" "}
            {selectedIds.size > 1 ? "reports" : "report"}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={onCallApi}>
              {onCallApi ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mentoring Programs Details Dialog */}
      <Dialog open={mentoringDetailsDialogOpen} onOpenChange={setMentoringDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mentoring Programs for {selectedPersonForMentoring?.nama || editingRow?.nama}</DialogTitle>
            <DialogDescription>
              All mentoring programs linked to this person
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {linkedMentoringReports.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <p className="text-gray-600">No mentoring programs found</p>
              </div>
            ) : (
              linkedMentoringReports.map((report: any, index: number) => (
                <div key={report.id} className="p-4 border rounded-lg bg-white space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Program {index + 1}: {report.programTitle || "N/A"}
                    </h3>
                    <Badge variant="outline">{report.program || "N/A"}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Mentor Name:</span>
                      <p className="text-gray-800">{report.mentorName || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Period:</span>
                      <p className="text-gray-800">{report.period || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Department:</span>
                      <p className="text-gray-800">{report.department || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Session Number:</span>
                      <p className="text-gray-800">{report.sessionNumber || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Date:</span>
                      <p className="text-gray-800">{report.date || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-800">{report.duration || "-"} minutes</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">Purpose:</span>
                      <p className="text-gray-800 mt-1">{report.purpose || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Observation:</span>
                      <p className="text-gray-800 mt-1">{report.observation || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Reflection:</span>
                      <p className="text-gray-800 mt-1">{report.reflection || "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Action Plan:</span>
                      <p className="text-gray-800 mt-1">{report.actionPlan || "-"}</p>
                    </div>
                    {report.additionalNotes && (
                      <div>
                        <span className="font-medium text-gray-600">Additional Notes:</span>
                        <p className="text-gray-800 mt-1">{report.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMentoringDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog with Competency Selection */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Update report information and manage competency gap analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="edit-nama">Name *</Label>
              <Input
                id="edit-nama"
                placeholder="Name"
                value={editingRow?.nama || ""}
                onChange={(e) =>
                  editingRow && setEditingRow({ ...editingRow, nama: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-seamanCode">Seaman Code *</Label>
              <Input
                id="edit-seamanCode"
                placeholder="Seaman Code"
                value={editingRow?.seamanCode || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, seamanCode: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-seafarerCode">Seafarer Code *</Label>
              <Input
                id="edit-seafarerCode"
                placeholder="Seafarer Code"
                value={editingRow?.seafarerCode || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, seafarerCode: e.target.value.toUpperCase() })
                }
              />
            </div>

            {/* Additional Master Report Fields */}
            <div>
              <Label htmlFor="edit-vesselName">Vessel Name</Label>
              <Input
                id="edit-vesselName"
                placeholder="Vessel Name"
                value={editingRow?.vesselName || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, vesselName: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-jabatan">Position</Label>
              <Input
                id="edit-jabatan"
                placeholder="Position"
                value={editingRow?.jabatan || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, jabatan: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-age">Age</Label>
              <Input
                id="edit-age"
                placeholder="Age"
                value={editingRow?.age || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, age: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-certificate">Certificate</Label>
              <Input
                id="edit-certificate"
                placeholder="Certificate"
                value={editingRow?.certificate || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, certificate: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-idpProgram">IDP Program</Label>
              <Input
                id="edit-idpProgram"
                placeholder="IDP Program"
                value={editingRow?.idpProgram || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, idpProgram: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-performanceScore">Performance Score</Label>
              <Input
                id="edit-performanceScore"
                placeholder="Performance Score"
                type="number"
                value={editingRow?.performanceScore || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, performanceScore: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-readiness">Readiness</Label>
              <Input
                id="edit-readiness"
                placeholder="Readiness"
                value={editingRow?.readiness || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, readiness: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-talentClassified">Talent Classified</Label>
              <Input
                id="edit-talentClassified"
                placeholder="Talent Classified"
                value={editingRow?.talentClassified || ""}
                onChange={(e) =>
                  editingRow &&
                  setEditingRow({ ...editingRow, talentClassified: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Mentoring Programs for {editingRow?.nama}</Label>
              {loadingLinkedMentoring ? (
                <div className="p-3 bg-blue-50 rounded-md flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-blue-700">Loading mentoring programs...</p>
                </div>
              ) : linkedMentoringReports.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    No mentoring programs found for <strong>{editingRow?.nama}</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium">
                      Found {linkedMentoringReports.length} mentoring program{linkedMentoringReports.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={() => setMentoringDetailsDialogOpen(true)}
                  >
                    View All Programs ({linkedMentoringReports.length})
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Competency Gap Analysis</Label>

              {/* Selected Competencies */}
              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-gray-50">
                {selectedCompetencies.length === 0 ? (
                  <span className="text-sm text-gray-400">No competencies selected</span>
                ) : (
                  selectedCompetencies.map((typeId) => {
                    const comp = competencyTypes.find((ct) => ct.id === typeId);
                    if (!comp) return null;
                    return (
                      <Badge
                        key={typeId}
                        style={{ backgroundColor: colorFromString(comp.code) }}
                        className="text-white flex items-center gap-1"
                      >
                        <span className="font-semibold">{comp.code}</span>
                        <span className="text-xs opacity-90">- {comp.name}</span>
                        <button
                          onClick={() => removeCompetency(typeId)}
                          className="ml-1 hover:text-red-200 transition-colors"
                          type="button"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>

              {/* Competency Selector */}
              <Popover open={competencySearchOpen} onOpenChange={setCompetencySearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    type="button"
                    disabled={loadingCompetencies}
                  >
                    {loadingCompetencies ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading competencies...
                      </>
                    ) : (
                      <>
                        Add Competency Type
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search competency types..." />
                    <CommandEmpty>No competency type found.</CommandEmpty>
                    <CommandList className="max-h-[300px]">
                      <CommandGroup>
                        {competencyTypes.map((type) => (
                          <CommandItem
                            key={type.id}
                            value={`${type.code} ${type.name}`}
                            onSelect={() => {
                              toggleCompetencySelection(type.id);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCompetencies.includes(type.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{type.code}</span>
                              <span className="text-xs text-gray-500">{type.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditDialog(false);
                setEditingRow(null);
                setSelectedCompetencies([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!isEditFormValid()}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div
        ref={tableRef}
        className={`overflow-auto max-h-[70vh] border rounded-lg transition-opacity ${
          onCallApi ? "opacity-70" : "opacity-100"
        }`}
      >
        <Table className="min-w-[2000px] border-collapse">
          <TableHeader className="sticky top-0 bg-background z-50 shadow-sm">
            <TableRow className="bg-background">
              {isEditMode && (
                <TableHead className="text-center sticky left-0 z-40 bg-background w-[50px]">
                  <button
                    onClick={toggleSelectAll}
                    className="aspect-square h-4 w-4 rounded-full border border-primary inline-flex items-center justify-center"
                  >
                    {isAllCurrentPageSelected() && (
                      <div className="h-2.5 w-2.5 rounded-full bg-current" />
                    )}
                  </button>
                </TableHead>
              )}
              {TABLE_COLUMNS.map((col, i) => (
                <TableHead
                  key={col}
                  className={cn("text-center bg-background border", i < 2 ? "sticky z-40" : "")}
                  style={i < 2 ? { left: `${offsets[i] || 0}px` } : {}}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {onCallApi ? (
              <TableRow>
                <TableCell
                  colSpan={TABLE_COLUMNS.length + (isEditMode ? 1 : 0)}
                  className="text-center text-gray-400 h-32"
                >
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  <p className="mt-2">Loading...</p>
                </TableCell>
              </TableRow>
            ) : paginationData?.results?.length ? (
              paginationData.results.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={`${selectedIds.has(row.id) ? "bg-blue-50" : ""} ${
                    isEditMode ? "cursor-pointer hover:bg-gray-50" : ""
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  {isEditMode && (
                    <TableCell
                      className="text-center sticky left-0 z-40 bg-background border-r"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowSelection(row.id);
                      }}
                    >
                      <button className="aspect-square h-4 w-4 rounded-full border border-primary inline-flex items-center justify-center">
                        {selectedIds.has(row.id) && (
                          <div className="h-2.5 w-2.5 rounded-full bg-current" />
                        )}
                      </button>
                    </TableCell>
                  )}
                  <TableCell
                    className="text-center bg-background border sticky z-30"
                    style={{ left: `${offsets[0] || 0}px`, width: "60px", pointerEvents: "none" }}
                  >
                    <span className="pointer-events-auto">{getRowNumber(i)}</span>
                  </TableCell>
                  <TableCell
                    className="text-center bg-background border sticky z-30"
                    style={{ left: `${offsets[1] || 0}px`, width: "200px", pointerEvents: "none" }}
                  >
                    <span className="pointer-events-auto">{row.nama}</span>
                  </TableCell>
                  <TableCell className="text-center">{row.seamanCode || "-"}</TableCell>
                  <TableCell className="text-center">{row.seafarerCode || "-"}</TableCell>
                  <TableCell className="text-center">{row.vesselName || "-"}</TableCell>
                  <TableCell className="text-center">{row.jabatan || "-"}</TableCell>
                  <TableCell className="text-center">{row.idpProgram || "-"}</TableCell>
                  <TableCell className="text-center">{row.age || "-"}</TableCell>
                  <TableCell className="text-center">{row.certificate || "-"}</TableCell>
                  <TableCell className="text-center">{row.konditeReview || "-"}</TableCell>
                  <TableCell className="text-center">{row.kpiVessel || "-"}</TableCell>
                  <TableCell className="text-center">{row.performanceScore || "-"}</TableCell>
                  <TableCell className="text-center">
                    {Array.isArray(row.competencies) && row.competencies.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {row.competencies.map((c) => {
                          const code = c?.competencyType?.code;
                          if (!code) return null;

                          return (
                            <span
                              key={code}
                              className="px-2 py-1 rounded-xl text-xs font-semibold text-white"
                              style={{ backgroundColor: colorFromString(code) }}
                            >
                              {code}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">{row.totalGap || "-"}</TableCell>
                  <TableCell className="text-center">{row.strength || "-"}</TableCell>
                  <TableCell className="text-center">{row.havQuadran || "-"}</TableCell>
                  <TableCell className="text-center">{row.talentClassified || "-"}</TableCell>
                  <TableCell className="text-center">{row.readiness || "-"}</TableCell>
                  <TableCell className="text-center">{row.certificateEligible || "-"}</TableCell>

                  {/* Actions Column */}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleViewMentoringPrograms(row, e)}
                      className="text-xs"
                    >
                      View Programs
                    </Button>
                  </TableCell>

                  {/* Dynamic assessment type score columns */}
                  {assessmentTypeColumns.map((assessmentTypeName) => (
                    <TableCell key={assessmentTypeName} className="text-center">
                      <Badge variant={"secondary"}>{getScoreForAssessmentType(row, assessmentTypeName)}</Badge>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={TABLE_COLUMNS.length + (isEditMode ? 1 : 0)}
                  className="text-center text-gray-400 h-32"
                >
                  No Data Available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-[120px] justify-between">
              {paginationRequest.pageSize}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[120px] p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {PAGE_SIZES.map((size) => (
                    <CommandItem
                      key={size}
                      value={size.toString()}
                      onSelect={() => {
                        setCurrentPage(1);
                        setPaginationRequest({
                          ...paginationRequest,
                          pageSize: size,
                          anchorId: 0,
                          page: "next",
                        });
                        setPageSize(size);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          paginationRequest.pageSize === size ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {size}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Pagination className="mx-auto">
          <PaginationContent className="flex justify-center">
            <PaginationItem>
              <Button
                disabled={
                  !paginationData || paginationData.first_page || currentPage <= 1 || onCallApi
                }
                onClick={() => navigatePage("prev")}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" /> Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                disabled={!paginationData?.has_more || onCallApi}
                onClick={() => navigatePage("next")}
              >
                Next <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <span className="text-sm text-gray-600">
          Page {currentPage} | Showing {paginationData?.results?.length || 0} of{" "}
          {paginationRequest.pageSize} rows
        </span>
      </div>
    </div>
  );
}
