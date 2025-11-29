"use client";

import { useState } from "react";
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
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon } from "lucide-react";
import CardCompetence from "@/components/card-competence";
import { IReport, IPaginationRequest, PageType } from "@/types/global-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/skeleton-card";
import { useGetIdpCount, useGetReports } from "./_hooks/useReports";

const PAGE_SIZES = [10, 20, 50, 100];

export default function DashboardClient() {
  const router = useRouter();

  // React Query hooks for fetching data
  const { data: idpCountData, error: idpCountError } = useGetIdpCount();

  // Pagination request state
  const [paginationRequest, setPaginationRequest] = useState<IPaginationRequest>({
    anchorId: 0,
    page: "next",
    pageSize: 10,
    filter: "",
  });

  // Fetch reports using React Query
  const {
    data: paginationData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useGetReports(paginationRequest);

  // Page size
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);

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

      {/* Page Size Selector */}
      <div className="mb-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[6.25rem] justify-between"
            >
              {pageSize}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[6.25rem] p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {PAGE_SIZES.map((size) => (
                    <CommandItem
                      key={size}
                      value={size.toString()}
                      onSelect={(currentValue) => {
                        setPageSize(parseInt(currentValue));
                        setPaginationRequest({
                          ...paginationRequest,
                          pageSize: parseInt(currentValue),
                          anchorId: 0,
                          page: "next",
                        });
                        setOpen(false);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          pageSize === size ? "opacity-100" : "opacity-0"
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
        <span className="ml-2">Pages</span>
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
