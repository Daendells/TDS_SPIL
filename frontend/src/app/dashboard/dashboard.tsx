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

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import CardCompetence from "@/components/card-competence";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [onCallApi, setOnCallApi] = useState(false);

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
          count={10}
          onClick={callApi}
          disabled={onCallApi}
        />
        {/* FDP */}
        <CardCompetence
          title="FDP"
          count={10}
          onClick={() => console.log("TEST")}
          disabled={onCallApi}
        />
        {/* SDP */}
        <CardCompetence
          title="SDP"
          count={10}
          onClick={() => console.log("TEST")}
          disabled={onCallApi}
        />
      </div>

      {/* TABLE */}
      <div className="grid grid-cols-1 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vessel Name</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>IDP Program</TableHead>
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
