"use client";

import { Chart as ChartJS, RadialLinearScale, ArcElement, Filler, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, ArcElement, Filler, Tooltip, Legend);

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const scoreColor =
    score >= 80
      ? "#22c55e"
      : score >= 60
        ? "#eab308"
        : score >= 40
          ? "#f97316"
          : "#ef4444";

  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [scoreColor, "rgba(0,0,0,0.05)"],
        borderWidth: 0,
        circumference: 270,
        rotation: 225,
        cutout: "78%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: "220px", height: "220px" }}>
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold" style={{ color: scoreColor }}>
            {score}
          </span>
          <span className="text-sm text-gray-400 mt-1">
            / 100
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        {score >= 80
          ? "Strong match — candidate aligns well with the role requirements."
          : score >= 60
            ? "Moderate match — candidate has relevant background but may need further evaluation."
            : score >= 40
              ? "Below average match — candidate may need significant development or the role may not be the best fit."
              : "Low match — consider alternative candidates or additional assessment."}
      </p>
    </div>
  );
}