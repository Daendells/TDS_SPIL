"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface SummaryChartProps {
  strengths: string[];
  weaknesses: string[];
}

export function SummaryChart({ strengths = [], weaknesses = [] }: SummaryChartProps) {
  const safeStrengths = strengths || [];
  const safeWeaknesses = weaknesses || [];

  const data: ChartData<"doughnut"> = {
    labels: ["Strengths", "Areas for Improvement"],
    datasets: [
      {
        data: [safeStrengths.length, safeWeaknesses.length],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderColor: ["#16a34a", "#dc2626"],
        borderWidth: 2,
        hoverBackgroundColor: ["#16a34a", "#dc2626"],
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
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
      },
    },
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[320px] mx-auto">
        <Doughnut data={data} options={options} />
      </div>
      {strengths.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-green-600">
              {strengths.length}
            </span>{" "}
            strength(s) identified
          </p>
        </div>
      )}
      {weaknesses.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-red-600">
              {weaknesses.length}
            </span>{" "}
            area(s) for improvement identified
          </p>
        </div>
      )}
    </div>
  );
}