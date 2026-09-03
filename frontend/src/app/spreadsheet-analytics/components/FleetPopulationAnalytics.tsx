"use client";

import { DISCSummary } from "../_hooks/useDISCAnalytics";
import { DISCExecutiveCards } from "./DISCExecutiveCards";
import { DISCCharts } from "./DISCCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles, TrendingUp, CheckCircle2, BarChart2 } from "lucide-react";

interface FleetPopulationAnalyticsProps {
  summary: DISCSummary;
}

export function FleetPopulationAnalytics({ summary }: FleetPopulationAnalyticsProps) {
  const total = summary.totalCandidates || 1;

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: EXECUTIVE STATISTICAL KPIS ────────────────────────── */}
      <DISCExecutiveCards summary={summary} />

      {/* ── SECTION 2: POPULATION CHARTS SUITE ──────────────────────────── */}
      <DISCCharts summary={summary} />
    </div>
  );
}
