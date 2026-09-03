"use client";

import { useMemo, useState } from "react";
import { DISCCandidate, DISCSummary } from "../_hooks/useDISCAnalytics";
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
  FileText,
  Activity,
  Printer,
  ChevronLeft,
  ChevronRight,
  Compass,
  AlertTriangle,
  Scale,
  Zap,
  Target,
  Sliders,
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

  // Filter candidates for switcher dropdown
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
        <p className="text-sm text-slate-500">Pilih salah satu kandidat untuk memuat psikogram personal.</p>
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

  // Dimensions & Vectors Array
  const dimensions = [
    {
      dimension: "D",
      label: "Dominance",
      g1: candidate.graph1.d,
      g2: candidate.graph2.d,
      g3: candidate.graph3.d,
      popAvg: summary.avgGraph3.d,
      deltaPop: Number((candidate.graph3.d - summary.avgGraph3.d).toFixed(2)),
      deltaStress: Number(Math.abs(candidate.graph1.d - candidate.graph2.d).toFixed(2)),
    },
    {
      dimension: "I",
      label: "Influence",
      g1: candidate.graph1.i,
      g2: candidate.graph2.i,
      g3: candidate.graph3.i,
      popAvg: summary.avgGraph3.i,
      deltaPop: Number((candidate.graph3.i - summary.avgGraph3.i).toFixed(2)),
      deltaStress: Number(Math.abs(candidate.graph1.i - candidate.graph2.i).toFixed(2)),
    },
    {
      dimension: "S",
      label: "Steadiness",
      g1: candidate.graph1.s,
      g2: candidate.graph2.s,
      g3: candidate.graph3.s,
      popAvg: summary.avgGraph3.s,
      deltaPop: Number((candidate.graph3.s - summary.avgGraph3.s).toFixed(2)),
      deltaStress: Number(Math.abs(candidate.graph1.s - candidate.graph2.s).toFixed(2)),
    },
    {
      dimension: "C",
      label: "Compliance",
      g1: candidate.graph1.c,
      g2: candidate.graph2.c,
      g3: candidate.graph3.c,
      popAvg: summary.avgGraph3.c,
      deltaPop: Number((candidate.graph3.c - summary.avgGraph3.c).toFixed(2)),
      deltaStress: Number(Math.abs(candidate.graph1.c - candidate.graph2.c).toFixed(2)),
    },
  ];

  // Parse Desc Words to Chips
  const descChips = candidate.descWords
    ? candidate.descWords
        .split(/[,;\n]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0 && w !== "-" && !w.toLowerCase().includes("belum ada"))
    : [];

  // 1. Triple-Graph Line Chart Data (with Batch Population Average Overlay)
  const lineChartData = {
    labels: ["Dominance (D)", "Influence (I)", "Steadiness (S)", "Compliance (C)"],
    datasets: [
      {
        label: "Graph I (Work Mask / Sehari-hari)",
        data: [candidate.graph1.d, candidate.graph1.i, candidate.graph1.s, candidate.graph1.c],
        borderColor: "#0284c7", // Blue
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
        label: `Rata-rata Populasi Batch (${summary.totalCandidates} Kandidat)`,
        data: [summary.avgGraph3.d, summary.avgGraph3.i, summary.avgGraph3.s, summary.avgGraph3.c],
        borderColor: "#d97706", // Crisp Amber 600
        backgroundColor: "rgba(217, 119, 6, 0.12)",
        borderWidth: 2.5,
        borderDash: [5, 4],
        pointRadius: 5,
        pointBackgroundColor: "#d97706",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
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
        backgroundColor: "#1e293b",
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

  // 2. DISC Radar Chart Data (Candidate vs Batch Population Average)
  const radarChartData = {
    labels: [
      "Dominance (D)",
      "Influence (I)",
      "Steadiness (S)",
      "Compliance (C)",
    ],
    datasets: [
      {
        label: `Profil ${candidate.name} (Graph III)`,
        data: [
          candidate.graph3.d,
          candidate.graph3.i,
          candidate.graph3.s,
          candidate.graph3.c,
        ],
        backgroundColor: "rgba(2, 132, 199, 0.2)",
        borderColor: "#0284c7",
        borderWidth: 2,
        pointBackgroundColor: "#0284c7",
        pointRadius: 4,
      },
      {
        label: `Rata-rata Populasi Batch (${summary.totalCandidates} Kandidat)`,
        data: [
          summary.avgGraph3.d,
          summary.avgGraph3.i,
          summary.avgGraph3.s,
          summary.avgGraph3.c,
        ],
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderColor: "#d97706",
        borderWidth: 2,
        borderDash: [4, 4],
        pointBackgroundColor: "#d97706",
        pointRadius: 4,
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
          font: { size: 11, weight: 600 },
          color: "#334155",
        },
        ticks: { display: true, color: "#94a3b8", font: { size: 8 } },
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

  // Euclidean Distance of Stress Shift (|G1 - G2|)
  const stressShiftValue = Math.sqrt(
    Math.pow((candidate.graph1.d || 0) - (candidate.graph2.d || 0), 2) +
    Math.pow((candidate.graph1.i || 0) - (candidate.graph2.i || 0), 2) +
    Math.pow((candidate.graph1.s || 0) - (candidate.graph2.s || 0), 2) +
    Math.pow((candidate.graph1.c || 0) - (candidate.graph2.c || 0), 2)
  );

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION & CANDIDATE SWITCHER (Light Grey SPIL Theme) ─────── */}
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
            <SelectTrigger className="h-8.5 text-xs font-medium border-slate-200 bg-slate-50/70">
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
              <Scale className="w-3.5 h-3.5 text-slate-600" />
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

      {/* ── CANDIDATE HEADER (SPIL Corporate Slate Grey Theme) ──────────── */}
      <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <div className="bg-slate-100/80 border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{candidate.name}</h2>
                <Badge
                  variant="outline"
                  className="text-[11px] font-bold px-2.5 py-0.5 bg-white text-slate-800 border-slate-300 shadow-2xs"
                >
                  Dominan: Tipe {candidate.dominantType} ({candidate.traitM})
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-medium px-2.5 py-0.5 border ${
                    candidate.consistency.includes("Still")
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : candidate.consistency.includes("Note")
                      ? "bg-slate-200/80 text-slate-700 border-slate-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  {candidate.consistency}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                <span>NIK: {candidate.nik}</span>
                <span>•</span>
                <span>Email: {candidate.email}</span>
                <span>•</span>
                <span>Tanggal Asesmen: {candidate.date}</span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end bg-white border border-slate-200 p-3 rounded-lg shrink-0 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pola Trait Psikometri:
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-slate-900 font-mono">M: {candidate.traitM}</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-mono text-slate-600">L: {candidate.traitL}</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-mono text-slate-600">P-K: {candidate.traitPk}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Numeric Vector Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 divide-x divide-slate-100 bg-slate-50/50">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="p-3.5 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                {dim.dimension} - {dim.dimension === "D" ? "Dominance" : dim.dimension === "I" ? "Influence" : dim.dimension === "S" ? "Steadiness" : "Compliance"}
              </span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
                {dim.g3 >= 0 ? `+${dim.g3}` : dim.g3}
              </span>
              <span className="text-[10px] text-slate-500">
                Populasi: {dim.popAvg >= 0 ? `+${dim.popAvg}` : dim.popAvg} ({dim.deltaPop >= 0 ? `+${dim.deltaPop}` : dim.deltaPop})
              </span>
            </div>
          ))}
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
                    Kurva Vektor 3-Garis DISC & Rata-Rata Populasi
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Graph I, II, III</span>
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
                    Radar Keseimbangan Dimensi DISC
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Radar 4-Axis</span>
              </div>
              <div className="h-64 w-full">
                <Radar data={radarChartData} options={radarChartOptions} />
              </div>
            </div>
          </div>

          {/* Real Dimensional Vector Table (Data Mentah & Analisis Pergeseran) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rincian Vektor Numerik 4 Dimensi DISC (Data Otentik Asesmen)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Stress Shift Delta: <strong>{stressShiftValue.toFixed(2)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Dimensi DISC</th>
                    <th className="py-2.5 px-3 text-center">Graph I (Mask)</th>
                    <th className="py-2.5 px-3 text-center">Graph II (Core)</th>
                    <th className="py-2.5 px-3 text-center">Graph III (Mirror)</th>
                    <th className="py-2.5 px-3 text-center">Rata-rata Batch</th>
                    <th className="py-2.5 px-3 text-center">Deviasi (|G3 - Mean|)</th>
                    <th className="py-2.5 px-3 text-center">Pergeseran Stres (|G1 - G2|)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dimensions.map((dim, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 font-mono">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800">{dim.dimension} - {dim.label}</td>
                      <td className="py-2 px-3 text-center text-slate-700">{dim.g1 >= 0 ? `+${dim.g1}` : dim.g1}</td>
                      <td className="py-2 px-3 text-center text-slate-700">{dim.g2 >= 0 ? `+${dim.g2}` : dim.g2}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{dim.g3 >= 0 ? `+${dim.g3}` : dim.g3}</td>
                      <td className="py-2 px-3 text-center text-slate-500">{dim.popAvg >= 0 ? `+${dim.popAvg}` : dim.popAvg}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                          dim.deltaPop > 0 ? "bg-blue-50 text-blue-700" : dim.deltaPop < 0 ? "bg-slate-100 text-slate-600" : "text-slate-400"
                        }`}>
                          {dim.deltaPop > 0 ? `+${dim.deltaPop}` : dim.deltaPop}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700">{dim.deltaStress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Descriptive Chips */}
          {descChips.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">
                Kata Kunci Karakteristik Teramati (Desc. Words dari Asesmen):
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

          {/* Psychological Narrative Deep-Dive Cards (Real Text From CSV) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Character & Mindset */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <h5 className="text-xs font-bold text-slate-900">Ulasan Karakter & Pola Pikir (His/Her Character)</h5>
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
                <h5 className="text-xs font-bold text-slate-900">Penekanan Tugas & Penempatan Ideal (Job Emphasis)</h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {candidate.jobEmphasis}
              </p>
            </div>

            {/* Under Pressure Behavior */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h5 className="text-xs font-bold text-slate-900">Respon di Bawah Tekanan Kerja (Under Pressure)</h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {candidate.underPressure}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
