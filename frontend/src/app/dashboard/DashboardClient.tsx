"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import CardCompetence from "@/components/card-competence";
import { IReport, IPaginationRequest, PageType } from "@/types/global-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/skeleton-card";
import { useGetIdpCount, useGetReports } from "./_hooks/useReports";
import { useBatches } from "../master-report/_hooks/useBatch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Batch } from "../master-report/_hooks/useBatch";
import { useDebounce } from "use-debounce";

const PAGE_SIZES = [10, 20, 50, 100];

export default function DashboardClient() {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 500);

  // Pagination request state
  const [paginationRequest, setPaginationRequest] = useState<IPaginationRequest>({
    anchorId: 0,
    page: "next",
    pageSize: 10,
    filter: "",
    batchId: undefined,
  });

  // Reset pagination when search query changes
  useEffect(() => {
    setPaginationRequest((prev) => ({
      ...prev,
      anchorId: 0,
      page: "next",
      query: debouncedQuery || undefined,
    }));
  }, [debouncedQuery]);

  // React Query hooks for fetching data
  const { data: idpCountData, error: idpCountError } = useGetIdpCount(paginationRequest.batchId, debouncedQuery);
  const { batches: batchData } = useBatches();

  const {
    data: paginationData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useGetReports(paginationRequest);

  // Determine FDP, MDP, SDP counts from React Query data
  const fdp = idpCountData?.fdp ?? null;
  const mdp = idpCountData?.mdp ?? null;
  const sdp = idpCountData?.sdp ?? null;

  // Debug: Log data states
  console.log("paginationData:", paginationData);
  console.log("reportsLoading:", reportsLoading);
  console.log("reportsError:", reportsError);
  console.log("paginationRequest:", paginationRequest);

  // Show error notification if IDP count fetch fails
  if (idpCountError) {
    toast.error("Failed to fetch competence counts");
  }

  // Show error notification if reports fetch fails
  if (reportsError) {
    toast.error((reportsError as Error).message || "Failed to fetch reports data");
  }

  // Pagination navigation
  const navigatePage = (page: PageType) => {
    if (!paginationData) return;
    setPaginationRequest({
      ...paginationRequest,
      page: page,
      anchorId: page == "next" ? paginationData?.last_id : paginationData?.first_id,
    });
  };

  // Navigate to talent profile detail page
  const handleRowClick = (report: IReport) => {
    router.push(`/dashboard/${report.seafarerCode}`);
  };

  return (
    <>
      {/* GRID: FDP/MDP/SDP */}
      <div className="grid grid-cols-3 gap-x-4 my-6 mb-8">
        {fdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="FDP"
            count={fdp}
            onClick={() =>
              setPaginationRequest({
                ...paginationRequest,
                filter: "FDP",
                anchorId: 0,
              })
            }
            disabled={reportsLoading}
          />
        )}

        {mdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="MDP"
            count={mdp}
            onClick={() =>
              setPaginationRequest({
                ...paginationRequest,
                filter: "MDP",
                anchorId: 0,
              })
            }
            disabled={reportsLoading}
          />
        )}

        {sdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="SDP"
            count={sdp}
            onClick={() =>
              setPaginationRequest({
                ...paginationRequest,
                filter: "SDP",
                anchorId: 0,
              })
            }
            disabled={reportsLoading}
          />
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <Select
              value={paginationRequest.pageSize.toString()}
              onValueChange={(val) => {
                const size = parseInt(val);
                setPaginationRequest({
                  ...paginationRequest,
                  pageSize: size,
                  anchorId: 0,
                  page: "next",
                });
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">Halaman</span>
          </div>

          {/* Batch Selector */}
          <div className="flex items-center gap-2">
            <Select
              value={paginationRequest.batchId?.toString() || "all"}
              onValueChange={(val) => {
                const bId = val === "all" ? undefined : val === "none" ? -1 : parseInt(val);
                setPaginationRequest({
                  ...paginationRequest,
                  batchId: bId,
                  anchorId: 0,
                  page: "next",
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Batch</SelectItem>
                <SelectItem value="none">Tanpa Batch</SelectItem>
                {batchData?.map((batch: Batch) => (
                  <SelectItem key={batch.id} value={batch.id.toString()}>
                    Batch {batch.batchNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">Batch</span>
          </div>
        </div>

        {/* Search Bar — right side */}
        <Input
          placeholder="Search by Name or Seafarer Code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[280px] bg-white shadow-sm"
        />
      </div>

      {/* TABLE */}
      <div className="grid grid-cols-1 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Seafarer Code</TableHead>
              <TableHead className="text-center">Nama Talent</TableHead>
              <TableHead className="text-center">Rank</TableHead>
              <TableHead className="text-center">Program</TableHead>
              <TableHead className="text-center">Talent Readiness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : reportsError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center font-bold text-red-500 py-8">
                  Error: {(reportsError as Error).message}
                </TableCell>
              </TableRow>
            ) : paginationData?.results && paginationData.results.length > 0 ? (
              paginationData.results.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleRowClick(report)}
                >
                  <TableCell className="text-center font-bold">{report.seafarerCode}</TableCell>
                  <TableCell className="text-center">{report.nama}</TableCell>
                  <TableCell className="text-center">{report.jabatan}</TableCell>
                  <TableCell className="text-center">{report.idpProgram}</TableCell>
                  <TableCell className="text-center">
                    {report.totalReadinessUpdateMonths + " Months"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={14} className="text-center font-bold text-gray-400">
                  No Data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination className="mt-6">
        <PaginationContent className="flex justify-between w-full">
          <PaginationItem>
            <Button
              className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed"
              disabled={paginationData?.first_page}
              onClick={() => navigatePage("prev")}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed"
              disabled={!paginationData?.has_more}
              onClick={() => navigatePage("next")}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
