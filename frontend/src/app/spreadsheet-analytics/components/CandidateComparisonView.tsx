"use client";

import { useMemo, useState } from "react";
import { DISCCandidate } from "../_data/discDataset";
import {
  calculateRoleFit,
  calculateCompetencies,
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
import { Scale, Users, User, ArrowRight, Activity, Award, ShieldCheck, Zap } from "lucide-react";
import { Radar } from "react-chartjs-2";

interface CandidateComparisonViewProps {
  candidates: DISCCandidate[];
  candidateA: DISCCandidate | null;
  candidateB: DISCCandidate | null;
  onSelectCandidateA: (c: DISCCandidate) => void;
  onSelectCandidateB: (c: DISCCandidate) => void;
  onFocusCandidate: (c: DISCCandidate) => void;
}

export function CandidateComparisonView({
  candidates,
  candidateA,
  candidateB,
  onSelectCandidateA,
  onSelectCandidateB,
  onFocusCandidate,
}: CandidateComparisonViewProps) {
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  const filteredA = useMemo(() => {
    if (!searchA) return candidates.slice(0, 40);
    return candidates
      .filter((c) => c.name.toLowerCase().includes(searchA.toLowerCase()) || c.traitM.toLowerCase().includes(searchA.toLowerCase()))
      .slice(0, 40);
  }, [candidates, searchA]);

  const filteredB = useMemo(() => {
    if (!searchB) return candidates.slice(0, 40);
    return candidates
      .filter((c) => c.name.toLowerCase().includes(searchB.toLowerCase()) || c.traitM.toLowerCase().includes(searchB.toLowerCase()))
      .slice(0, 40);
  }, [candidates, searchB]);

  if (!candidateA || !candidateB) {
    return (
      <Card className="p-8 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-xl">
        Pilih dua kandidat untuk memulai perbandingan psikometri head-to-head.
      </Card>
    );
  }

  const roleFitA = calculateRoleFit(candidateA);
  const roleFitB = calculateRoleFit(candidateB);

  const compA = calculateCompetencies(candidateA);
  const compB = calculateCompetencies(candidateB);

  const stressShiftA = Math.sqrt(
    Math.pow((candidateA.graph1.d || 0) - (candidateA.graph2.d || 0), 2) +
    Math.pow((candidateA.graph1.i || 0) - (candidateA.graph2.i || 0), 2) +
    Math.pow((candidateA.graph1.s || 0) - (candidateA.graph2.s || 0), 2) +
    Math.pow((candidateA.graph1.c || 0) - (candidateA.graph2.c || 0), 2)
  );

  const stressShiftB = Math.sqrt(
    Math.pow((candidateB.graph1.d || 0) - (candidateB.graph2.d || 0), 2) +
    Math.pow((candidateB.graph1.i || 0) - (candidateB.graph2.i || 0), 2) +
    Math.pow((candidateB.graph1.s || 0) - (candidateB.graph2.s || 0), 2) +
    Math.pow((candidateB.graph1.c || 0) - (candidateB.graph2.c || 0), 2)
  );

  // Radar Comparison Data
  const radarData = {
    labels: [
      "Dominance (Ketegasan)",
      "Influence (Komunikasi)",
      "Steadiness (Ketenangan)",
      "Compliance (Akurasi/SOP)",
    ],
    datasets: [
      {
        label: `Kandidat A: ${candidateA.name}`,
        data: [
          Math.max(0, candidateA.graph3.d + 5),
          Math.max(0, candidateA.graph3.i + 5),
          Math.max(0, candidateA.graph3.s + 5),
          Math.max(0, candidateA.graph3.c + 5),
        ],
        backgroundColor: "rgba(2, 132, 199, 0.25)",
        borderColor: "#0284c7",
        borderWidth: 2.5,
        pointBackgroundColor: "#0284c7",
        pointRadius: 4,
      },
      {
        label: `Kandidat B: ${candidateB.name}`,
        data: [
          Math.max(0, candidateB.graph3.d + 5),
          Math.max(0, candidateB.graph3.i + 5),
          Math.max(0, candidateB.graph3.s + 5),
          Math.max(0, candidateB.graph3.c + 5),
        ],
        backgroundColor: "rgba(15, 118, 110, 0.25)",
        borderColor: "#0f766e",
        borderWidth: 2.5,
        pointBackgroundColor: "#0f766e",
        pointRadius: 4,
      },
    ],
  };

  const radarOptions = {
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
        ticks: { display: false },
        min: 0,
        max: 10,
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          font: { size: 11 },
          color: "#334155",
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* ── TOP CANDIDATE SELECTORS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Candidate A Selector */}
        <Card className="border border-blue-200 bg-blue-50/30 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" /> KANDIDAT A (Kandidat Utama)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFocusCandidate(candidateA)}
              className="h-6 text-[11px] text-blue-700 hover:bg-blue-100 p-1"
            >
              Buka Dossier Personal →
            </Button>
          </div>
          <Select
            value={candidateA.id}
            onValueChange={(val) => {
              const found = candidates.find((c) => c.id === val);
              if (found) onSelectCandidateA(found);
            }}
          >
            <SelectTrigger className="h-8.5 text-xs bg-white border-blue-200 font-semibold">
              <SelectValue placeholder="Pilih Kandidat A..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="p-2">
                <Input
                  placeholder="Cari nama / NIK..."
                  value={searchA}
                  onChange={(e) => setSearchA(e.target.value)}
                  className="h-7 text-xs mb-1"
                />
              </div>
              {filteredA.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name} ({c.traitM})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Candidate B Selector */}
        <Card className="border border-teal-200 bg-teal-50/30 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-600" /> KANDIDAT B (Kandidat Pembanding)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFocusCandidate(candidateB)}
              className="h-6 text-[11px] text-teal-700 hover:bg-teal-100 p-1"
            >
              Buka Dossier Personal →
            </Button>
          </div>
          <Select
            value={candidateB.id}
            onValueChange={(val) => {
              const found = candidates.find((c) => c.id === val);
              if (found) onSelectCandidateB(found);
            }}
          >
            <SelectTrigger className="h-8.5 text-xs bg-white border-teal-200 font-semibold">
              <SelectValue placeholder="Pilih Kandidat B..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="p-2">
                <Input
                  placeholder="Cari nama / NIK..."
                  value={searchB}
                  onChange={(e) => setSearchB(e.target.value)}
                  className="h-7 text-xs mb-1"
                />
              </div>
              {filteredB.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name} ({c.traitM})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>

      {/* ── COMPARISON RADAR & MATRIX ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Comparative Radar */}
        <Card className="lg:col-span-5 border border-slate-200 shadow-xs bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Overlay Radar Perbandingan DISC
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Head-to-Head</span>
          </div>
          <div className="h-72 w-full">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </Card>

        {/* Right: Comparative Side-by-Side Breakdown */}
        <Card className="lg:col-span-7 border border-slate-200 shadow-xs bg-white rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Matriks Perbandingan Profil & Kesiapan Jabatan Maritim
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                  <th className="py-2 px-3 font-semibold">Aspek Evaluasi</th>
                  <th className="py-2 px-3 font-bold text-blue-700">Kandidat A: {candidateA.name}</th>
                  <th className="py-2 px-3 font-bold text-teal-700">Kandidat B: {candidateB.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-600">Pola Trait Dominan</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{candidateA.traitM} (Tipe {candidateA.dominantType})</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{candidateB.traitM} (Tipe {candidateB.dominantType})</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-600">Rekomendasi Jabatan</td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-bold">
                      {roleFitA.recommendedRole}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 font-bold">
                      {roleFitB.recommendedRole}
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-600">Kepemimpinan & Komando</td>
                  <td className="py-2.5 px-3 font-bold">{compA.leadershipAndCommand.score}/100</td>
                  <td className="py-2.5 px-3 font-bold">{compB.leadershipAndCommand.score}/100</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-600">Ketahanan Krisis di Laut</td>
                  <td className="py-2.5 px-3 font-bold">{compA.stressResilience.score}/100</td>
                  <td className="py-2.5 px-3 font-bold">{compB.stressResilience.score}/100</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-600">Kepatuhan ISM & SOP</td>
                  <td className="py-2.5 px-3 font-bold">{compA.complianceAndSOP.score}/100</td>
                  <td className="py-2.5 px-3 font-bold">{compB.complianceAndSOP.score}/100</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-600">Koordinasi Tim & Kru</td>
                  <td className="py-2.5 px-3 font-bold">{compA.crewTeamwork.score}/100</td>
                  <td className="py-2.5 px-3 font-bold">{compB.crewTeamwork.score}/100</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-600">Reliabilitas Ujian</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-700">{candidateA.consistency}</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-700">{candidateB.consistency}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
