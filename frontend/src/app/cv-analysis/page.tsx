"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UploadCloud,
  FileText,
  User,
  Briefcase,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Info,
  Users,
  TrendingUp,
  Award,
  Ship,
  Sparkles,
  FileCheck,
  Search,
  Edit2,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import * as pdfjsLib from "pdfjs-dist";
import { useCandidateAnalysis, TargetRoleItem } from "./_hooks/useCandidateAnalysis";
import { useRoleAnalysis, CandidateItem } from "./_hooks/useRoleAnalysis";
import {
  useGetCVRoles,
  useCreateCVRole,
  useUpdateCVRole,
  useDeleteCVRole,
  CVRoleItem,
} from "./_hooks/useCVRoles";
import { useAuth } from "@/context/AuthContext";

// Configure pdfjs worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

// Fallback standar role perkapalan PT SPIL
const FALLBACK_SPIL_ROLES = [
  "ELECTRICIAN",
  "EXT. MASINIS I",
  "EXT. MASINIS II",
  "EXT. MUALIM I",
  "EXT. MUALIM II",
  "EXT. MUALIM III",
  "EXTRA KKM",
  "EXTRA NAKHODA",
  "FITTER",
  "JURU MASAK I",
  "JURU MASAK II",
  "JURU MINYAK",
  "JURU MUDI",
  "KADET DEK",
  "KADET ELECTRONIC",
  "KADET MESIN",
  "KELASI",
  "KKM",
  "MANDOR MESIN",
  "MARKONIS",
  "MASINIS I",
  "MASINIS II",
  "MASINIS III",
  "MASINIS IV",
  "MUALIM I",
  "MUALIM II",
  "MUALIM III",
  "MUALIM IV",
  "NAKHODA",
  "PELAYAN",
  "SERANG",
];

// Helper: Bersihkan nama file menjadi Nama Kandidat (misal: cv_pakbudi.pdf -> Pak Budi)
function formatCandidateNameFromFilename(filename: string): string {
  const clean = filename
    .replace(/\.[^.]+$/, "") // Hapus ekstensi .pdf
    .replace(/^cv[-_\s]*/i, "") // Hapus prefix cv_ atau cv-
    .replace(/[-_]/g, " ") // Ganti - dan _ dengan spasi
    .trim();
  if (!clean) return filename;
  return clean
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ── PDF Text Extractor (Backend Go API + Client Fallback) ───────────────────
async function extractCVTextFromFile(file: File): Promise<string> {
  // 1. Backend Go PDF Extractor Endpoint
  const formData = new FormData();
  formData.append("file", file);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081"}/api/pdf/extract`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.text && data.text.trim().length > 10) {
        return data.text.trim();
      }
    }
  } catch (err) {
    console.warn("Backend Go PDF extraction endpoint error, fallback to client pdfjs:", err);
  }

  // 2. Client-side pdfjs-dist fallback
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    let textPages: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      if (pageText.trim()) {
        textPages.push(pageText);
      }
    }

    const fullText = textPages.join("\n\n").trim();
    if (fullText.length > 20) {
      return fullText;
    }
  } catch (err) {
    console.warn("Client pdfjs text extraction fallback:", err);
  }

  // 3. Fallback terakhir
  return `Nama Kandidat: ${formatCandidateNameFromFilename(file.name)}\nDokumen: ${file.name}`;
}

// ── Score Badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 60
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {score}% Match
    </span>
  );
}

// ── Category Badge Helper ─────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const cat = (category || "GENERAL").toUpperCase();
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  if (cat === "DECK") colorClass = "bg-blue-100 text-blue-800 border-blue-200";
  else if (cat === "ENGINE") colorClass = "bg-amber-100 text-amber-800 border-amber-200";
  else if (cat === "CATERING") colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  else if (cat === "TRAINEE") colorClass = "bg-purple-100 text-purple-800 border-purple-200";

  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${colorClass}`}>
      {cat}
    </span>
  );
}

// ── FITUR 1: Candidate Analysis Tab ──────────────────────────────────────────
function CandidateAnalysisTab() {
  const {
    analysisResult,
    interviewResult,
    isAnalyzing,
    isGeneratingQuestions,
    error,
    analyze,
    generateInterviewQuestions,
    reset,
  } = useCandidateAnalysis();

  const { data: dbRoles = [] } = useGetCVRoles();
  const availableRoleNames =
    dbRoles.length > 0 ? dbRoles.map((r) => r.name) : FALLBACK_SPIL_ROLES;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [cvText, setCvText] = useState("");
  const [showManualTextarea, setShowManualTextarea] = useState(false);

  // Role Selection State
  const [selectedStandardRoles, setSelectedStandardRoles] = useState<string[]>([]);
  const [customRoles, setCustomRoles] = useState<TargetRoleItem[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Set default selected roles when availableRoleNames is loaded
  useEffect(() => {
    if (availableRoleNames.length > 0 && selectedStandardRoles.length === 0) {
      setSelectedStandardRoles(availableRoleNames);
    }
  }, [availableRoleNames]);

  const [selectedRoleForInterview, setSelectedRoleForInterview] = useState("");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const autoName = formatCandidateNameFromFilename(f.name);
    if (!candidateName.trim()) {
      setCandidateName(autoName);
    }
    setIsExtractingPDF(true);
    try {
      const text = await extractCVTextFromFile(f);
      setCvText(text);
    } finally {
      setIsExtractingPDF(false);
    }
  };

  const toggleStandardRole = (role: string) => {
    if (selectedStandardRoles.includes(role)) {
      setSelectedStandardRoles(selectedStandardRoles.filter((r) => r !== role));
    } else {
      setSelectedStandardRoles([...selectedStandardRoles, role]);
    }
  };

  const handleAddCustomRole = () => {
    if (!newRoleName.trim()) return;
    setCustomRoles([
      ...customRoles,
      { role: newRoleName.trim(), description: newRoleDesc.trim() },
    ]);
    setNewRoleName("");
    setNewRoleDesc("");
  };

  const handleRemoveCustomRole = (index: number) => {
    setCustomRoles(customRoles.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    // Map selected roles with descriptions from database if available
    const roleDescMap = new Map(dbRoles.map((r) => [r.name, r.description]));
    const targetRoles: TargetRoleItem[] = [
      ...selectedStandardRoles.map((r) => ({
        role: r,
        description: roleDescMap.get(r) || undefined,
      })),
      ...customRoles,
    ];
    const nameToSend = candidateName.trim() || (file ? formatCandidateNameFromFilename(file.name) : "Kandidat");
    await analyze(nameToSend, cvText, targetRoles.length > 0 ? targetRoles : undefined);
  };

  const handleGenerateQuestions = async () => {
    if (!cvText.trim() || !selectedRoleForInterview) return;
    const nameToSend = analysisResult?.candidate_name || candidateName.trim() || (file ? formatCandidateNameFromFilename(file.name) : "Kandidat");
    await generateInterviewQuestions(nameToSend, cvText, selectedRoleForInterview);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-700" />
            Upload & Analisis CV Pelaut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* File Upload */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mx-auto w-8 h-8 text-slate-600 mb-2" />
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 flex items-center justify-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  Nama Pelaut: <strong>{candidateName || formatCandidateNameFromFilename(file.name)}</strong>
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">Upload Dokumen CV (PDF)</p>
                <p className="text-xs text-slate-500 mt-1">Sistem membaca file PDF dan mengekstrak nama pelaut secara otomatis</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {isExtractingPDF && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" /> Membaca dokumen CV pelaut...
            </div>
          )}

          {/* Nama Kandidat Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nama Pelaut / Kandidat <span className="text-slate-400 font-normal">(Terisi otomatis dari nama file/dokumen)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Capt. Budi Santoso"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>

          {/* Optional Manual Text Toggle */}
          <div className="text-xs">
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              onClick={() => setShowManualTextarea(!showManualTextarea)}
            >
              <FileText className="w-3.5 h-3.5" />
              {showManualTextarea ? "Sembunyikan Input Teks Manual" : "Input Teks CV Manual (Opsional)"}
            </button>
            {showManualTextarea && (
              <textarea
                placeholder="Paste teks isi CV pelaut di sini jika tidak menggunakan dokumen PDF..."
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none mt-2 bg-white"
              />
            )}
          </div>

          {/* Role Selection Accordion */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-slate-700" />
                  Target Role Perkapalan PT SPIL ({selectedStandardRoles.length + customRoles.length} Role Terpilih)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih atau tambahkan posisi perkapalan yang ingin diuji kecocokannya.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                onClick={() => setShowRoleSelector(!showRoleSelector)}
              >
                {showRoleSelector ? "Sembunyikan" : "Atur Role"}
              </Button>
            </div>

            {showRoleSelector && (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                {/* Standard Roles Checkboxes */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Role Tersimpan di Database ({availableRoleNames.length} Role)
                    </label>
                    <div className="space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedStandardRoles(availableRoleNames)}
                        className="text-slate-800 hover:underline font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedStandardRoles([])}
                        className="text-slate-500 hover:underline"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {availableRoleNames.map((r) => (
                      <label
                        key={r}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedStandardRoles.includes(r)
                            ? "bg-slate-900 text-white border-slate-900 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStandardRoles.includes(r)}
                          onChange={() => toggleStandardRole(r)}
                          className="rounded text-slate-900 focus:ring-slate-900"
                        />
                        <span className="truncate">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Add Custom Role */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Tambah Role Sementara (Hanya untuk Sesi Analisis Ini)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Role (e.g. PORT CAPTAIN)"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Deskripsi Pekerjaan / Kriteria (Opsional)"
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomRole}
                    disabled={!newRoleName.trim()}
                    className="text-xs border-slate-300 text-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambahkan Role Sementara
                  </Button>
                </div>

                {/* Custom Roles List */}
                {customRoles.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Role Sementara Ditambahkan:
                    </label>
                    {customRoles.map((cr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{cr.role}</span>
                          {cr.description && (
                            <p className="text-[11px] text-slate-500">{cr.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRole(idx)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !cvText.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menganalisis CV Pelaut...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Analisis Best Fit Role Pelaut
                </>
              )}
            </Button>
            {analysisResult && (
              <Button
                variant="outline"
                onClick={reset}
                className="text-xs text-slate-600 border-slate-300"
              >
                Reset Hasil
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Best Fit Banner */}
          <Card className="border border-slate-200 bg-slate-900 text-white shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                      Best Fit Role Perkapalan PT SPIL
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{analysisResult.best_fit_role}</h2>
                  <p className="text-sm font-semibold text-slate-200 mt-1">
                    Nama Pelaut: {candidateName || analysisResult.candidate_name || (file ? formatCandidateNameFromFilename(file.name) : "Kandidat")}
                    {file && <span className="text-xs font-normal text-slate-400 ml-2">({file.name})</span>}
                  </p>
                  <div className="mt-2">
                    <ScoreBadge score={analysisResult.best_fit_score} />
                  </div>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed border-t border-slate-700/60 pt-3">
                    {analysisResult.profile_summary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Fits List */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                Hasil Perbandingan Role Perkapalan ({(analysisResult.role_fits?.length ?? 0)} Role Analyzed)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {(analysisResult.role_fits || []).map((rf, idx) => (
                <div key={rf.role} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {/* Role Header Row */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedRole(expandedRole === rf.role ? null : rf.role)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                      <span className="font-bold text-slate-900 text-sm">{rf.role}</span>
                      {idx === 0 && (
                        <Badge className="bg-emerald-600 text-white text-[11px] font-semibold border-0">
                          Best Match
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={rf.fit_score} />
                      {expandedRole === rf.role ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedRole === rf.role && (
                    <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      <p className="text-sm text-slate-700 italic border-l-2 border-slate-400 pl-3 py-0.5">
                        {rf.reason}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {/* Strengths */}
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kekuatan Maritim
                          </p>
                          <ul className="space-y-1">
                            {rf.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                <span className="text-emerald-600 font-bold">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-amber-600" /> Area Pengembangan
                          </p>
                          <ul className="space-y-1">
                            {rf.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                <span className="text-amber-600 font-bold">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Skill Gap */}
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Skill & Sertifikasi Gap
                          </p>
                          <ul className="space-y-1">
                            {rf.skill_gap.length > 0 ? (
                              rf.skill_gap.map((sg, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                  <span className="text-rose-600 font-bold">•</span> {sg}
                                </li>
                              ))
                            ) : (
                              <li className="text-slate-400 text-xs italic">
                                Tidak ada gap sertifikasi signifikan
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Generate Interview Questions */}
                      <div className="pt-2 border-t border-slate-200">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300 text-slate-800 hover:bg-slate-100 font-medium text-xs"
                          onClick={() => {
                            setSelectedRoleForInterview(rf.role);
                            handleGenerateQuestions();
                          }}
                          disabled={isGeneratingQuestions}
                        >
                          {isGeneratingQuestions && selectedRoleForInterview === rf.role ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-700" /> Generate Pertanyaan Interview PT SPIL
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interview Questions Result */}
          {interviewResult && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-700" />
                  10 Pertanyaan Interview Maritim PT SPIL — Posisi {interviewResult.role} ({interviewResult.candidate_name})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {interviewResult.questions.map((q) => (
                  <div key={q.number} className="border border-slate-200 rounded-lg p-3.5 space-y-2 bg-white">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-900 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {q.number}
                      </span>
                      <div className="space-y-1 flex-1">
                        <Badge variant="outline" className="text-[11px] font-semibold border-slate-300 text-slate-700 bg-slate-50 mb-1">
                          {q.category}
                        </Badge>
                        <p className="text-sm font-bold text-slate-900">{q.question}</p>
                        <p className="text-xs text-slate-600 italic border-l-2 border-slate-300 pl-2 mt-1">{q.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ── FITUR 2: Role Analysis Tab ────────────────────────────────────────────────
function RoleAnalysisTab() {
  const { result, isAnalyzing, error, analyze, reset } = useRoleAnalysis();
  const { data: dbRoles = [] } = useGetCVRoles();
  const availableRoleNames =
    dbRoles.length > 0 ? dbRoles.map((r) => r.name) : FALLBACK_SPIL_ROLES;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const [isExtractingPDFs, setIsExtractingPDFs] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const activeRoleName = selectedRole === "CUSTOM" ? customRoleInput : selectedRole;

  // Auto-populate default description from DB role when role changes
  const handleRoleChange = (roleName: string) => {
    setSelectedRole(roleName);
    if (roleName && roleName !== "CUSTOM") {
      const found = dbRoles.find((r) => r.name === roleName);
      if (found && found.description && !jobDescription.trim()) {
        setJobDescription(found.description);
      }
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setIsExtractingPDFs(true);
    const fnameMap: Record<string, string> = {};
    try {
      const items: CandidateItem[] = await Promise.all(
        files.map(async (f, idx) => {
          const text = await extractCVTextFromFile(f);
          const formattedName = formatCandidateNameFromFilename(f.name);
          const id = `c${idx + 1}`;
          fnameMap[id] = f.name;
          return {
            id,
            name: formattedName,
            cv_text: text,
          };
        })
      );
      setFilenames(fnameMap);
      setCandidates(items);
    } finally {
      setIsExtractingPDFs(false);
    }
  };

  const handleAnalyze = async () => {
    if (!activeRoleName || candidates.length === 0) return;
    await analyze(activeRoleName, candidates, jobDescription.trim());
  };

  const rankColor = (rank: number) => {
    if (rank === 1) return "text-amber-600 font-black";
    if (rank === 2) return "text-slate-600 font-bold";
    if (rank === 3) return "text-amber-800 font-bold";
    return "text-gray-400 font-semibold";
  };

  const rankBg = (rank: number) => {
    if (rank === 1) return "bg-slate-900 text-white border-slate-900";
    return "bg-white border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-700" />
            Konfigurasi Role Analysis Perkapalan (PT SPIL)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Role Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Pilih Target Role Perkapalan PT SPIL <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">-- Pilih Role Perkapalan PT SPIL --</option>
              {availableRoleNames.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="CUSTOM">+ Tambah Role Custom / Lainnya</option>
            </select>
          </div>

          {selectedRole === "CUSTOM" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Role Custom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: PORT CAPTAIN / SUPERINTENDENT"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          )}

          {/* Job Description (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deskripsi Pekerjaan / Kriteria Khusus PT SPIL <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              placeholder="Masukkan deskripsi pekerjaan, kriteria sertifikasi (STCW, COP, COC), sea time, atau kualifikasi operasional..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0 text-slate-600" />
              Jika deskripsi tidak diisi, penilaian berdasarkan kriteria operasional maritim PT SPIL.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Upload Multiple CV Pelaut <span className="text-red-500">*</span>
            </label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition-all bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mx-auto w-8 h-8 text-slate-600 mb-2" />
              {candidates.length > 0 ? (
                <div className="space-y-1.5 text-left max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                    {candidates.length} CV Pelaut Terunggah:
                  </p>
                  {candidates.map((c) => (
                    <div key={c.id} className="text-xs flex items-center justify-between text-slate-700">
                      <span className="font-semibold text-slate-900">{c.name}</span>
                      <span className="text-slate-400 text-[11px]">({filenames[c.id]})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    Klik untuk upload beberapa file CV Pelaut (PDF)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Sistem membaca nama pelaut secara otomatis dari masing-masing file PDF
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleFilesChange}
              />
            </div>
          </div>

          {isExtractingPDFs && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" /> Membaca dokumen CV pelaut...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !activeRoleName || candidates.length === 0}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menganalisis & Meranking Pelaut...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" /> Analisis & Ranking Pelaut
                </>
              )}
            </Button>
            {result && (
              <Button
                variant="outline"
                onClick={reset}
                className="text-xs text-slate-600 border-slate-300"
              >
                Reset Hasil
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <Card className="border border-slate-200 bg-slate-900 text-white shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider block mb-1">
                    Hasil Ranking Role Analysis PT SPIL
                  </span>
                  <h2 className="text-2xl font-bold text-white">{result.role}</h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Total: <strong>{result.total_candidates} Pelaut</strong> dianalisis berdasarkan kualifikasi posisi {result.role}.
                  </p>
                </div>
                {result.role_criteria_summary && (
                  <div className="bg-white/10 border border-white/20 p-3 rounded-lg max-w-sm text-xs text-slate-200">
                    <p className="font-semibold text-white mb-1">Fokus Kriteria Evaluasi:</p>
                    <p>{result.role_criteria_summary}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Candidates Ranking List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-slate-700" />
              Daftar Ranking Pelaut Teratas
            </h3>

            {result.rankings.map((cand) => (
              <Card
                key={cand.candidate_id}
                className={`border shadow-sm rounded-xl overflow-hidden transition-all ${
                  cand.rank === 1 ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank Badge + Info */}
                    <div className="flex items-start gap-3">
                      <div className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${
                        cand.rank === 1 ? "bg-white/10 text-amber-400" : "bg-slate-100 text-slate-700"
                      }`}>
                        <span className={`text-base font-black ${rankColor(cand.rank)}`}>
                          #{cand.rank}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-bold text-sm ${cand.rank === 1 ? "text-white" : "text-slate-900"}`}>
                            {cand.candidate_name}
                          </h4>
                          {filenames[cand.candidate_id] && (
                            <span className={`text-[11px] font-normal ${cand.rank === 1 ? "text-slate-300" : "text-slate-400"}`}>
                              ({filenames[cand.candidate_id]})
                            </span>
                          )}
                          {cand.rank === 1 && (
                            <Badge className="bg-amber-500 text-white text-[10px] font-bold border-0">
                              Top Recommendation
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${cand.rank === 1 ? "text-slate-200" : "text-slate-600"}`}>
                          {cand.profile_summary}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ScoreBadge score={cand.fit_score} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${cand.rank === 1 ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-400"}`}
                        onClick={() =>
                          setExpandedCandidate(
                            expandedCandidate === cand.candidate_id ? null : cand.candidate_id
                          )
                        }
                      >
                        {expandedCandidate === cand.candidate_id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedCandidate === cand.candidate_id && (
                    <div className={`mt-4 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-3 text-xs p-3 rounded-lg ${
                      cand.rank === 1 ? "border-slate-700 bg-white/5 text-slate-100" : "border-slate-100 bg-slate-50/50"
                    }`}>
                      <div className="space-y-1.5">
                        <p className="font-bold text-emerald-700 flex items-center gap-1 uppercase tracking-wider text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Keunggulan Maritim
                        </p>
                        <ul className="space-y-1">
                          {cand.strengths.map((s, i) => (
                            <li key={i} className={`flex items-start gap-1.5 ${cand.rank === 1 ? "text-slate-200" : "text-slate-700"}`}>
                              <span className="text-emerald-500 font-bold">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <p className="font-bold text-amber-700 flex items-center gap-1 uppercase tracking-wider text-[11px]">
                          <Info className="w-3.5 h-3.5 text-amber-600" /> Area Pengembangan & Gap
                        </p>
                        <ul className="space-y-1">
                          {cand.weaknesses.map((w, i) => (
                            <li key={i} className={`flex items-start gap-1.5 ${cand.rank === 1 ? "text-slate-200" : "text-slate-700"}`}>
                              <span className="text-amber-500 font-bold">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FITUR 3: Kelola Role & Deskripsi Tab (Sub-fitur CRUD Roles) ────────────────
function CVRolesManagementTab() {
  const { isAdmin } = useAuth();
  const { data: roles = [], isLoading } = useGetCVRoles();
  const createMutation = useCreateCVRole();
  const updateMutation = useUpdateCVRole();
  const deleteMutation = useDeleteCVRole();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRole, setEditingRole] = useState<CVRoleItem | null>(null);

  // Form State
  const [roleName, setRoleName] = useState("");
  const [roleCategory, setRoleCategory] = useState("DECK");
  const [roleDescription, setRoleDescription] = useState("");

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<CVRoleItem | null>(null);

  const categories = ["ALL", "DECK", "ENGINE", "CATERING", "TRAINEE", "GENERAL"];

  const filteredRoles = roles.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategoryFilter === "ALL" ||
      (r.category || "GENERAL").toUpperCase() === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingRole(null);
    setRoleName("");
    setRoleCategory("DECK");
    setRoleDescription("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (role: CVRoleItem) => {
    setIsEditMode(true);
    setEditingRole(role);
    setRoleName(role.name);
    setRoleCategory((role.category || "GENERAL").toUpperCase());
    setRoleDescription(role.description || "");
    setDialogOpen(true);
  };

  const handleDeleteClick = (role: CVRoleItem) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Nama role tidak boleh kosong");
      return;
    }

    try {
      if (isEditMode && editingRole) {
        await updateMutation.mutateAsync({
          id: editingRole.id,
          data: {
            name: roleName.trim().toUpperCase(),
            category: roleCategory,
            description: roleDescription.trim(),
          },
        });
        toast.success(`Role ${roleName.trim().toUpperCase()} berhasil diperbarui!`);
      } else {
        await createMutation.mutateAsync({
          name: roleName.trim().toUpperCase(),
          category: roleCategory,
          description: roleDescription.trim(),
        });
        toast.success(`Role ${roleName.trim().toUpperCase()} berhasil ditambahkan!`);
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message || "Gagal menyimpan role");
    }
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      await deleteMutation.mutateAsync(roleToDelete.id);
      toast.success(`Role ${roleToDelete.name} berhasil dihapus!`);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message || "Gagal menghapus role");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Info & Action Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-700" />
                Manajemen Target Role & Deskripsi Kualifikasi (PT SPIL)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola master role perkapalan, kriteria sertifikasi (STCW/COP/COC), dan tugas operasional yang digunakan sistem AI.
              </p>
            </div>
            {isAdmin ? (
              <Button
                onClick={handleOpenCreate}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Role Baru
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <ShieldAlert className="w-3.5 h-3.5" /> View Only Mode (Admin dapat mengedit)
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama role atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 flex-wrap w-full md:w-auto">
              <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" /> Kategori:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    selectedCategoryFilter === cat
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Total stats */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 border-t border-slate-100 pt-3">
            <span>
              Menampilkan <strong>{filteredRoles.length}</strong> dari <strong>{roles.length}</strong> total role terdaftar
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Role List Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data role...
        </div>
      ) : filteredRoles.length === 0 ? (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-8 text-center text-slate-500 space-y-2">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Tidak ada role yang ditemukan</p>
          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter kategori.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoles.map((role) => (
            <Card
              key={role.id}
              className="border border-slate-200 shadow-sm bg-white rounded-xl hover:border-slate-400 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryBadge category={role.category} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{role.name}</h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(role)}
                        className="h-7 px-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(role)}
                        className="h-7 px-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed min-h-[60px]">
                  {role.description ? (
                    <p>{role.description}</p>
                  ) : (
                    <p className="italic text-slate-400">Belum ada deskripsi kriteria khusus.</p>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>ID #{role.id}</span>
                  <span>Diperbarui: {role.updatedAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {isEditMode ? `Edit Role: ${editingRole?.name}` : "Tambah Target Role Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Role ini akan otomatis muncul pada opsi analisis CV pelaut.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRole} className="space-y-3.5 mt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: PORT CAPTAIN / SUPERINTENDENT"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kategori Maritim / Divisi <span className="text-red-500">*</span>
              </label>
              <select
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="DECK">DECK (Navigasi / Perwira & Rating Dek)</option>
                <option value="ENGINE">ENGINE (Permesinan / Perwira & Rating Mesin)</option>
                <option value="CATERING">CATERING (Koki & Pelayan Kapal)</option>
                <option value="TRAINEE">TRAINEE (Kadet Dek / Mesin / Elektro)</option>
                <option value="GENERAL">GENERAL / DARAT (Superintendent, Staff, dll.)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Deskripsi Kualifikasi, Kriteria Sertifikasi & Tugas
              </label>
              <textarea
                placeholder="Masukkan kriteria sertifikasi (STCW/COP/COC), sea time minimal, tipe kapal (container), atau tugas operasional..."
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Deskripsi ini akan digunakan oleh model AI untuk mencocokkan pengalaman kandidat dengan posisi tersebut.
              </p>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="text-xs border-slate-300 text-slate-700"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                )}
                {isEditMode ? "Simpan Perubahan" : "Tambahkan Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-rose-600">
              Hapus Role: {roleToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs text-slate-600">
              <p>
                Apakah Anda yakin ingin menghapus role <strong>{roleToDelete?.name}</strong> dari sistem?
              </p>
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Role ini tidak akan muncul lagi di daftar analisis CV pelaut.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel className="text-xs border-slate-300 text-slate-700">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {deleteMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Hapus Role
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── MAIN PAGE COMPONENT ───────────────────────────────────────────────────────
export default function CVAnalysisPage() {
  return (
    <div className="space-y-6">
      {/* Page Header matching Master Table & Training Plan */}
      <section className="space-y-5 rounded-xl border bg-background px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Image
            width={56}
            height={56}
            src="/images/logo1.png"
            alt="PT SPIL Logo"
            className="h-11 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Maritime CV Analysis</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Analisis kesesuaian, evaluasi kompetensi, dan ranking pelaut berbasis standar operasional PT SPIL.
            </p>
          </div>
          <Image
            width={56}
            height={56}
            src="/images/logo2.png"
            alt="Partner Logo"
            className="h-11 w-auto ml-auto"
          />
        </div>
      </section>

      {/* Disclaimer Info */}
      <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl text-slate-700 text-xs flex items-center gap-3">
        <Info className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <span>
          <strong>Catatan HR Maritim PT SPIL:</strong> Hasil analisis AI berfungsi sebagai instrumen pendukung keputusan awal rekrutmen dan evaluasi penempatan kru kapal.
        </span>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="candidate" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 border border-slate-200 p-1 rounded-xl shadow-sm">
          <TabsTrigger
            value="candidate"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-semibold text-xs py-2.5 transition-all flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Candidate Analysis (1 Pelaut)
          </TabsTrigger>
          <TabsTrigger
            value="role"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-semibold text-xs py-2.5 transition-all flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Role Analysis (Multiple Pelaut)
          </TabsTrigger>
          <TabsTrigger
            value="manage-roles"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-semibold text-xs py-2.5 transition-all flex items-center justify-center gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Kelola Role & Deskripsi
          </TabsTrigger>
        </TabsList>

        {/* Subtext Petunjuk Langkah di Bawah Tombol Tabs */}
        <div className="grid grid-cols-3 gap-3 mt-2 px-1 text-center">
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            Upload 1 CV &rarr; Pilih Target Role SPIL &rarr; Best Fit Role + Interview
          </p>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            Pilih 1 Role &rarr; Upload Banyak CV &rarr; AI Candidate Ranking
          </p>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            Tambah, Ubah & Hapus Master Target Role Perkapalan SPIL
          </p>
        </div>

        <TabsContent value="candidate" className="mt-4">
          <CandidateAnalysisTab />
        </TabsContent>

        <TabsContent value="role" className="mt-4">
          <RoleAnalysisTab />
        </TabsContent>

        <TabsContent value="manage-roles" className="mt-4">
          <CVRolesManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}