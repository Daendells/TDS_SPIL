"use client";

import { useState, useRef } from "react";
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
} from "lucide-react";

import * as pdfjsLib from "pdfjs-dist";
import { useCandidateAnalysis, TargetRoleItem } from "./_hooks/useCandidateAnalysis";
import { useRoleAnalysis, CandidateItem } from "./_hooks/useRoleAnalysis";

// Configure pdfjs worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

// Daftar Role Perkapalan / Kru Kapal Standar PT SPIL (dari roles_distinct.csv)
const DEFAULT_SPIL_ROLES = [
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [cvText, setCvText] = useState("");
  const [showManualTextarea, setShowManualTextarea] = useState(false);

  // Role Selection State
  const [selectedStandardRoles, setSelectedStandardRoles] = useState<string[]>(DEFAULT_SPIL_ROLES);
  const [customRoles, setCustomRoles] = useState<TargetRoleItem[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [showRoleSelector, setShowRoleSelector] = useState(false);

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
    const targetRoles: TargetRoleItem[] = [
      ...selectedStandardRoles.map((r) => ({ role: r })),
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
      <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Upload & Analisis CV Pelaut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* File Upload */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mx-auto w-8 h-8 text-blue-600 mb-2" />
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-700 flex items-center justify-center gap-1.5">
                  <FileCheck className="w-4 h-4" /> {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  Nama Pelaut: <strong>{candidateName || formatCandidateNameFromFilename(file.name)}</strong>
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-800">Upload Dokumen CV (PDF)</p>
                <p className="text-xs text-gray-500 mt-1">Sistem membaca file PDF dan mengekstrak nama pelaut secara otomatis</p>
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
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Membaca dokumen CV pelaut...
            </div>
          )}

          {/* Nama Kandidat Input (Pre-filled, optional override) */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Nama Pelaut / Kandidat <span className="text-gray-400 font-normal">(Terisi otomatis dari nama file/dokumen)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Capt. Budi Santoso"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Optional Manual Text Toggle */}
          <div className="text-xs">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mt-2 bg-white"
              />
            )}
          </div>

          {/* Role Selection Accordion */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-blue-600" />
                  Target Role Perkapalan PT SPIL ({selectedStandardRoles.length + customRoles.length} Role Terpilih)
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pilih atau tambahkan posisi perkapalan yang ingin diuji kecocokannya.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
                onClick={() => setShowRoleSelector(!showRoleSelector)}
              >
                {showRoleSelector ? "Sembunyikan" : "Atur Role"}
              </Button>
            </div>

            {showRoleSelector && (
              <div className="space-y-4 pt-3 border-t border-gray-200">
                {/* Standard Roles Checkboxes */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Role Standar Kru Kapal PT SPIL ({DEFAULT_SPIL_ROLES.length} Role)
                    </label>
                    <div className="space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedStandardRoles(DEFAULT_SPIL_ROLES)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedStandardRoles([])}
                        className="text-gray-500 hover:underline"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {DEFAULT_SPIL_ROLES.map((r) => (
                      <label
                        key={r}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedStandardRoles.includes(r)
                            ? "bg-blue-50 border-blue-300 font-semibold text-blue-900"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStandardRoles.includes(r)}
                          onChange={() => toggleStandardRole(r)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Add Custom Role */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Tambah Custom Role Perkapalan
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Role (e.g. PORT CAPTAIN / SUPERINTENDENT)"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Deskripsi Pekerjaan / Kriteria (Opsional)"
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomRole}
                    disabled={!newRoleName.trim()}
                    className="text-xs border-gray-300 text-gray-700"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambahkan Role Custom
                  </Button>
                </div>

                {/* Custom Roles List */}
                {customRoles.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-gray-700 block">
                      Role Custom Ditambahkan:
                    </label>
                    {customRoles.map((cr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      >
                        <div>
                          <span className="font-semibold text-gray-900">{cr.role}</span>
                          {cr.description && (
                            <p className="text-[11px] text-gray-500">{cr.description}</p>
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

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !cvText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menganalisis Pelaut...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Analisis Candidate Pelaut
                </>
              )}
            </Button>
            {analysisResult && (
              <Button variant="outline" onClick={reset} className="border-gray-300 text-gray-700">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 rounded-xl text-red-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Best Fit Summary */}
          <Card className="border border-blue-200 bg-blue-50/40 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <span className="text-xs text-blue-700 font-bold uppercase tracking-wider">
                      Best Fit Role Perkapalan PT SPIL
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{analysisResult.best_fit_role}</h2>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    Nama Pelaut: {candidateName || analysisResult.candidate_name || (file ? formatCandidateNameFromFilename(file.name) : "Kandidat")}
                    {file && <span className="text-xs font-normal text-gray-500 ml-2">({file.name})</span>}
                  </p>
                  <div className="mt-2">
                    <ScoreBadge score={analysisResult.best_fit_score} />
                  </div>
                  <p className="text-sm text-gray-700 mt-3 leading-relaxed border-t border-blue-100 pt-3">
                    {analysisResult.profile_summary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Fits List */}
          <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
            <CardHeader className="border-b border-gray-100 pb-3">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Hasil Perbandingan Role Perkapalan ({(analysisResult.role_fits?.length ?? 0)} Role Analyzed)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {(analysisResult.role_fits || []).map((rf, idx) => (
                <div key={rf.role} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {/* Role Header Row */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpandedRole(expandedRole === rf.role ? null : rf.role)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-6">#{idx + 1}</span>
                      <span className="font-bold text-gray-900 text-sm">{rf.role}</span>
                      {idx === 0 && (
                        <Badge className="bg-blue-600 text-white text-[11px] font-semibold border-0">
                          Best Match
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={rf.fit_score} />
                      {expandedRole === rf.role ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedRole === rf.role && (
                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50 space-y-4">
                      <p className="text-sm text-gray-700 italic border-l-2 border-blue-500 pl-3 py-0.5">
                        {rf.reason}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {/* Strengths */}
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kekuatan Maritim
                          </p>
                          <ul className="space-y-1">
                            {rf.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                                <span className="text-emerald-600 font-bold">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-amber-600" /> Area Pengembangan
                          </p>
                          <ul className="space-y-1">
                            {rf.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                                <span className="text-amber-600 font-bold">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Skill Gap */}
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-red-600" /> Skill & Sertifikasi Gap
                          </p>
                          <ul className="space-y-1">
                            {rf.skill_gap.length > 0 ? (
                              rf.skill_gap.map((sg, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                                  <span className="text-red-600 font-bold">•</span> {sg}
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-400 text-xs italic">
                                Tidak ada gap sertifikasi signifikan
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Generate Interview Questions */}
                      <div className="pt-2 border-t border-gray-200">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 font-medium text-xs"
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
                              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Generate Pertanyaan Interview PT SPIL
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
            <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  10 Pertanyaan Interview Maritim PT SPIL — Posisi {interviewResult.role} ({interviewResult.candidate_name})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {interviewResult.questions.map((q) => (
                  <div key={q.number} className="border border-gray-200 rounded-lg p-3.5 space-y-2 bg-white">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {q.number}
                      </span>
                      <div className="space-y-1 flex-1">
                        <Badge variant="outline" className="text-[11px] font-semibold border-gray-300 text-gray-700 bg-gray-50 mb-1">
                          {q.category}
                        </Badge>
                        <p className="text-sm font-bold text-gray-900">{q.question}</p>
                        <p className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2 mt-1">{q.reason}</p>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const [isExtractingPDFs, setIsExtractingPDFs] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const activeRoleName = selectedRole === "CUSTOM" ? customRoleInput : selectedRole;

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
    if (rank === 1) return "bg-blue-50/50 border-blue-200";
    return "bg-white border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            Konfigurasi Role Analysis Perkapalan (PT SPIL)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Role Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Pilih Target Role Perkapalan PT SPIL <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Pilih Role Perkapalan PT SPIL --</option>
              {DEFAULT_SPIL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="CUSTOM">+ Tambah Role Custom / Lainnya</option>
            </select>
          </div>

          {selectedRole === "CUSTOM" && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Nama Role Custom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: PORT CAPTAIN / SUPERINTENDENT"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          )}

          {/* Job Description (Optional) */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Deskripsi Pekerjaan / Kriteria Khusus PT SPIL <span className="text-gray-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              placeholder="Masukkan deskripsi pekerjaan, kriteria sertifikasi (STCW, COP, COC), sea time, atau kualifikasi operasional..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0 text-blue-600" />
              Jika deskripsi tidak diisi, penilaian berdasarkan kriteria operasional maritim PT SPIL.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Upload Multiple CV Pelaut <span className="text-red-500">*</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mx-auto w-8 h-8 text-blue-600 mb-2" />
              {candidates.length > 0 ? (
                <div className="space-y-1.5 text-left max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-bold text-gray-800 border-b border-gray-200 pb-1">
                    {candidates.length} CV Pelaut Terunggah:
                  </p>
                  {candidates.map((c) => (
                    <div key={c.id} className="text-xs flex items-center justify-between text-gray-700">
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      <span className="text-gray-400 text-[11px]">({filenames[c.id]})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-800">
                    Klik untuk upload beberapa file CV Pelaut (PDF)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Membaca dokumen CV pelaut...
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !activeRoleName || candidates.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Meranking Pelaut...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" /> Analisis & Ranking Pelaut
                </>
              )}
            </Button>
            {result && (
              <Button variant="outline" onClick={reset} className="border-gray-300 text-gray-700">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 rounded-xl text-red-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <Card className="border border-blue-200 bg-blue-50/40 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-blue-700 font-bold uppercase tracking-wider">
                    Pelaut Paling Direkomendasikan untuk Posisi {result.role} di PT SPIL
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-0.5">{result.recommended_candidate}</h2>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed border-t border-blue-100 pt-2">
                    {result.recommendation_reason}
                  </p>
                  <p className="text-xs font-medium text-gray-500 mt-2">
                    Total {result.total_candidates} pelaut dianalisis & diranking
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rankings */}
          <div className="space-y-3">
            {result.rankings.map((cand) => (
              <Card key={cand.candidate_id} className={`border shadow-sm rounded-xl ${rankBg(cand.rank)}`}>
                {/* Header Row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() =>
                    setExpandedCandidate(
                      expandedCandidate === cand.candidate_id ? null : cand.candidate_id
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-xl ${rankColor(cand.rank)} w-6`}>
                      #{cand.rank}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {cand.candidate_name}
                        {filenames[cand.candidate_id] && (
                          <span className="text-xs font-normal text-gray-500 ml-2">
                            ({filenames[cand.candidate_id]})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                        {cand.profile_summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={cand.fit_score} />
                    {expandedCandidate === cand.candidate_id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedCandidate === cand.candidate_id && (
                  <CardContent className="pt-0 pb-5 border-t border-gray-100">
                    <div className="mb-4 pt-3">
                      <p className="text-sm text-gray-700 border-l-2 border-blue-500 pl-3 py-0.5">{cand.reason}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Strengths */}
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kekuatan Maritim
                        </p>
                        <ul className="space-y-1">
                          {cand.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                              <span className="text-emerald-600 font-bold">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-600" /> Area Pengembangan
                        </p>
                        <ul className="space-y-1">
                          {cand.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                              <span className="text-amber-600 font-bold">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Skill Gap */}
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-600" /> Skill & Sertifikasi Gap
                        </p>
                        <ul className="space-y-1">
                          {cand.skill_gap.length > 0 ? (
                            cand.skill_gap.map((sg, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                                <span className="text-red-600 font-bold">•</span> {sg}
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-400 text-xs italic">
                              Tidak ada gap sertifikasi signifikan
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CVAnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Maritime CV Analysis — PT SPIL</h1>
              <p className="text-xs text-gray-500 mt-0.5">Analisis & Ranking CV Pelaut Berbasis Standar Operasional PT Salam Pacific Indonesia Lines</p>
            </div>
          </div>
        </div>

        {/* Disclaimer Info */}
        <div className="border border-blue-200 bg-blue-50/50 p-3.5 rounded-xl text-blue-900 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Catatan HR Maritim PT SPIL:</strong> Hasil analisis AI berfungsi sebagai pendukung keputusan awal recruitment pelaut dan harus divalidasi oleh tim recruiter PT SPIL.
          </span>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="candidate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <TabsTrigger
              value="candidate"
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 font-semibold text-xs py-2.5 transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Candidate Analysis (1 Pelaut)
            </TabsTrigger>
            <TabsTrigger
              value="role"
              className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 font-semibold text-xs py-2.5 transition-all flex items-center justify-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Role Analysis (Multiple Pelaut)
            </TabsTrigger>
          </TabsList>

          {/* Subtext Petunjuk Langkah di Bawah Tombol Tabs */}
          <div className="grid grid-cols-2 gap-4 mt-2 px-1 text-center">
            <p className="text-[11px] text-gray-500 font-medium leading-tight">
              Upload 1 CV &rarr; Pilih/Tambah Role Perkapalan PT SPIL &rarr; Analisis Best Fit Role + Pertanyaan Interview
            </p>
            <p className="text-[11px] text-gray-500 font-medium leading-tight">
              Pilih 1 Role Perkapalan &rarr; Deskripsi (Opsional) &rarr; Upload Banyak CV Pelaut &rarr; Ranking Pelaut
            </p>
          </div>

          <TabsContent value="candidate" className="mt-4">
            <CandidateAnalysisTab />
          </TabsContent>

          <TabsContent value="role" className="mt-4">
            <RoleAnalysisTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}