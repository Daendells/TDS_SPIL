"use client";

import { useState, useMemo } from "react";
import { SpreadsheetRow } from "../_data/preloadedData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Database,
  Printer,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DataExplorerTableProps {
  data: SpreadsheetRow[];
  sourceName: string;
}

export function DataExplorerTable({ data, sourceName }: DataExplorerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vessel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === "ALL" || item.department === selectedDept;
      const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [data, searchTerm, selectedDept, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Nama", "Rank", "Departemen", "Kapal", "Skor", "Status", "Tanggal", "Catatan"];
      const rows = filteredData.map((d) => [
        d.id,
        `"${d.name.replace(/"/g, '""')}"`,
        `"${d.rank.replace(/"/g, '""')}"`,
        d.department,
        `"${d.vessel.replace(/"/g, '""')}"`,
        d.score,
        `"${d.status}"`,
        d.date,
        `"${(d.notes || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SPIL_Maritime_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data berhasil diexport ke format CSV!");
    } catch {
      toast.error("Gagal mengekspor data.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: SpreadsheetRow["status"]) => {
    switch (status) {
      case "Sangat Baik":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">Sangat Baik</Badge>;
      case "Baik":
        return <Badge className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50 text-xs">Baik</Badge>;
      case "Cukup":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-xs">Cukup</Badge>;
      case "Perlu Pembinaan":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 text-xs">Perlu Pembinaan</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getDeptBadge = (dept: string) => {
    switch (dept) {
      case "DECK":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">DECK</span>;
      case "ENGINE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200">ENGINE</span>;
      case "CATERING":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">CATERING</span>;
      case "TRAINEE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200">TRAINEE</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">GENERAL</span>;
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-700" />
              Interactive Data Explorer & Tabular Summary
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sumber Data: <strong className="text-slate-700">{sourceName}</strong> ({filteredData.length} records)
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama pelaut, jabatan, kapal..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 h-8 text-xs border-slate-200"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">Semua Departemen (All)</option>
              <option value="DECK">DECK</option>
              <option value="ENGINE">ENGINE</option>
              <option value="CATERING">CATERING</option>
              <option value="TRAINEE">TRAINEE</option>
              <option value="GENERAL">GENERAL</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">Semua Kategori Status</option>
              <option value="Sangat Baik">Sangat Baik (≥85)</option>
              <option value="Baik">Baik (70 - 84)</option>
              <option value="Cukup">Cukup (55 - 69)</option>
              <option value="Perlu Pembinaan">Perlu Pembinaan (&lt;55)</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-700 w-24">ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Nama Personel</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Rank / Posisi</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Departemen</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Armada Kapal</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-center">Indeks Skor</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Catatan Evaluasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => (
                  <TableRow key={row.id || idx} className="hover:bg-slate-50/60 border-b border-slate-100">
                    <TableCell className="text-xs font-mono font-medium text-slate-600">{row.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900">{row.name}</TableCell>
                    <TableCell className="text-xs text-slate-700">{row.rank}</TableCell>
                    <TableCell className="text-xs">{getDeptBadge(row.department)}</TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">{row.vessel}</TableCell>
                    <TableCell className="text-xs text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-xs ${
                        row.score >= 85
                          ? "bg-emerald-100 text-emerald-800"
                          : row.score >= 70
                          ? "bg-sky-100 text-sky-800"
                          : row.score >= 55
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {row.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{getStatusBadge(row.status)}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate" title={row.notes}>
                      {row.notes}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada data yang sesuai dengan kriteria filter atau pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Menampilkan {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0 border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0 border-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
