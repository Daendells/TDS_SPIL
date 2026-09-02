"use client";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface AspectRadarProps {
  aspects: {
    technical_skill: number;
    experience: number;
    education: number;
    communication: number;
    leadership: number;
    problem_solving: number;
    cultural_fit: number;
  };
}

export function AspectRadar({ aspects }: AspectRadarProps) {
  const safeAspects = aspects || {
    technical_skill: 0,
    experience: 0,
    education: 0,
    communication: 0,
    leadership: 0,
    problem_solving: 0,
    cultural_fit: 0,
  };

  const data: ChartData<"radar"> = {
    labels: [
      "Technical Skill",
      "Experience",
      "Education",
      "Communication",
      "Leadership",
      "Problem Solving",
      "Cultural Fit",
    ],
    datasets: [
      {
        label: "AI Analysis Score",
        data: [
          safeAspects.technical_skill ?? 0,
          safeAspects.experience ?? 0,
          safeAspects.education ?? 0,
          safeAspects.communication ?? 0,
          safeAspects.leadership ?? 0,
          safeAspects.problem_solving ?? 0,
          safeAspects.cultural_fit ?? 0,
        ],
        backgroundColor: "rgba(30, 41, 59, 0.15)",
        borderColor: "rgba(30, 41, 59, 0.85)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(30, 41, 59, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(30, 41, 59, 1)",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: "transparent",
          color: "#6b7280",
          font: { size: 11 },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        angleLines: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        pointLabels: {
          font: { size: 11, weight: 500 },
          color: "#374151",
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { size: 13 },
          color: "#374151",
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.raw} / 100`,
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ maxWidth: "400px", margin: "0 auto" }}>
      <Radar data={data} options={options} />
    </div>
  );
}