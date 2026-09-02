"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, TrendingUp, Compass, CheckCircle2 } from "lucide-react";
import { DISCSummary } from "../_hooks/useDISCAnalytics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface DISCChartsProps {
  summary: DISCSummary;
}

export function DISCCharts({ summary }: DISCChartsProps) {
  // 1. DISC Dimensions Distribution Doughnut Data
  const discDoughnutData = {
    labels: [
      "Dominance (D - Tegas & Hasil)",
      "Influence (I - Komunikasi & Antusias)",
      "Steadiness (S - Sabar & Tenang)",
      "Conscientiousness (C - Teliti & Akurat)",
    ],
    datasets: [
      {
        data: [
          summary.dominantCounts.D,
          summary.dominantCounts.I,
          summary.dominantCounts.S,
          summary.dominantCounts.C,
        ],
        backgroundColor: [
          "#0f172a", // Slate 900 (Dominance)
          "#334155", // Slate 700 (Influence)
          "#0f766e", // Deep Teal (Steadiness)
          "#0284c7", // Corporate Blue (Conscientiousness)
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const discDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
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
    cutout: "68%",
  };

  // 2. Average Triple Graph Lines (Graph I Mask, Graph II Core, Graph III Mirror)
  const tripleGraphData = {
    labels: ["Dominance (D)", "Influence (I)", "Steadiness (S)", "Compliance (C)"],
    datasets: [
      {
        label: "Graph I: Mask (Tuntutan Lingkungan)",
        data: [summary.avgGraph1.d, summary.avgGraph1.i, summary.avgGraph1.s, summary.avgGraph1.c],
        borderColor: "#0284c7",
        backgroundColor: "rgba(2, 132, 199, 0.08)",
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.2,
      },
      {
        label: "Graph II: Core (Respon Tekanan)",
        data: [summary.avgGraph2.d, summary.avgGraph2.i, summary.avgGraph2.s, summary.avgGraph2.c],
        borderColor: "#475569",
        backgroundColor: "rgba(71, 85, 105, 0.08)",
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.2,
      },
      {
        label: "Graph III: Mirror (Integrasi Terlihat)",
        data: [summary.avgGraph3.d, summary.avgGraph3.i, summary.avgGraph3.s, summary.avgGraph3.c],
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.08)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 4,
        tension: 0.2,
      },
    ],
  };

  const tripleGraphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 10,
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 10 },
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
        grid: { color: "rgba(226, 232, 240, 0.7)" },
      },
      x: {
        ticks: { color: "#334155", font: { size: 11, weight: 500 } },
        grid: { display: false },
      },
    },
  };

  // 3. Top DISC Trait Patterns
  const traitData = {
    labels: summary.topTraits.map((t) => t.trait),
    datasets: [
      {
        label: "Jumlah Kandidat",
        data: summary.topTraits.map((t) => t.count),
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        borderColor: "#0f172a",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const traitOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 5, color: "#64748b", font: { size: 10 } },
        grid: { color: "rgba(226, 232, 240, 0.7)" },
      },
      y: {
        ticks: { color: "#334155", font: { size: 11, weight: 500 } },
        grid: { display: false },
      },
    },
  };

  // 4. Consistency Reliability Doughnut Data (Filter only active counts)
  const activeConsistency = Object.entries(summary.consistencyCounts).filter(([, val]) => val > 0);
  const consistencyLabels = activeConsistency.map(([k, v]) => `${k} (${v} kandidat)`);
  const consistencyValues = activeConsistency.map(([, v]) => v);
  const consistencyColors = activeConsistency.map(([k]) => {
    if (k.toLowerCase().includes("still")) return "#10b981"; // Emerald Green for Still Consistent
    if (k.toLowerCase().includes("note")) return "#94a3b8";  // Muted Slate for Note for Assessor
    return "#f59e0b"; // Amber for Incomplete
  });

  const consistencyData = {
    labels: consistencyLabels,
    datasets: [
      {
        data: consistencyValues,
        backgroundColor: consistencyColors,
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const consistencyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 10 },
          color: "#334155",
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
      },
    },
    cutout: "65%",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: DISC Distribution */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-700" />
            Distribusi Dimensi Kepribadian Dominan (D - I - S - C)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Proporsi karakter dominan dari {summary.totalCandidates} kandidat rekrutmen PT SPIL.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Doughnut data={discDoughnutData} options={discDoughnutOptions} />
        </CardContent>
      </Card>

      {/* Chart 2: Average Triple Graph (DISC Behavior Under Pressure vs Mask) */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            Rata-Rata Profil DISC 3-Grafik (Work Mask vs Under Pressure)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Perbandingan respon perilaku sehari-hari dengan respon saat menghadapi tekanan operasional.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Line data={tripleGraphData} options={tripleGraphOptions} />
        </CardContent>
      </Card>

      {/* Chart 3: Top Trait Patterns */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-slate-700" />
            Sebaran Pola Kombinasi Trait Terpopuler (DISC Pattern)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Kombinasi kepribadian kerja yang paling dominan ditemukan pada pelamar.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Bar data={traitData} options={traitOptions} />
        </CardContent>
      </Card>

      {/* Chart 4: Consistency Rate */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700" />
            Indeks Reliabilitas & Konsistensi Asesmen (Test Consistency)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Tingkat kejujuran dan konsistensi kandidat saat menjawab kuesioner Most & Least.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Doughnut data={consistencyData} options={consistencyOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
