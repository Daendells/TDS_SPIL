"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useDISCAnalytics } from "./_hooks/useDISCAnalytics";
import { PersonalCandidateDossier } from "./components/PersonalCandidateDossier";
import { FleetPopulationAnalytics } from "./components/FleetPopulationAnalytics";
import { CandidateComparisonView } from "./components/CandidateComparisonView";
import { CandidateExplorerTable } from "./components/CandidateExplorerTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  RefreshCw,
  User2,
  Users,
  Scale,
  Database,
  CloudDownload,
  Info,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

type ActiveTab = "dossier" | "population" | "comparison" | "table";

const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1Jf9IhudkzSg0HNuB7t4dBgWpGuiQvNbe2Xtu_nbJCqc/export?format=csv&gid=1701811227";

export default function SpreadsheetAnalyticsPage() {
  const searchParams = useSearchParams();
  const {
    candidates,
    sourceTitle,
    summary,
    selectedCandidate,
    setSelectedCandidate,
    comparisonCandidate,
    setComparisonCandidate,
    isLoading,
    isUploading,
    uploadCSVFile,
    syncGoogleSheet,
    connectGoogleAccount,
    resetToRealDataset,
  } = useDISCAnalytics();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dossier");
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(DEFAULT_SHEET_URL);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState<boolean>(false);
  const [hasGoogleToken, setHasGoogleToken] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("google_access_token");
      setHasGoogleToken(!!token);
    }

    if (searchParams.get("google_auth") === "success") {
      toast.success("Akun Google SPIL terhubung! Menjalankan sinkronisasi data...");
      syncGoogleSheet(DEFAULT_SHEET_URL);
    }
  }, [searchParams, syncGoogleSheet]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadCSVFile(file, "incremental");
    } catch {
      // Handled in hook
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleTriggerSheetSync = async () => {
    if (!sheetUrlInput.trim()) {
      toast.error("Silakan masukkan URL Google Spreadsheet.");
      return;
    }
    try {
      await syncGoogleSheet(sheetUrlInput.trim());
      setIsSyncDialogOpen(false);
    } catch {
      // Handled in hook
    }
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
              Analisis Hasil Psikometri DISC Rekrutmen PT SPIL ({candidates.length} Kandidat) • Source: <strong className="text-slate-700">{sourceTitle}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Sync Google Spreadsheet Dialog */}
          <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isUploading || isLoading}
                className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <CloudDownload className={`w-3.5 h-3.5 text-slate-700 ${isUploading ? "animate-spin" : ""}`} />
                Sync Google Sheets
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CloudDownload className="w-4 h-4 text-slate-700" />
                  Live Sync Google Spreadsheet DISC
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Sinkronisasi database dengan sheet Google Spreadsheet online secara otomatis (hanya menambah/memperbarui data berdasarkan NIK & Timestamp).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    URL Google Spreadsheet (Share Link atau CSV Export):
                  </label>
                  <Input
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..."
                    className="text-xs h-8 font-mono bg-slate-50"
                  />
                </div>

                {/* Google OAuth Status / Connect Button */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      Status Otorisasi Akun Google:
                    </span>
                    {hasGoogleToken ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Terhubung
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Belum login</span>
                    )}
                  </div>

                  {!hasGoogleToken && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => connectGoogleAccount()}
                      className="w-full text-xs h-7.5 border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5"
                    >
                      <Image
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        width={14}
                        height={14}
                      />
                      Hubungkan Akun Google SPIL (Untuk Sheet Private)
                    </Button>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    Panduan Sinkronisasi:
                  </div>
                  <p>
                    Jika sheet bersifat privat internal, hubungkan akun Google Anda di atas agar server memiliki izin membaca spreadsheet secara otomatis.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSyncDialogOpen(false)}
                  className="text-xs h-8"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  disabled={isUploading}
                  onClick={handleTriggerSheetSync}
                  className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
                >
                  <CloudDownload className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`} />
                  {isUploading ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Upload File Input */}
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
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Upload className={`w-3.5 h-3.5 text-slate-700 ${isUploading ? "animate-spin" : ""}`} />
            {isUploading ? "Mengunggah..." : "Upload CSV Baru"}
          </Button>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => resetToRealDataset()}
            className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${isLoading ? "animate-spin" : ""}`} />
            Reset 582
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
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-800 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700">Memuat data asesmen psikometri dari database...</p>
          <p className="text-xs text-slate-400 mt-1">Mengambil kalkulasi populasi batch rekrutmen</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
