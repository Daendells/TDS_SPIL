"use client";

import { useRef } from "react";
import Image from "next/image";
import { useDISCAnalytics } from "./_hooks/useDISCAnalytics";
import { DISCExecutiveCards } from "./components/DISCExecutiveCards";
import { DISCCharts } from "./components/DISCCharts";
import { PsychogramDetailCard } from "./components/PsychogramDetailCard";
import { CandidateExplorerTable } from "./components/CandidateExplorerTable";
import { Button } from "@/components/ui/button";
import { Upload, RefreshCw, Sparkles, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export default function SpreadsheetAnalyticsPage() {
  const {
    candidates,
    sourceTitle,
    summary,
    selectedCandidate,
    setSelectedCandidate,
    isLoading,
    loadCustomCSV,
    resetToRealDataset,
  } = useDISCAnalytics();

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

  return (
    <div className="space-y-6 pb-12">
      {/* ── TOP ACTION BAR (Clean SPIL Header inside Dashboard) ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-white">
                DISC Maritime Profiler
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Analisis Hasil Tes Psikologi & Profil Kepribadian Rekrutmen PT SPIL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-700" />
            Unggah File CSV Baru
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToRealDataset}
            className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
            Reset Dataset (582)
          </Button>
        </div>
      </div>

      {/* ── MAIN CONTENT SECTIONS ─────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Section 1: Executive KPI Overview & Narrative Summary */}
        <section>
          <DISCExecutiveCards summary={summary} />
        </section>

        {/* Section 2: Visual Analytics & Distribution Charts */}
        <section>
          <DISCCharts summary={summary} />
        </section>

        {/* Section 3: Deep-Dive Candidate Psychogram Inspector */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Kartu Psikogram & Analisis Profil Mendalam (Candidate Psychogram Inspector)
            </h3>
          </div>
          <PsychogramDetailCard candidate={selectedCandidate} />
        </section>

        {/* Section 4: Data Explorer & Filterable Candidate Table */}
        <section>
          <CandidateExplorerTable
            candidates={candidates}
            selectedCandidateId={selectedCandidate?.id || null}
            onSelectCandidate={setSelectedCandidate}
            sourceTitle={sourceTitle}
          />
        </section>
      </div>
    </div>
  );
}
