"use client";

import { DISCCandidate } from "../_hooks/useDISCAnalytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  ShieldCheck,
  Award,
  Sparkles,
  Zap,
  Target,
  FileText,
  Activity,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Line } from "react-chartjs-2";

interface PsychogramDetailCardProps {
  candidate: DISCCandidate | null;
}

export function PsychogramDetailCard({ candidate }: PsychogramDetailCardProps) {
  if (!candidate) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-8 text-center text-slate-500 text-xs">
        Pilih salah satu kandidat pada tabel di bawah untuk melihat kartu psikogram dan ulasan karakter mendalam.
      </Card>
    );
  }

  // Candidate Specific Triple Graph Data
  const candidateChartData = {
    labels: ["Dominance (D)", "Influence (I)", "Steadiness (S)", "Compliance (C)"],
    datasets: [
      {
        label: "Graph I (Work Mask / Sehari-hari)",
        data: [candidate.graph1.d, candidate.graph1.i, candidate.graph1.s, candidate.graph1.c],
        borderColor: "#0284c7",
        backgroundColor: "rgba(2, 132, 199, 0.15)",
        borderWidth: 2.5,
        pointRadius: 5,
        tension: 0.15,
      },
      {
        label: "Graph II (Core / Under Pressure)",
        data: [candidate.graph2.d, candidate.graph2.i, candidate.graph2.s, candidate.graph2.c],
        borderColor: "#e11d48",
        backgroundColor: "rgba(225, 29, 72, 0.15)",
        borderWidth: 2.5,
        pointRadius: 5,
        tension: 0.15,
      },
      {
        label: "Graph III (Mirror / Integrasi)",
        data: [candidate.graph3.d, candidate.graph3.i, candidate.graph3.s, candidate.graph3.c],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderWidth: 2.5,
        borderDash: [5, 5],
        pointRadius: 5,
        tension: 0.15,
      },
    ],
  };

  const candidateChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 10,
          usePointStyle: true,
          font: { size: 11 },
          color: "#334155",
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
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

  // Parse Desc Words to Chips
  const descChips = candidate.descWords
    ? candidate.descWords
        .split(",")
        .map((w) => w.trim().replace(/^["']|["']$/g, ""))
        .filter((w) => w.length > 0)
    : [];

  const getDominantBadge = (type: string) => {
    switch (type) {
      case "D":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs px-2.5 py-1">Dominance (D) - Hasil & Ketegasan</Badge>;
      case "I":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-2.5 py-1">Influence (I) - Komunikasi & Antusias</Badge>;
      case "S":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-2.5 py-1">Steadiness (S) - Ketenangan & Loyalitas</Badge>;
      case "C":
        return <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs px-2.5 py-1">Conscientiousness (C) - Akurasi & Kepatuhan</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
      {/* Header Profile */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 shrink-0">
              <User className="w-6 h-6 text-slate-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">{candidate.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  {candidate.id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {candidate.consistency}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                NIK: <span className="font-mono text-slate-200">{candidate.nik}</span> | Email:{" "}
                <span className="text-slate-200">{candidate.email}</span> | Tanggal:{" "}
                <span className="text-slate-200">{candidate.date}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs h-8 bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Psikogram
            </Button>
          </div>
        </div>

        {/* Trait Indicators */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          <div>{getDominantBadge(candidate.dominantType)}</div>
          <div className="text-slate-300">
            Pola Trait: <strong className="text-white font-mono">{candidate.traitM}</strong>
          </div>
          <div className="text-slate-300">
            Respon Tekanan: <strong className="text-white font-mono">{candidate.traitL}</strong>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Section 1: Visual Triple Graph & Desc Words */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 3-Line DISC Chart */}
          <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-700" />
                Plotting Grafik 3-Garis DISC
              </h4>
              <span className="text-[11px] text-slate-500">Nilai Skala Baku</span>
            </div>
            <div className="h-56">
              <Line data={candidateChartData} options={candidateChartOptions} />
            </div>
          </div>

          {/* Right: Desc Words & Key Motivation */}
          <div className="lg:col-span-6 space-y-4">
            {/* Chips Kata Kunci Kepribadian */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Kata Kunci Karakteristik (Psychometric Keywords)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {descChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-white text-slate-800 border border-slate-200 shadow-xs"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Motivasi Diri */}
            {candidate.motivation && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Faktor Motivasi Diri (Self Motivation)
                </h4>
                <p className="text-slate-700 leading-relaxed">{candidate.motivation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Deep Psychological Narrative Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Karakter Lengkap */}
          {candidate.character && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-700" />
                Ulasan Karakter & Pola Pikir (His/Her Character)
              </h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{candidate.character}</p>
            </div>
          )}

          {/* Penekanan Tugas & Penempatan Kerja */}
          {candidate.jobEmphasis && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-700" />
                Kesesuaian Tugas & Penempatan Operasional (Job Emphasis)
              </h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{candidate.jobEmphasis}</p>
            </div>
          )}

          {/* Gaya Kerja Sehari-hari (Graph I) */}
          {candidate.workMask && (
            <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-sky-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-700" />
                Gaya Kerja Sehari-hari (Work Mask Behavior)
              </h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{candidate.workMask}</p>
            </div>
          )}

          {/* Respon Di Bawah Tekanan (Graph II) */}
          {candidate.underPressure && (
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-rose-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-700" />
                Respon di Bawah Tekanan Kerja Laut (Under Pressure Behavior)
              </h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{candidate.underPressure}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
