"use client";

import { useMemo, useState } from "react";
import { DISCCandidate } from "../_data/discDataset";
import {
  calculateRoleFit,
  calculateCompetencies,
  generateInterviewQuestions,
  DISCSummary,
} from "../_hooks/useDISCAnalytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User2,
  ShieldCheck,
  Award,
  Zap,
  Target,
  FileText,
  Activity,
  Printer,
  ChevronLeft,
  ChevronRight,
  Compass,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Scale,
  Anchor,
  Ship,
  CheckCircle2,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface PersonalCandidateDossierProps {
  candidate: DISCCandidate | null;
  candidates: DISCCandidate[];
  summary: DISCSummary;
  onSelectCandidate: (c: DISCCandidate) => void;
  onOpenComparison?: (c: DISCCandidate) => void;
}

export function PersonalCandidateDossier({
  candidate,
  candidates,
  summary,
  onSelectCandidate,
  onOpenComparison,
}: PersonalCandidateDossierProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter candidates for quick dropdown / switcher
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return candidates.slice(0, 50);
    return candidates
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.traitM.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 50);
  }, [candidates, searchQuery]);

  if (!candidate) {
    return (
      <Card className="border border-slate-200 bg-white rounded-xl p-12 text-center shadow-xs">
        <p className="text-sm text-slate-500">Pilih salah satu kandidat untuk memuat Dossier Psikometri Personal.</p>
      </Card>
    );
  }

  // Index of current candidate
  const currentIndex = candidates.findIndex((c) => c.id === candidate.id);
  const handlePrev = () => {
    if (currentIndex > 0) onSelectCandidate(candidates[currentIndex - 1]);
  };
  const handleNext = () => {
    if (currentIndex < candidates.length - 1) onSelectCandidate(candidates[currentIndex + 1]);
  };

  // Analytics helpers
  const roleFit = calculateRoleFit(candidate);
  const competencies = calculateCompetencies(candidate);
  const interviewQuestions = generateInterviewQuestions(candidate);

  // Parse Desc Words
  const descChips = candidate.descWords
    ? candidate.descWords
        .split(/[,;\n]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0 && w !== "-" && !w.toLowerCase().includes("belum ada"))
    : [];

  // 1. Triple-Graph Line Chart Data (with Fleet Benchmark Overlay)
  const lineChartData = {
    labels: ["Dominance (D)", "Influence (I)", "Steadiness (S)", "Compliance (C)"],
    datasets: [
      {
        label: "Graph I (Work Mask / Sehari-hari)",
        data: [candidate.graph1.d, candidate.graph1.i, candidate.graph1.s, candidate.graph1.c],
        borderColor: "#0284c7", // Corporate Blue
        backgroundColor: "rgba(2, 132, 199, 0.08)",
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: "#0284c7",
        tension: 0.15,
      },
      {
        label: "Graph II (Core / Under Pressure)",
        data: [candidate.graph2.d, candidate.graph2.i, candidate.graph2.s, candidate.graph2.c],
        borderColor: "#475569", // Slate 600
        backgroundColor: "rgba(71, 85, 105, 0.08)",
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: "#475569",
        tension: 0.15,
      },
      {
        label: "Graph III (Mirror / Integrasi)",
        data: [candidate.graph3.d, candidate.graph3.i, candidate.graph3.s, candidate.graph3.c],
        borderColor: "#0f766e", // Deep Teal
        backgroundColor: "rgba(15, 118, 110, 0.08)",
        borderWidth: 2.5,
        borderDash: [5, 5],
        pointRadius: 5,
        pointBackgroundColor: "#0f766e",
        tension: 0.15,
      },
      {
        label: "Rata-Rata Populasi Pelaut SPIL (Benchmark)",
        data: [summary.avgGraph3.d, summary.avgGraph3.i, summary.avgGraph3.s, summary.avgGraph3.c],
        borderColor: "#cbd5e1", // Light Slate
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointRadius: 3,
        pointBackgroundColor: "#94a3b8",
        tension: 0.2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 10,
          usePointStyle: true,
          font: { size: 10.5 },
          color: "#334155",
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 8,
        cornerRadius: 6,
      },
    },
    scales: {
      y: {
        ticks: { color: "#64748b", font: { size: 10 } },
        grid: { color: "rgba(226, 232, 240, 0.8)" },
      },
      x: {
        ticks: { color: "#334155", font: { size: 11, weight: 600 } },
        grid: { display: false },
      },
    },
  };

  // 2. DISC Spider Radar Chart Data
  const radarChartData = {
    labels: [
      "Dominance (Ketegasan)",
      "Influence (Komunikasi)",
      "Steadiness (Ketenangan)",
      "Compliance (Ketaatan Prosedur)",
    ],
    datasets: [
      {
        label: `Profil ${candidate.name}`,
        data: [
          Math.max(0, candidate.graph3.d + 5),
          Math.max(0, candidate.graph3.i + 5),
          Math.max(0, candidate.graph3.s + 5),
          Math.max(0, candidate.graph3.c + 5),
        ],
        backgroundColor: "rgba(2, 132, 199, 0.2)",
        borderColor: "#0284c7",
        borderWidth: 2,
        pointBackgroundColor: "#0284c7",
        pointRadius: 4,
      },
      {
        label: "Benchmark Standar Perwira SPIL",
        data: [
          Math.max(0, summary.avgGraph3.d + 5),
          Math.max(0, summary.avgGraph3.i + 5),
          Math.max(0, summary.avgGraph3.s + 5),
          Math.max(0, summary.avgGraph3.c + 5),
        ],
        backgroundColor: "rgba(15, 118, 110, 0.1)",
        borderColor: "#0f766e",
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointBackgroundColor: "#0f766e",
        pointRadius: 3,
      },
    ],
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: "rgba(226, 232, 240, 0.8)" },
        grid: { color: "rgba(226, 232, 240, 0.8)" },
        pointLabels: {
          font: { size: 10.5, weight: 600 },
          color: "#334155",
        },
        ticks: { display: false },
        min: 0,
        max: 10,
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 8,
          usePointStyle: true,
          font: { size: 10.5 },
          color: "#334155",
        },
      },
    },
  };

  // Stress Volatility Delta
  const stressShiftValue = Math.sqrt(
    Math.pow((candidate.graph1.d || 0) - (candidate.graph2.d || 0), 2) +
    Math.pow((candidate.graph1.i || 0) - (candidate.graph2.i || 0), 2) +
    Math.pow((candidate.graph1.s || 0) - (candidate.graph2.s || 0), 2) +
    Math.pow((candidate.graph1.c || 0) - (candidate.graph2.c || 0), 2)
  );

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION & CANDIDATE SWITCHER ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <User2 className="w-4 h-4 text-slate-500 shrink-0" />
          <Select
            value={candidate.id}
            onValueChange={(val) => {
              const found = candidates.find((c) => c.id === val);
              if (found) onSelectCandidate(found);
            }}
          >
            <SelectTrigger className="h-8.5 text-xs font-medium border-slate-200 bg-slate-50/50">
              <SelectValue placeholder="Pilih kandidat..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="p-2">
                <Input
                  placeholder="Cari nama / NIK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs mb-1"
                />
              </div>
              {filteredOptions.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-slate-400 ml-1.5 text-[11px]">({c.traitM})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="h-8 text-xs border-slate-200 gap-1 px-2.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </Button>
          <span className="text-[11px] text-slate-500 px-1 font-mono">
            {currentIndex + 1} / {candidates.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= candidates.length - 1}
            className="h-8 text-xs border-slate-200 gap-1 px-2.5"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {onOpenComparison && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenComparison(candidate)}
              className="h-8 text-xs border-slate-200 hover:bg-slate-50 gap-1.5 text-slate-700"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              Bandingkan Kandidat
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 text-xs border-slate-200 hover:bg-slate-50 gap-1.5 text-slate-700"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Cetak Dossier
          </Button>
        </div>
      </div>

      {/* ── CANDIDATE HERO DOSSIER CARD ──────────────────────────────────── */}
      <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <div className="bg-slate-900 text-white p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{candidate.name}</h2>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-bold px-2 py-0.5 border ${
                    candidate.dominantType === "D"
                      ? "bg-slate-800 text-slate-100 border-slate-600"
                      : candidate.dominantType === "I"
                      ? "bg-slate-800 text-slate-200 border-slate-600"
                      : candidate.dominantType === "S"
                      ? "bg-teal-950 text-teal-300 border-teal-700"
                      : "bg-sky-950 text-sky-300 border-sky-700"
                  }`}
                >
                  Dominan: Tipe {candidate.dominantType} ({candidate.traitM})
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-medium px-2 py-0.5 border ${
                    candidate.consistency.includes("Still")
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                      : candidate.consistency.includes("Note")
                      ? "bg-amber-950/80 text-amber-300 border-amber-700"
                      : "bg-slate-800 text-slate-300 border-slate-600"
                  }`}
                >
                  {candidate.consistency}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
                <span>NIK: {candidate.nik}</span>
                <span>•</span>
                <span>Email: {candidate.email}</span>
                <span>•</span>
                <span>Tanggal Asesmen: {candidate.date}</span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end bg-slate-800/80 border border-slate-700/60 p-3 rounded-lg shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Kesesuaian Jabatan Kapal Teratas:
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Ship className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-sky-200">{roleFit.recommendedRole}</span>
              </div>
              <span className="text-[11px] text-slate-300 mt-0.5">
                Kecocokan Departemen: <strong className="text-white">{roleFit.recommendedDepartment}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Benchmark Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 divide-x divide-slate-100 bg-slate-50/50">
          <div className="p-3.5 text-center">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Skor Dominance (D)
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {candidate.graph3.d}
            </span>
            <span className="text-[10px] text-slate-500">
              Populasi: {summary.avgGraph3.d} ({candidate.graph3.d >= summary.avgGraph3.d ? "▲ Di atas rata2" : "▼ Di bawah rata2"})
            </span>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Skor Compliance (C)
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {candidate.graph3.c}
            </span>
            <span className="text-[10px] text-slate-500">
              Populasi: {summary.avgGraph3.c} ({candidate.graph3.c >= summary.avgGraph3.c ? "▲ Di atas rata2" : "▼ Di bawah rata2"})
            </span>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Skor Steadiness (S)
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {candidate.graph3.s}
            </span>
            <span className="text-[10px] text-slate-500">
              Populasi: {summary.avgGraph3.s} ({candidate.graph3.s >= summary.avgGraph3.s ? "▲ Di atas rata2" : "▼ Di bawah rata2"})
            </span>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Stress Shift Volatility
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {stressShiftValue.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">
              {stressShiftValue <= 2 ? "🟢 Respon Sangat Stabil" : stressShiftValue <= 4 ? "🟡 Pergeseran Wajar" : "🔴 Rentan Tekanan Ekstrem"}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Dual Visual Charts (Triple Graph Line + Radar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Triple Graph Line */}
            <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    Analisis Profil 3-Garis DISC & Benchmark Pelaut
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">3-Line Vector</span>
              </div>
              <div className="h-64 w-full">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Right: DISC Radar Chart */}
            <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    Radar Keseimbangan Kompetensi DISC
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Radar 4-Axis</span>
              </div>
              <div className="h-64 w-full">
                <Radar data={radarChartData} options={radarChartOptions} />
              </div>
            </div>
          </div>

          {/* 4-Pillar Behavioral Competency Matrix */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Evaluasi 4 Pilar Kompetensi Maritim & Kesiapan Tugas Laut
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Pillar 1: Leadership */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">1. Kepemimpinan & Komando Kapal</span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
                    {competencies.leadershipAndCommand.score}/100 • {competencies.leadershipAndCommand.level}
                  </Badge>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${competencies.leadershipAndCommand.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {competencies.leadershipAndCommand.desc}
                </p>
              </div>

              {/* Pillar 2: Stress Resilience */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">2. Ketahanan Tekanan & Manajemen Krisis</span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-teal-50 text-teal-700 border-teal-200">
                    {competencies.stressResilience.score}/100 • {competencies.stressResilience.level}
                  </Badge>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full"
                    style={{ width: `${competencies.stressResilience.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {competencies.stressResilience.desc}
                </p>
              </div>

              {/* Pillar 3: Compliance & SOP */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">3. Kepatuhan ISM Code & Regulasi SOLAS</span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-slate-100 text-slate-800 border-slate-300">
                    {competencies.complianceAndSOP.score}/100 • {competencies.complianceAndSOP.level}
                  </Badge>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-slate-700 h-1.5 rounded-full"
                    style={{ width: `${competencies.complianceAndSOP.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {competencies.complianceAndSOP.desc}
                </p>
              </div>

              {/* Pillar 4: Crew Teamwork */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">4. Koordinasi Tim & Keharmonisan Kru</span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                    {competencies.crewTeamwork.score}/100 • {competencies.crewTeamwork.level}
                  </Badge>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${competencies.crewTeamwork.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {competencies.crewTeamwork.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Descriptive Chips */}
          {descChips.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">
                Karakteristik & Kata Kunci Perilaku Teramati (Observed Trait Words):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {descChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Psychological Narrative Deep-Dive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Character & Mindset */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <h5 className="text-xs font-bold text-slate-900">Ulasan Karakter & Pola Pikir Lengkap</h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {candidate.character}
              </p>
            </div>

            {/* Motivation & Drivers */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <h5 className="text-xs font-bold text-slate-900">Faktor Pendorong Motivasi Diri (Self Motivation)</h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {candidate.motivation}
              </p>
            </div>

            {/* Job Emphasis */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <h5 className="text-xs font-bold text-slate-900">Penekanan Tugas & Penempatan Kerja Ideal</h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {candidate.jobEmphasis}
              </p>
            </div>

            {/* Under Pressure Behavior */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h5 className="text-xs font-bold text-slate-900">Respon Perilaku di Bawah Tekanan Operasional</h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {candidate.underPressure}
              </p>
            </div>
          </div>

          {/* Assessor Structured Interview Guide */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                  Panduan Pertanyaan Wawancara Konfirmasi HR Asesor (Targeted Interview Guide)
                </h5>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">HR Specialist Toolkit</span>
            </div>

            <p className="text-xs text-slate-300">
              Gunakan pertanyaan berikut dalam sesi wawancara teknis/HR untuk mengonfirmasi titik adaptasi psikologis kandidat:
            </p>

            <div className="space-y-2">
              {interviewQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg text-xs text-slate-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-900 text-[10px] font-bold text-sky-200">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
