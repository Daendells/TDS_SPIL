"use client";

import { DISCSummary } from "../_hooks/useDISCAnalytics";
import { DISCExecutiveCards } from "./DISCExecutiveCards";
import { DISCCharts } from "./DISCCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, Wrench, Compass, Users, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

interface FleetPopulationAnalyticsProps {
  summary: DISCSummary;
}

export function FleetPopulationAnalytics({ summary }: FleetPopulationAnalyticsProps) {
  const total = summary.totalCandidates || 1;

  const roleCategories = [
    {
      title: "Departemen Dek (Nakhoda / Mualim)",
      count: summary.roleDistribution.deckDept,
      pct: Math.round((summary.roleDistribution.deckDept / total) * 100),
      desc: "Kandidat berprofil Dominance & Conscientiousness tinggi untuk kepemimpinan tangguh dan navigasi taat regulasi.",
      icon: Ship,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Departemen Mesin (KKM / Masinis)",
      count: summary.roleDistribution.engineDept,
      pct: Math.round((summary.roleDistribution.engineDept / total) * 100),
      desc: "Kandidat berprofil Conscientiousness & Steadiness tinggi untuk perawatan mesin presisi dan disiplin checklist.",
      icon: Wrench,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Dinas Jaga & Navigasi Radio",
      count: summary.roleDistribution.watchkeeping,
      pct: Math.round((summary.roleDistribution.watchkeeping / total) * 100),
      desc: "Kandidat dengan tingkat ketenangan & kesabaran tinggi untuk kewaspadaan jadwal dinas jaga malam di laut.",
      icon: Compass,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    {
      title: "Operasional Kru & Logistik",
      count: summary.roleDistribution.crewCoordination,
      pct: Math.round((summary.roleDistribution.crewCoordination / total) * 100),
      desc: "Kandidat komunikatif dan adaptif untuk koordinasi keharmonisan kru, bosun, dan logistik pelabuhan.",
      icon: Users,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      badgeColor: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: EXECUTIVE KPIS & NARRATIVE BLACK CARD ─────────────── */}
      <DISCExecutiveCards summary={summary} />

      {/* ── SECTION 2: MARITIME ROLE SUITABILITY MATRIX ───────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Matriks Kesesuaian Departemen Kapal (Maritime Role Fit Distribution)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {roleCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Card key={idx} className="border border-slate-200 shadow-2xs bg-white rounded-xl p-4 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg border ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant="outline" className={`text-xs font-bold border-0 ${cat.badgeColor}`}>
                      {cat.count} Orang ({cat.pct}%)
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{cat.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: `${cat.pct}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: VISUAL CHARTS SUITE ──────────────────────────────── */}
      <DISCCharts summary={summary} />
    </div>
  );
}
