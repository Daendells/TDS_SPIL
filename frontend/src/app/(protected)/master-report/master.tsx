"use client";

import * as React from "react";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
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
  } = useMasterReports(10);

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    vesselName: "",
    nama: "",
    jabatan: "",
    seamanCode: "",
    seafarerCode: "",
    certificate: "",
  });
  const {createReport} = useMasterReports();

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

  const navigatePage = (page: "prev" | "next") => {
    if (!paginationData) return;
    setPaginationRequest({
      ...paginationRequest,
      page,
      anchorId: page === "next" ? paginationData.lastId : paginationData.firstId,
    });
  };

  const handleAdd = async () => {
    try {
      await createReport(form); // ✅ cleaner
      setOpenDialog(false);
      // Reload data after insert
      setPaginationRequest({ ...paginationRequest, anchorId: 0, page: "next" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to add report");
    }
  };

  return (
    <div className="mt-8 p-6 m-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Master Report</h1>

        {/* ADD BUTTON */}
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
                placeholder="Vessel Name"
                value={form.vesselName}
                onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
              />
              <Input
                placeholder="Name"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
              <Input
                placeholder="Position"
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              />
              <Input
                placeholder="Seaman Code"
                value={form.seamanCode}
                onChange={(e) => setForm({ ...form, seamanCode: e.target.value })}
              />
              <Input
                placeholder="Seafarer Code"
                value={form.seafarerCode}
                onChange={(e) => setForm({ ...form, seafarerCode: e.target.value })}
              />
              <Input
                placeholder="Certificate"
                value={form.certificate}
                onChange={(e) => setForm({ ...form, certificate: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH INPUT */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by Name or Seafarer Code.."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-[250px]"
        />
      </div>

      {/* TABLE */}
      <div className={`overflow-auto border rounded-md transition-opacity ${onCallApi ? "opacity-70" : "opacity-100"}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {TABLE_COLUMNS.map((col, index) => (
                <TableHead key={index} className="text-center">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
    {paginationData?.data?.map((row, i) => (
      <TableRow key={row.id}>
        <TableCell className="text-center">{i + 1}</TableCell>
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
    ))}
  </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
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
