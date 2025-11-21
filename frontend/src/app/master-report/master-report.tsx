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
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMasterReports } from "./_hooks/master-report";
import { useGetAllAssessmentTypes } from "./_hooks/useAssessmentType";

/* Dynamic sticky offset calculator */
function useDynamicStickyOffsets(
  ref: React.RefObject<HTMLDivElement | null>,
  pinnedCount = 2
) {
  const [offsets, setOffsets] = useState<number[]>([]);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const updateOffsets = () => {
      const heads =
        container.querySelectorAll<HTMLTableCellElement>("thead th");
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
  const {
    onCallApi,
    paginationData,
    paginationRequest,
    setPaginationRequest,
    pageSize,
    setPageSize,
    searchName,
    setSearchName,
    createReport,
    deleteReport,
    updateReport,
  } = useMasterReports(10);

  // Fetch assessment types
  const { data: assessmentTypes = [] } = useGetAllAssessmentTypes();

  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    seamanCode: "",
    seafarerCode: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<any>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
    "Value Assessment",
    "Competency Gap Analysis",
    "Total Gap",
    "Strength Analysis",
    "Hav Quadran",
    "Talent Classified",
    "Readiness",
    "Certificate Eligible",
  ];

  // Add assessment type columns dynamically
  const assessmentTypeColumns = assessmentTypes.map(
    (type) => type.assessmentTypeName
  );

  const TABLE_COLUMNS = [...STATIC_COLUMNS, ...assessmentTypeColumns];

  const isFormValid = () =>
    form.nama.trim() && form.seamanCode.trim() && form.seafarerCode.trim();

  const isEditFormValid = () =>
    editingRow?.nama?.trim() &&
    editingRow?.seamanCode?.trim() &&
    editingRow?.seafarerCode?.trim();

  const navigatePage = (page: "prev" | "next") => {
    if (!paginationData) return;
    setCurrentPage((prev) => {
      if (page === "prev" && prev <= 1) return 1; // prevent going below 1
      return page === "next" ? prev + 1 : prev - 1;
    });

    setPaginationRequest({
      ...paginationRequest,
      page,
      anchorId:
        page === "next" ? paginationData.last_id : paginationData.first_id,
    });
  };

  const handleAdd = async () => {
    if (!isFormValid()) return toast.error("Please fill in all fields!");
    try {
      await createReport(form);
      toast.success("Added successfully!");
      setForm({ nama: "", seamanCode: "", seafarerCode: "" });
      setOpenDialog(false);
      setPaginationRequest({ ...paginationRequest, anchorId: 0, page: "next" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add report");
    }
  };

  const handleEdit = async () => {
    if (!isEditFormValid()) return toast.error("Please fill in all fields!");
    try {
      await updateReport(editingRow.id, {
        nama: editingRow.nama,
        seamanCode: editingRow.seamanCode,
        seafarerCode: editingRow.seafarerCode,
      });
      toast.success("Report updated successfully!");
      setOpenEditDialog(false);
      setEditingRow(null);
      setPaginationRequest({ ...paginationRequest });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update report");
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) setSelectedIds(new Set());
    setIsEditMode((prev) => !prev);
  };

  const toggleRowSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!paginationData?.results) return;
    const ids = paginationData.results.map((r) => r.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    const newSet = new Set(selectedIds);
    allSelected
      ? ids.forEach((id) => newSet.delete(id))
      : ids.forEach((id) => newSet.add(id));
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
      toast.success("Selected reports deleted!");
      setSelectedIds(new Set());
      setPaginationRequest({ ...paginationRequest, anchorId: 0, page: "next" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  const handleRowClick = (row: any) => {
    if (!isEditMode) return;
    setEditingRow({ ...row });
    setOpenEditDialog(true);
  };

  const getRowNumber = (i: number) =>
    (currentPage - 1) * paginationRequest.pageSize + i + 1;

  function colorFromString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }

  // Helper function to get score for assessment type
  const getScoreForAssessmentType = (
    row: any,
    assessmentTypeName: string
  ): number => {
    if (!row.reportScores || !Array.isArray(row.reportScores)) {
      return 0;
    }
    const scoreEntry = row.reportScores.find(
      (rs: any) => rs.assessmentType?.assessmentTypeName === assessmentTypeName
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
            {/* Left Logo */}
            <Image
              width={64}
              height={64}
              src="/images/logo1.png"
              alt="Company Logo"
              className="h-12 w-auto"
            />

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Master Table
              </h1>
              <p className="text-gray-500 mt-1">
                Kelola data induk pelaut, performa, dan rencana pengembangan
                individu.
              </p>
            </div>

            {/* Right Logo */}
            <Image
              width={64}
              height={64}
              src="/images/logo2.png"
              alt="Partner Logo"
              className="h-12 w-auto ml-auto"
            />
          </div>

          {/* Line Separator */}
          <Separator />
        </div>

        {/* Toolbar: Search + Action Buttons */}
        <div className="flex items-center justify-between">
          {/* Search Input */}
          <Input
            placeholder="Search by Name or Seafarer Code..."
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setCurrentPage(1);
            }}
            className="w-[300px]"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Edit / Cancel toggle */}
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

            {/* Delete button (only visible in edit mode) */}
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

            {/* Add Report Dialog */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" /> Add Report
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Report</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <Input
                    placeholder="Name"
                    value={form.nama}
                    onChange={(e) =>
                      setForm({ ...form, nama: e.target.value.toUpperCase() })
                    }
                  />
                  <Input
                    placeholder="Seaman Code"
                    value={form.seamanCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seamanCode: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <Input
                    placeholder="Seafarer Code"
                    value={form.seafarerCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seafarerCode: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={!isFormValid()}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Line separator below toolbar */}
        <Separator />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialog} onOpenChange={setConfirmDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">
            Are you sure you want to delete {selectedIds.size} selected{" "}
            {selectedIds.size > 1 ? "reports" : "report"}? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Input
              placeholder="Name"
              value={editingRow?.nama || ""}
              onChange={(e) =>
                setEditingRow({
                  ...editingRow,
                  nama: e.target.value.toUpperCase(),
                })
              }
            />
            <Input
              placeholder="Seaman Code"
              value={editingRow?.seamanCode || ""}
              onChange={(e) =>
                setEditingRow({
                  ...editingRow,
                  seamanCode: e.target.value.toUpperCase(),
                })
              }
            />
            <Input
              placeholder="Seafarer Code"
              value={editingRow?.seafarerCode || ""}
              onChange={(e) =>
                setEditingRow({
                  ...editingRow,
                  seafarerCode: e.target.value.toUpperCase(),
                })
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditDialog(false);
                setEditingRow(null);
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
          <TableHeader className="sticky top-0 bg-background z-50">
            <TableRow>
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
                  className={cn(
                    "text-center bg-background border",
                    i < 2 ? "sticky z-40" : ""
                  )}
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
                  className="text-center text-gray-400"
                >
                  Loading...
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
                    style={{
                      left: `${offsets[0] || 0}px`,
                      width: "60px",
                      pointerEvents: "none",
                    }}
                  >
                    <span className="pointer-events-auto">
                      {getRowNumber(i)}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-center bg-background border sticky z-30"
                    style={{
                      left: `${offsets[1] || 0}px`,
                      width: "200px",
                      pointerEvents: "none",
                    }}
                  >
                    <span className="pointer-events-auto">{row.nama}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.seamanCode}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.seafarerCode}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.vesselName}
                  </TableCell>
                  <TableCell className="text-center">{row.jabatan}</TableCell>
                  <TableCell className="text-center">
                    {row.idpProgram}
                  </TableCell>
                  <TableCell className="text-center">{row.age}</TableCell>
                  <TableCell className="text-center">
                    {row.certificate}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.konditeReview}
                  </TableCell>
                  <TableCell className="text-center">{row.kpiVessel}</TableCell>
                  <TableCell className="text-center">
                    {row.performanceScore}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.valueAssessment}
                  </TableCell>
                  <TableCell className="text-center">
                    {Array.isArray(row.competencies) &&
                    row.competencies.length > 0 ? (
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
                  <TableCell className="text-center">{row.totalGap}</TableCell>
                  <TableCell className="text-center">{row.strength}</TableCell>
                  <TableCell className="text-center">
                    {row.havQuadran}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.talentClassified}
                  </TableCell>
                  <TableCell className="text-center">{row.readiness}</TableCell>
                  <TableCell className="text-center">
                    {row.certificateEligible}
                  </TableCell>
                  {/* Dynamic assessment type score columns */}
                  {assessmentTypeColumns.map((assessmentTypeName) => (
                    <TableCell key={assessmentTypeName} className="text-center">
                      {getScoreForAssessmentType(row, assessmentTypeName)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={TABLE_COLUMNS.length + (isEditMode ? 1 : 0)}
                  className="text-center text-gray-400"
                >
                  No Data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination + page size */}
      <div className="flex items-center justify-between mt-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-[120px] justify-between"
            >
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
                          paginationRequest.pageSize === size
                            ? "opacity-100"
                            : "opacity-0"
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
                  !paginationData ||
                  paginationData.first_page ||
                  currentPage <= 1 ||
                  onCallApi
                }
                onClick={() => navigatePage("prev")}
              >
                <ChevronLeftIcon /> Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                disabled={!paginationData?.has_more || onCallApi}
                onClick={() => navigatePage("next")}
              >
                Next <ChevronRightIcon />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <span className="text-sm text-gray-600">
          Page {currentPage} | Showing {paginationRequest.pageSize} rows
        </span>
      </div>
    </div>
  );
}
