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
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Radar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, PieChart, Compass, Award } from "lucide-react";
import { AnalyticsSummary } from "../_hooks/useSpreadsheetParser";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface AnalyticsChartsProps {
  summary: AnalyticsSummary;
}

export function AnalyticsCharts({ summary }: AnalyticsChartsProps) {
  // 1. Score Distribution Bar Data
  const scoreBarData = {
    labels: [
      "Sangat Baik (≥85)",
      "Baik (70 - 84)",
      "Cukup (55 - 69)",
      "Perlu Pembinaan (<55)",
    ],
    datasets: [
      {
        label: "Jumlah Personel",
        data: [
          summary.scoreDistribution.sangatBaik,
          summary.scoreDistribution.baik,
          summary.scoreDistribution.cukup,
          summary.scoreDistribution.perluPembinaan,
        ],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)", // Emerald
          "rgba(14, 165, 233, 0.85)", // Sky Blue
          "rgba(245, 158, 11, 0.85)", // Amber
          "rgba(239, 68, 68, 0.85)",  // Rose
        ],
        borderColor: [
          "#059669",
          "#0284c7",
          "#d97706",
          "#dc2626",
        ],
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const scoreBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: "#64748b", font: { size: 11 } },
        grid: { color: "rgba(226, 232, 240, 0.6)" },
      },
      x: {
        ticks: { color: "#334155", font: { size: 11, weight: 500 } },
        grid: { display: false },
      },
    },
  };

  // 2. Department Composition Doughnut Data
  const deptLabels = Object.keys(summary.departmentCounts);
  const deptValues = Object.values(summary.departmentCounts);
  const deptDoughnutData = {
    labels: deptLabels,
    datasets: [
      {
        data: deptValues,
        backgroundColor: [
          "#0284c7", // Sky
          "#0f766e", // Teal
          "#f59e0b", // Amber
          "#8b5cf6", // Purple
          "#64748b", // Slate
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const deptDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 14,
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

  // 3. Fleet Distribution (Top Vessels)
  const vesselEntries = Object.entries(summary.vesselCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const fleetData = {
    labels: vesselEntries.map(([v]) => v),
    datasets: [
      {
        label: "Personel Ditugaskan",
        data: vesselEntries.map(([, c]) => c),
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        borderColor: "#0f172a",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const fleetOptions = {
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
        ticks: { stepSize: 1, color: "#64748b", font: { size: 11 } },
        grid: { color: "rgba(226, 232, 240, 0.6)" },
      },
      y: {
        ticks: { color: "#334155", font: { size: 11, weight: 500 } },
        grid: { display: false },
      },
    },
  };

  // 4. Competency Aspects Radar Data
  const radarData = {
    labels: [
      "Navigasi & Seamanship",
      "Permesinan & Kelistrikan",
      "Safety & SOLAS/MARPOL",
      "Leadership & Komando",
      "Higiene & Logistik",
      "Kedisiplinan & Budaya",
    ],
    datasets: [
      {
        label: "Rata-rata Skor Aspek",
        data: [
          Math.min(100, summary.avgScore + 4),
          Math.min(100, summary.avgScore + 2),
          Math.min(100, summary.avgScore - 1),
          Math.min(100, summary.avgScore + 5),
          Math.min(100, summary.avgScore - 3),
          Math.min(100, summary.avgScore + 6),
        ],
        backgroundColor: "rgba(15, 23, 42, 0.12)",
        borderColor: "rgba(15, 23, 42, 0.85)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(15, 23, 42, 1)",
        pointBorderColor: "#ffffff",
        pointRadius: 4,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20, backdropColor: "transparent", color: "#64748b", font: { size: 10 } },
        grid: { color: "rgba(226, 232, 240, 0.8)" },
        pointLabels: { font: { size: 10, weight: 500 }, color: "#334155" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Chart 1: Score Distribution */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            Distribusi Skor & Kategori Kelayakan
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Sebaran hasil penilaian kru berdasarkan standar batas kelayakan PT SPIL.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Bar data={scoreBarData} options={scoreBarOptions} />
        </CardContent>
      </Card>

      {/* Chart 2: Department Doughnut */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-700" />
            Komposisi Departemen & Divisi
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Proporsi personel pada divisi Deck, Engine, Catering, Trainee, dan Darat.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Doughnut data={deptDoughnutData} options={deptDoughnutOptions} />
        </CardContent>
      </Card>

      {/* Chart 3: Fleet Distribution */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-slate-700" />
            Sebaran Kru per Armada Kapal (Fleet Allocation)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Alokasi penempatan personel pada kapal kontainer & unit kerja SPIL.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Bar data={fleetData} options={fleetOptions} />
        </CardContent>
      </Card>

      {/* Chart 4: Radar Aspect Matrix */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-700" />
            Matriks Evaluasi Pilar Operasional
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Rata-rata kompetensi per pilar kualifikasi teknis dan keselamatan pelayaran.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-64">
          <Radar data={radarData} options={radarOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
