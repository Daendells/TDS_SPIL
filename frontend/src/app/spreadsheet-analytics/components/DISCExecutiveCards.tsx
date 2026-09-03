"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DISCSummary } from "../_hooks/useDISCAnalytics";
import {
  Users,
  Award,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface DISCExecutiveCardsProps {
  summary: DISCSummary;
}

export function DISCExecutiveCards({ summary }: DISCExecutiveCardsProps) {
  const dominantLeader =
    summary.dominantCounts.I >= summary.dominantCounts.C
      ? `Influence (I - ${summary.dominantCounts.I})`
      : `Compliance (C - ${summary.dominantCounts.C})`;

  return (
    <div className="space-y-5">
      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Data Kandidat</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {summary.totalCandidates} <span className="text-xs font-normal text-slate-500">Kandidat</span>
              </h3>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Resume psikometri DISC SPIL</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tingkat Konsistensi</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{summary.consistentPercentage}%</h3>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                {summary.consistencyCounts["Still Consistent"] || 0} kandidat valid
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dimensi Terbanyak</p>
              <h3 className="text-xs font-bold text-slate-900 mt-1">{dominantLeader}</h3>
              <p className="text-[10.5px] text-slate-500 mt-0.5 font-mono">
                D:{summary.dominantCounts.D} | I:{summary.dominantCounts.I} | S:{summary.dominantCounts.S} | C:{summary.dominantCounts.C}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Rata-Rata Vektor (G3)</p>
              <h3 className="text-xs font-bold text-slate-900 mt-1 font-mono">
                D:{summary.avgGraph3.d} I:{summary.avgGraph3.i} S:{summary.avgGraph3.s} C:{summary.avgGraph3.c}
              </h3>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                Top Trait: <strong className="text-slate-700">{summary.topTraits[0]?.trait || "I/S"}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clean Corporate SPIL Grey Executive Summary Card */}
      <Card className="border border-slate-200 shadow-2xs bg-slate-50/80 rounded-xl overflow-hidden">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rangkuman Statistik & Distribusi Vektor Populasi Rekrutmen SPIL
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {summary.executiveInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white border border-slate-200/80 p-3 rounded-lg text-xs text-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
