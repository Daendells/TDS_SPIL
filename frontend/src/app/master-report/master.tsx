"use client";

import * as React from "react";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroupItem } from "@/components/ui/radio-group";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon, EditIcon, TrashIcon, XIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMasterReports } from "./_hooks/master";

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
    updateReport, // Make sure you have this function in your hook
  } = useMasterReports(10);

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    seamanCode: "",
    seafarerCode: "",
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Selected rows for deletion (store IDs across all pages)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Edit dialog state
  const [editingRow, setEditingRow] = useState<any>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const TABLE_COLUMNS = [
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

  const isFormValid = () => {
    return (
      form.nama.trim() !== "" &&
      form.seamanCode.trim() !== "" &&
      form.seafarerCode.trim() !== "" &&
      true);
  };

  const isEditFormValid = () => {
    return (
      editingRow?.nama?.trim() !== "" &&
      editingRow?.seamanCode?.trim() !== "" &&
      editingRow?.seafarerCode?.trim() !== ""
    );
  };

  const navigatePage = (page: "prev" | "next") => {
    if (!paginationData) return;
    setCurrentPage(prev => page === "next" ? prev + 1 : prev - 1);
    setPaginationRequest({
      ...paginationRequest,
      page,
      anchorId: page === "next" ? paginationData.lastId : paginationData.firstId,
    });
  };

  const handleAdd = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all fields!");
      return;
    }

    try {
      await createReport(form);
      setOpenDialog(false);
      setForm({
        nama: "",
        seamanCode: "",
        seafarerCode: "",
      });
      setCurrentPage(1);
      setPaginationRequest({ ...paginationRequest, anchorId: 0, page: "next" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to add report");
    }
  };

  const handleEdit = async () => {
    if (!isEditFormValid()) {
      toast.error("Please fill in all fields!");
      return;
    }

    try {
      // You'll need to implement updateReport in your hook
      await updateReport(editingRow.id, {
        nama: editingRow.nama,
        seamanCode: editingRow.seamanCode,
        seafarerCode: editingRow.seafarerCode,
      });
      toast.success("Report updated successfully!");
      setOpenEditDialog(false);
      setEditingRow(null);
      // Refresh the current page
      setPaginationRequest({ ...paginationRequest });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update report");
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setSelectedIds(new Set());
    }
    setIsEditMode(!isEditMode);
  };

  //  Toggle row selection (acts like checkbox but uses radio styling)
  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  //  Select all on current page
  const toggleSelectAll = () => {
    if (!paginationData?.data) return;
    
    const currentPageIds = paginationData.data.map(row => row.id);
    const allSelected = currentPageIds.every(id => selectedIds.has(id));
    
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      currentPageIds.forEach(id => newSelected.delete(id));
    } else {
      currentPageIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  //  Delete selected rows
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("No rows selected!");
      return;
    }
    try {
      for (const id of selectedIds) {
        await deleteReport(id);
      }
      toast.success("Selected reports deleted successfully!");
      setSelectedIds(new Set());
      setCurrentPage(1);
      setPaginationRequest({ ...paginationRequest, anchorId: 0, page: "next" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete selected reports");
    }
  }

  const handleRowClick = (row: any) => {
    if (isEditMode) {
      setEditingRow({ ...row });
      setOpenEditDialog(true);
    }
  };

  const getRowNumber = (index: number) => {
    return (currentPage - 1) * paginationRequest.pageSize + index + 1;
  };

  const isAllCurrentPageSelected = () => {
    if (!paginationData?.data) return false;
    return paginationData.data.every(row => selectedIds.has(row.id));
  };

  return (
    <div className="mt-8 p-4 m-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Master Table</h1>

        <div className="flex gap-2">
          <Button
            size="lg"
            variant={isEditMode ? "destructive" : "outline"}
            className="flex items-center gap-2"
            onClick={toggleEditMode}
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
              className="flex items-center gap-2"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
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
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <Input
                  placeholder="Name"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value.toUpperCase() })}
                />
                <Input
                  placeholder="Seaman Code"
                  value={form.seamanCode}
                  onChange={(e) => setForm({ ...form, seamanCode: e.target.value.toUpperCase() })}
                />
                <Input
                  placeholder="Seafarer Code"
                  value={form.seafarerCode}
                  onChange={(e) => setForm({ ...form, seafarerCode: e.target.value.toUpperCase() })}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
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
              onChange={(e) => setEditingRow({ ...editingRow, nama: e.target.value.toUpperCase() })}
            />
            <Input
              placeholder="Seaman Code"
              value={editingRow?.seamanCode || ""}
              onChange={(e) => setEditingRow({ ...editingRow, seamanCode: e.target.value.toUpperCase() })}
            />
            <Input
              placeholder="Seafarer Code"
              value={editingRow?.seafarerCode || ""}
              onChange={(e) => setEditingRow({ ...editingRow, seafarerCode: e.target.value.toUpperCase() })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOpenEditDialog(false);
              setEditingRow(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!isEditFormValid()}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by Name or Seafarer Code.."
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setCurrentPage(1);
          }}
          className="w-[250px]"
        />
      </div>

      <div className={`transition-opacity duration-300 ${onCallApi ? "opacity-70" : "opacity-100"}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {isEditMode && (
                <TableHead className="text-center w-[50px]">
                  {/* Select All button styled as radio */}
                  <button
                    onClick={toggleSelectAll}
                    className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 inline-flex items-center justify-center"
                  >
                    {isAllCurrentPageSelected() && (
                      <div className="h-2.5 w-2.5 rounded-full bg-current" />
                    )}
                  </button>
                </TableHead>
              )}
              {TABLE_COLUMNS.map((col, index) => (
                <TableHead key={index} className="text-center">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {onCallApi ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMNS.length + (isEditMode ? 1 : 0)} className="text-center text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginationData?.data?.length ? (
              paginationData.data.map((row, i) => (
                <TableRow 
                  key={row.id} 
                  className={`${selectedIds.has(row.id) ? "bg-blue-50" : ""} ${isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={() => handleRowClick(row)}
                >
                  {isEditMode && (
                    <TableCell 
                      className="text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowSelection(row.id);
                      }}
                    >
                      {/* Radio button that acts like checkbox */}
                      <button
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center"
                      >
                        {selectedIds.has(row.id) && (
                          <div className="h-2.5 w-2.5 rounded-full bg-current" />
                        )}
                      </button>
                    </TableCell>
                  )}
                  <TableCell className="text-center">{getRowNumber(i)}</TableCell>
                  <TableCell className="text-center">{row.nama}</TableCell>
                  <TableCell className="text-center">{row.seamanCode}</TableCell>
                  <TableCell className="text-center">{row.seafarerCode}</TableCell>
                  <TableCell className="text-center">{row.vesselName}</TableCell>
                  <TableCell className="text-center">{row.jabatan}</TableCell>
                  <TableCell className="text-center">{row.idpProgram}</TableCell>
                  <TableCell className="text-center">{row.age}</TableCell>
                  <TableCell className="text-center">{row.certificate}</TableCell>
                  <TableCell className="text-center">{row.konditeReview}</TableCell>
                  <TableCell className="text-center">{row.kpiVessel}</TableCell>
                  <TableCell className="text-center">{row.performanceScore}</TableCell>
                  <TableCell className="text-center">{row.valueAssessment}</TableCell>
                  <TableCell className="text-center">{row.competencyGapAnalysis}</TableCell>
                  <TableCell className="text-center">{row.totalGap}</TableCell>
                  <TableCell className="text-center">{row.strength}</TableCell>
                  <TableCell className="text-center">{row.havQuadran}</TableCell>
                  <TableCell className="text-center">{row.talentClassified}</TableCell>
                  <TableCell className="text-center">{row.readiness}</TableCell>
                  <TableCell className="text-center">{row.certificateEligible}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMNS.length + (isEditMode ? 1 : 0)} className="text-center text-gray-400">
                  No Data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mb-4 p-4">
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

        <span className="text-sm text-gray-600">
          Showing {paginationRequest.pageSize} rows per page | Page {currentPage}
          {isEditMode && selectedIds.size > 0 && ` | ${selectedIds.size} selected`}
        </span>
      </div>

      <Pagination className="m-4">
        <PaginationContent className="flex justify-items-center w-full">
          <PaginationItem>
            <Button
              disabled={!paginationData || paginationData.firstPage || onCallApi}
              onClick={() => navigatePage("prev")}
              className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon /> Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              disabled={!paginationData?.hasMore || onCallApi}
              onClick={() => navigatePage("next")}
              className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed"
            >
              Next <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}