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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IData {
  id: number;
  vesselName: string;
  nama: string;
  jabatan: string;
  konditeReview: number;
  kpiVessel: number;
  performaceScore: number;
  valueAssessment: number;
  assessmentCenter: number;
  havQuadran: string;
  havMapping: string;
  competencyGapAnalysis: string;
  idpProgram: string;
}

interface IPaginationData<T> {
  data: T[];
  firstId: number;
  lastId: number;
  pageSize: number;
  hasMore: boolean;
  firstPage: boolean;
}

const pageSizes = [10, 20, 50, 100];

export default function Dashboard() {
  const [onCallApi, setOnCallApi] = useState(false);
  const [mdp, setMdp] = useState(10);
  const [fdp, setFdp] = useState(10);
  const [sdp, setSdp] = useState(10);

  // PageSize
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);

  const callApi = async () => {
    setOnCallApi(true);
    setInterval(() => {
      setOnCallApi(false);
    }, 2000);
  };

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-3 gap-x-4 my-6 mb-8">
        {/* MDP */}
        <CardCompetence
          title="MDP"
          count={mdp}
          onClick={callApi}
          disabled={onCallApi}
        />
        {/* FDP */}
        <CardCompetence
          title="FDP"
          count={fdp}
          onClick={() => console.log("TEST")}
          disabled={onCallApi}
        />
        {/* SDP */}
        <CardCompetence
          title="SDP"
          count={sdp}
          onClick={() => console.log("TEST")}
          disabled={onCallApi}
        />
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
                  {pageSizes.map((size) => (
                    <CommandItem
                      key={size}
                      value={size.toString()}
                      onSelect={(currentValue) => {
                        setPageSize(parseInt(currentValue));
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
              <TableHead>Vessel Name</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Kondite Review</TableHead>
              <TableHead>KPI Vessel</TableHead>
              <TableHead>Performance Score</TableHead>
              <TableHead>Value Assessment</TableHead>
              <TableHead>Assessment Center</TableHead>
              <TableHead>Potential Score</TableHead>
              <TableHead>HAV Quadran</TableHead>
              <TableHead>HAV Maping</TableHead>
              <TableHead>Competency Gap Analysis</TableHead>
              <TableHead>Talent Classified</TableHead>
              <TableHead>IDP Program</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* <TableRow>
            <TableCell className="font-medium">INV001</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>Credit Card</TableCell>
            <TableCell className="text-right">$250.00</TableCell>
          </TableRow> */}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination className="mt-6">
        <PaginationContent className="flex justify-between w-full">
          <PaginationItem>
            <Button className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed">
              <ChevronLeftIcon />
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button className="cursor-pointer transition duration-300 active:scale-95 disabled:cursor-not-allowed">
              Next
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
