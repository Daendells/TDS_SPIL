"use client";

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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, parsePaginationData, parseReports } from "@/lib/utils";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/skeleton-card";
import { useApi } from "@/hooks/use-api";

const PAGE_SIZES = [10, 20, 50, 100];

export default function Dashboard() {
  const [onCallApi, setOnCallApi] = useState<boolean>(false);
  // const [filter, setFilter] = useState<FilterType>("");
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

  // Pagination Mechanism
  const [paginationRequest, setPaginationRequest] =
    useState<IPaginationRequest>({
      anchorId: 0,
      page: "next",
      pageSize: pageSize,
      filter: "",
    });

  // TODO: Get IDP Count
  useEffect(() => {
    const fetchIdp = async () => {
      try {
        // const response = await fetch(
        //   "http://localhost:8080/reports/idp-count",
        //   {
        //     method: "GET",
        //   }
        // );

        const response = await api.get("/reports/idp-count");

        // const { data } = await response.json();
        const data = response.data.data;
        setMdp(data.mdp);
        setFdp(data.fdp);
        setSdp(data.sdp);

        console.log(data);
      } catch (err) {
        toast.error((err as any).response?.data.error);
      }
    };

    fetchIdp();
  }, []);

  // TODO: Fetch data with Filter
  useEffect(() => {
    const fetchData = async () => {
      setOnCallApi(true); // Disable filter buttons

      const params = new URLSearchParams({
        anchor_id: paginationRequest.anchorId!.toString(),
        page: paginationRequest.page,
        page_size: paginationRequest.pageSize.toString(),
      });

      // If there is a filter
      if (paginationRequest.filter) {
        params.set("filter", paginationRequest.filter);
      }

      try {
        const response = await api.get(`/reports?${params.toString()}`);

        let data = response.data.data;

        // TODO: Parse the response into PaginationData with type of IReport
        setPaginationData(parsePaginationData<IReport>(data, parseReports));
      } catch (err) {
        console.log(err);
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

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-3 gap-x-4 my-6 mb-8">
        {/* FDP */}
        {fdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="FDP"
            count={fdp!}
            onClick={() =>
              setPaginationRequest({ ...paginationRequest, filter: "FDP" })
            }
            disabled={onCallApi}
          />
        )}
        {/* MDP */}
        {mdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="MDP"
            count={mdp!}
            onClick={() =>
              setPaginationRequest({ ...paginationRequest, filter: "MDP" })
            }
            disabled={onCallApi}
          />
        )}
        {/* SDP */}
        {fdp === null ? (
          <SkeletonCard />
        ) : (
          <CardCompetence
            title="SDP"
            count={sdp!}
            onClick={() =>
              setPaginationRequest({ ...paginationRequest, filter: "SDP" })
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
                          // Reset the pagination
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
              <TableHead className="text-center">Vessel Name</TableHead>
              <TableHead className="text-center">Nama</TableHead>
              <TableHead className="text-center">Jabatan</TableHead>
              <TableHead className="text-center">Kondite Review</TableHead>
              <TableHead className="text-center">KPI Vessel</TableHead>
              <TableHead className="text-center">Performance Score</TableHead>
              <TableHead className="text-center">Value Assessment</TableHead>
              <TableHead className="text-center">Assessment Center</TableHead>
              <TableHead className="text-center">Potential Score</TableHead>
              <TableHead className="text-center">HAV Quadran</TableHead>
              <TableHead className="text-center">HAV Maping</TableHead>
              <TableHead className="text-center">
                Competency Gap Analysis
              </TableHead>
              <TableHead className="text-center">Talent Classified</TableHead>
              <TableHead className="text-center">IDP Program</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginationData?.data && paginationData.data.length > 0 ? (
              paginationData.data.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="text-center font-bold">
                    {report.vesselName}
                  </TableCell>
                  <TableCell>{report.nama}</TableCell>
                  <TableCell>{report.jabatan}</TableCell>
                  <TableCell className="text-center">
                    {report.konditeReview}
                  </TableCell>
                  <TableCell className="text-center">
                    {report.kpiVessel}
                  </TableCell>
                  <TableCell className="text-center">
                    {report.performanceScore}
                  </TableCell>
                  <TableCell className="text-center">
                    {report.valueAssessment}
                  </TableCell>
                  <TableCell className="text-center">
                    {report.assessmentCenter}
                  </TableCell>
                  <TableCell className="text-center">
                    {report.potentialScore}
                  </TableCell>
                  <TableCell className="text-center">
                    {report.havQuadran}
                  </TableCell>
                  <TableCell>{report.havMapping}</TableCell>
                  <TableCell>{report.competencyGapAnalysis}</TableCell>
                  <TableCell>{report.talentClassified}</TableCell>
                  <TableCell>{report.idpProgram}</TableCell>
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
    </>
  );
}
