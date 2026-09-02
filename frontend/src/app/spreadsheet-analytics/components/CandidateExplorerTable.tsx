"use client";

import { useState, useMemo } from "react";
import { DISCCandidate } from "../_data/discDataset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface CandidateExplorerTableProps {
  candidates: DISCCandidate[];
  selectedCandidateId: string | null;
  onSelectCandidate: (candidate: DISCCandidate) => void;
  sourceTitle: string;
}

export function CandidateExplorerTable({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  sourceTitle,
}: CandidateExplorerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDominant, setSelectedDominant] = useState<string>("ALL");
  const [selectedConsistency, setSelectedConsistency] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered Candidates
  const filteredData = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        searchTerm === "" ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.traitM.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descWords.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDominant = selectedDominant === "ALL" || c.dominantType === selectedDominant;
      const matchConsistency =
        selectedConsistency === "ALL" ||
        (selectedConsistency === "CONSISTENT" && (c.consistency.includes("Consistent") || c.consistency.includes("SC"))) ||
        (selectedConsistency === "INCONSISTENT" && !c.consistency.includes("Consistent") && !c.consistency.includes("SC"));

      return matchSearch && matchDominant && matchConsistency;
    });
  }, [candidates, searchTerm, selectedDominant, selectedConsistency]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Nama Lengkap", "NIK", "Email", "Tanggal", "Tipe Dominan", "Pola Trait M", "Pola Trait L", "Konsistensi", "Kata Kunci Karakter"];
      const rows = filteredData.map((d) => [
        d.id,
        `"${d.name.replace(/"/g, '""')}"`,
        `"${d.nik.replace(/"/g, '""')}"`,
        `"${d.email.replace(/"/g, '""')}"`,
        d.date,
        d.dominantType,
        `"${d.traitM.replace(/"/g, '""')}"`,
        `"${d.traitL.replace(/"/g, '""')}"`,
        `"${d.consistency.replace(/"/g, '""')}"`,
        `"${(d.descWords || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SPIL_DISC_Assessment_Resume_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Berhasil mengekspor ${filteredData.length} data kandidat ke CSV!`);
    } catch {
      toast.error("Gagal mengekspor data.");
    }
  };

  const getDominantBadge = (type: string) => {
    switch (type) {
      case "D":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">D (Dominance)</span>;
      case "I":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">I (Influence)</span>;
      case "S":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">S (Steadiness)</span>;
      case "C":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">C (Compliance)</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-700" />
              Daftar Rekapitulasi Asesmen Kandidat (Assessment Resume)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Dataset: <strong className="text-slate-700">{sourceTitle}</strong> ({filteredData.length} kandidat ditemukan)
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
              Export CSV ({filteredData.length})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama, NIK, email, pola trait..."
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
              value={selectedDominant}
              onChange={(e) => {
                setSelectedDominant(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">Semua Dimensi Dominan (All D-I-S-C)</option>
              <option value="D">Dominance (D - Tegas & Hasil)</option>
              <option value="I">Influence (I - Komunikasi & Antusias)</option>
              <option value="S">Steadiness (S - Sabar & Tenang)</option>
              <option value="C">Conscientiousness (C - Teliti & Akurat)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedConsistency}
              onChange={(e) => {
                setSelectedConsistency(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">Semua Status Konsistensi</option>
              <option value="CONSISTENT">Hanya Konsisten (Still Consistent)</option>
              <option value="INCONSISTENT">Inkonsisten (Perlu Konfirmasi)</option>
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
                <TableHead className="text-xs font-semibold text-slate-700">Nama Kandidat</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">NIK / Identitas</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Tipe Dominan</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Pola Trait</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Konsistensi</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Kata Kunci Karakter</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((c) => {
                  const isSelected = selectedCandidateId === c.id;
                  return (
                    <TableRow
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${
                        isSelected ? "bg-slate-100/80 font-medium" : ""
                      }`}
                    >
                      <TableCell className="text-xs font-mono font-medium text-slate-600">{c.id}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">{c.name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{c.nik}</TableCell>
                      <TableCell className="text-xs">{getDominantBadge(c.dominantType)}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-slate-800">{c.traitM}</TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {c.consistency}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate" title={c.descWords}>
                        {c.descWords || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            onSelectCandidate(c);
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          className={`text-xs h-7 gap-1 ${
                            isSelected
                              ? "bg-slate-900 text-white hover:bg-slate-800"
                              : "border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isSelected ? "Sedang Dilihat" : "Lihat Profil"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada data kandidat yang cocok dengan kriteria filter.
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
            {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} kandidat
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
