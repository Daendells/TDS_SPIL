"use client";

import React from "react";
import { useSectionCountdown } from "@/hooks/use-section-countdown";

interface TimerDisplayProps {
  sectionName?: string;
  // Section-specific timer data
  startTime?: string;
  timerMinutes?: number;
  pauseTimestamp?: string;
  sisaWaktu?: number; // remaining time when paused (in seconds)
  isActive?: boolean;
  // Optional legacy props (not used anymore)
  timeLeft?: number;
  isRunning?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  formatTime?: (seconds: number) => string;
  originalDuration?: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  sectionName = "Assessment",
  startTime,
  timerMinutes = 30,
  pauseTimestamp,
  sisaWaktu,
  isActive = true,
}) => {
  // Use section countdown hook for accurate timer with sisaWaktu approach
  const { timeRemaining, timeRemainingFormatted } = useSectionCountdown(
    startTime,
    timerMinutes,
    pauseTimestamp,
    sisaWaktu,
    isActive
  );

  const isRunning = !pauseTimestamp && timeRemaining > 0;
  const originalDurationMinutes = timerMinutes;

  const getTimerColor = () => {
    return "text-blue-600"; // Warna konsisten untuk semua waktu
  };

  const getBackgroundColor = () => {
    return "bg-blue-50 border-blue-200"; // Background konsisten untuk semua waktu
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border-2 shadow-lg ${getBackgroundColor()}`}
    >
      {/* Section Info */}
      {sectionName && (
        <div className="mb-2 text-xs font-medium text-gray-600">
          {sectionName}
          <span className="ml-2 text-gray-500">
            (Durasi: {originalDurationMinutes} menit)
          </span>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isRunning ? "bg-blue-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-sm font-medium text-gray-700">
            {isRunning ? "Timer Aktif" : "Timer Dijeda"}
          </span>
        </div>

        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {timeRemainingFormatted}
        </div>
      </div>

      {timeRemaining <= 300 && timeRemaining > 0 && (
        <div className="mt-2 text-xs text-blue-800 font-medium animate-pulse">
          ⚠️ Waktu hampir habis!
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;
