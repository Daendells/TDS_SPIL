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
  Lightbulb,
} from "lucide-react";

interface DISCExecutiveCardsProps {
  summary: DISCSummary;
}

export function DISCExecutiveCards({ summary }: DISCExecutiveCardsProps) {
  const dominantLeader =
    summary.dominantCounts.D >= summary.dominantCounts.C
      ? `Dominance (D - ${summary.dominantCounts.D})`
      : `Compliance (C - ${summary.dominantCounts.C})`;

  return (
    <div className="space-y-5">
      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Kandidat Asesmen</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {summary.totalCandidates} <span className="text-xs font-normal text-slate-500">Kandidat</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Data resume psikometri DISC SPIL</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tingkat Konsistensi</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{summary.consistentPercentage}%</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Jawaban valid & konsisten</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700 shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Profil Dominan Utama</p>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{dominantLeader}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                D: {summary.dominantCounts.D} | I: {summary.dominantCounts.I} | S: {summary.dominantCounts.S} | C: {summary.dominantCounts.C}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rata-Rata Skala DISC</p>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                D:{summary.avgGraph1.d} I:{summary.avgGraph1.i} S:{summary.avgGraph1.s} C:{summary.avgGraph1.c}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Top Trait: <strong className="text-slate-700">{summary.topTraits[0]?.trait || "D/C"}</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Narrative Executive Summary */}
      <Card className="border border-slate-200 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Rangkuman Eksekutif Psikometri & Analitik Karakter Rekrutmen SPIL
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            {/* Left: Key Findings */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-lg p-3.5">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Temuan Psikometrik Utama:
              </p>
              <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
                {summary.executiveInsights.map((insight, idx) => (
                  <li key={idx} className="leading-relaxed">{insight}</li>
                ))}
              </ul>
            </div>

            {/* Right: Recommendations */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-lg p-3.5">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Rekomendasi Penempatan & Rekrutmen:
              </p>
              <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
                {summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
