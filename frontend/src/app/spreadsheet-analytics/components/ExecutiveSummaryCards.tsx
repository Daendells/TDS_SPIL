"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsSummary } from "../_hooks/useSpreadsheetParser";
import {
  Users,
  Award,
  ShieldCheck,
  Ship,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

interface ExecutiveSummaryCardsProps {
  summary: AnalyticsSummary;
}

export function ExecutiveSummaryCards({ summary }: ExecutiveSummaryCardsProps) {
  const totalVessels = Object.keys(summary.vesselCounts).length;
  const totalRanks = Object.keys(summary.rankCounts).length;

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
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Personel Terekam</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{summary.totalRecords} <span className="text-xs font-normal text-slate-500">Personel</span></h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Tersebar di {totalRanks} jabatan maritim</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rata-Rata Indeks Skor</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {summary.avgScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Max: {summary.maxScore} | Min: {summary.minScore}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Compliance Rate (≥70)</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{summary.complianceRate}%</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summary.scoreDistribution.sangatBaik + summary.scoreDistribution.baik} lulus standar kualifikasi
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cakupan Armada Kapal</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalVessels} <span className="text-xs font-normal text-slate-500">Armada</span></h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Top Divisi: <strong className="text-slate-700">{summary.topDepartment}</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Narrative Executive Summary & Actionable Recommendations */}
      <Card className="border border-slate-200 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Rangkuman Eksekutif Cerdas (Automated Intelligence Summary)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            {/* Left: Key Findings */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-lg p-3.5">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Temuan Analitik Utama:
              </p>
              <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
                {summary.insights.map((insight, idx) => (
                  <li key={idx} className="leading-relaxed">{insight}</li>
                ))}
              </ul>
            </div>

            {/* Right: Recommendations */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-lg p-3.5">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Rekomendasi Operasional & Pembinaan:
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
