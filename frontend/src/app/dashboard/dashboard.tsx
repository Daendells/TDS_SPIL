"use client";

import { useState, useEffect } from "react";
import ProfilingDialog from "@/components/profiling-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
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
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import CardCompetence from "@/components/card-competence";
import {
  IPaginationData,
  IPaginationRequest,
  IReport,
  PageType,
} from "@/types/global-types";
import { Button } from "@/components/ui/button";
import { cn, parsePaginationData, parseReports } from "@/lib/utils";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/skeleton-card";
import { useApi } from "@/hooks/use-api";

const PAGE_SIZES = [10, 20, 50, 100];

export default function Dashboard() {
  const [onCallApi, setOnCallApi] = useState<boolean>(false);
  const api = useApi();

  const [mdp, setMdp] = useState<number | null>(null);
  const [fdp, setFdp] = useState<number | null>(null);
  const [sdp, setSdp] = useState<number | null>(null);

  // Pagination Data
  const [paginationData, setPaginationData] =
    useState<IPaginationData<IReport> | null>(null);

  // PageSize
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);

  // Profiling Dialog
  const [openProfiling, setOpenProfiling] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IReport | null>(null);

  // Pagination Mechanism
  const [paginationRequest, setPaginationRequest] =
    useState<IPaginationRequest>({
      anchorId: 0,
      page: "next",
      pageSize: pageSize,
      filter: "",
    });

  // Fetch IDP Count
  useEffect(() => {
    const fetchIdp = async () => {
      try {
        const response = await api.get("/reports/idp-count");
        const data = response.data.data;
        setMdp(data.mdp);
        setFdp(data.fdp);
        setSdp(data.sdp);
      } catch (err) {
        toast.error((err as any).response?.data.error);
      }
    };
    fetchIdp();
  }, []);

  // Fetch reports data
  useEffect(() => {
    const fetchData = async () => {
      setOnCallApi(true);
      const params = new URLSearchParams({
        anchor_id: paginationRequest.anchorId!.toString(),
        page: paginationRequest.page,
        page_size: paginationRequest.pageSize.toString(),
      });

      if (paginationRequest.filter) {
        params.set("filter", paginationRequest.filter);
      }

      try {
        const response = await api.get(`/reports?${params.toString()}`);
        let data = response.data.data;
        console.log(data);
        setPaginationData(parsePaginationData<IReport>(data, parseReports));
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setOnCallApi(false);
      }
    };
    fetchData();
  }, [paginationRequest]);

  const navigatePage = (page: PageType) => {
    if (!paginationData) return;
    setPaginationRequest({
      ...paginationRequest,
      page: page,
      anchorId:
        page == "next" ? paginationData?.lastId : paginationData?.firstId,
    });
  };

  const handleRowClick = (report: IReport) => {
    console.log(report);
    setSelectedReport(report);
    setOpenProfiling(true);
  };

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-3 gap-x-4 my-6 mb-8">
        {fdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="FDP"
            count={fdp!}
            onClick={() =>
              setPaginationRequest({
                ...paginationRequest,
                filter: "FDP",
                anchorId: 0,
              })
            }
            disabled={onCallApi}
          />
        )}

        {mdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="MDP"
            count={mdp!}
            onClick={() =>
              setPaginationRequest({
                ...paginationRequest,
                filter: "MDP",
                anchorId: 0,
              })
            }
            disabled={onCallApi}
          />
        )}

        {sdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="SDP"
            count={sdp!}
            onClick={() =>
              setPaginationRequest({
                ...paginationRequest,
                filter: "SDP",
                anchorId: 0,
              })
            }
            disabled={onCallApi}
          />
        )}
      </div>

      {/* Page Size */}
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
              <TableHead className="text-center">Seaman Code</TableHead>
              <TableHead className="text-center">Nama Talent</TableHead>
              <TableHead className="text-center">Rank</TableHead>
              <TableHead className="text-center">Program</TableHead>
              <TableHead className="text-center">Talent Readiness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginationData?.data && paginationData.data.length > 0 ? (
              paginationData.data.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleRowClick(report)}
                >
                  <TableCell className="text-center font-bold">
                    {report.seamanCode}
                  </TableCell>
                  <TableCell className="text-center">{report.nama}</TableCell>
                  <TableCell className="text-center">{report.jabatan}</TableCell>
                  <TableCell className="text-center">{report.idpProgram}</TableCell>
                  <TableCell className="text-center">{report.readiness}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="text-center font-bold text-gray-400"
                >
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
              disabled={paginationData?.firstPage}
              onClick={() => navigatePage("prev")}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed"
              disabled={!paginationData?.hasMore}
              onClick={() => navigatePage("next")}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Profiling Modal */}
      {selectedReport && (
        <ProfilingDialog
          open={openProfiling}
          setOpen={setOpenProfiling}
          report={selectedReport}
        />
      )}
    </>
  );
}