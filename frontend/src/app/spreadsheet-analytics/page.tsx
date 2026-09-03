"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useDISCAnalytics } from "./_hooks/useDISCAnalytics";
import { PersonalCandidateDossier } from "./components/PersonalCandidateDossier";
import { FleetPopulationAnalytics } from "./components/FleetPopulationAnalytics";
import { CandidateComparisonView } from "./components/CandidateComparisonView";
import { CandidateExplorerTable } from "./components/CandidateExplorerTable";
import { Button } from "@/components/ui/button";
import {
  Upload,
  RefreshCw,
  User2,
  Users,
  Scale,
  Database,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

type ActiveTab = "dossier" | "population" | "comparison" | "table";

export default function SpreadsheetAnalyticsPage() {
  const {
    candidates,
    sourceTitle,
    summary,
    selectedCandidate,
    setSelectedCandidate,
    comparisonCandidate,
    setComparisonCandidate,
    isLoading,
    loadCustomCSV,
    resetToRealDataset,
  } = useDISCAnalytics();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dossier");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        loadCustomCSV(text, file.name);
        toast.success(`Berhasil memuat file: ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error("Gagal membaca file CSV.");
    };
    reader.readAsText(file);
  };

  const handleOpenComparison = (candidate: any) => {
    setSelectedCandidate(candidate);
    setActiveTab("comparison");
  };

  const handleFocusCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setActiveTab("dossier");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── TOP HEADER (Corporate SPIL Grey Theme & Controls) ────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-24 shrink-0">
            <Image
              src="/images/logo1.png"
              alt="PT SPIL Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="relative h-8 w-24 shrink-0">
            <Image
              src="/images/logo2.png"
              alt="Partner Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                SPM RECRUITMENT & DISC PSYCHOMETRIC ANALYTICS
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-white">
                DISC Profiler
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Analisis Hasil Psikometri DISC Rekrutmen PT SPIL ({candidates.length} Kandidat)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-700" />
            Upload CSV Baru
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetToRealDataset();
              toast.info("Memuat ulang 582 dataset asli kandidat rekrutmen SPIL.");
            }}
            className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
            Reset Dataset 582
          </Button>
        </div>
      </div>

      {/* ── VIEW SELECTOR TABS ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto py-1.5">
          <button
            onClick={() => setActiveTab("dossier")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === "dossier"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <User2 className="w-3.5 h-3.5" />
            Dossier & Analisis Personal
            {selectedCandidate && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeTab === "dossier" ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
              }`}>
                {selectedCandidate.name.split(" ")[0]}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("population")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === "population"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Populasi & Rekrutmen Batch
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeTab === "population" ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
            }`}>
              {candidates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === "comparison"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Komparasi 2 Kandidat (Head-to-Head)
          </button>

          <button
            onClick={() => setActiveTab("table")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === "table"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Data Explorer & Rekapitulasi
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
          <span>Mode:</span>
          <strong className="text-slate-800 capitalize">{activeTab} View</strong>
        </div>
      </div>

      {/* ── TAB CONTENT RENDERING ────────────────────────────────────────── */}
      {activeTab === "dossier" && (
        <PersonalCandidateDossier
          candidate={selectedCandidate}
          candidates={candidates}
          summary={summary}
          onSelectCandidate={setSelectedCandidate}
          onOpenComparison={handleOpenComparison}
        />
      )}

      {activeTab === "population" && (
        <FleetPopulationAnalytics summary={summary} />
      )}

      {activeTab === "comparison" && (
        <CandidateComparisonView
          candidates={candidates}
          candidateA={selectedCandidate}
          candidateB={comparisonCandidate}
          onSelectCandidateA={setSelectedCandidate}
          onSelectCandidateB={setComparisonCandidate}
          onFocusCandidate={handleFocusCandidate}
        />
      )}

      {activeTab === "table" && (
        <CandidateExplorerTable
          candidates={candidates}
          selectedCandidateId={selectedCandidate?.id || null}
          onSelectCandidate={setSelectedCandidate}
          onFocusCandidate={handleFocusCandidate}
          onCompareCandidate={handleOpenComparison}
          sourceTitle={sourceTitle}
        />
      )}
    </div>
  );
}
