import { useState, useEffect } from "react";

/**
 * Hook untuk countdown timer real-time pada section assessment
 * Timer berjalan ketika page/tab active, pause saat tab hidden/blur
 *
 * Formula countdown:
 * - Jika belum pause: remainingTime = totalTime - (currentTime - startTime)
 * - Jika sudah pause: remainingTime = totalTime - (pauseTime - startTime)
 *   (waktu pause tidak dihitung sebagai elapsed time)
 */
export function useSectionCountdown(
  startTime: string | undefined,
  totalMinutes: number = 30,
  pauseTimestamp: string | undefined, // ISO timestamp when paused
  sisaWaktu: number | undefined, // remaining seconds when paused (sisaWaktu approach)
  isActive: boolean = true // true jika sedang di section ini
) {
  const [timeRemaining, setTimeRemaining] = useState<number>(totalMinutes * 60);

  useEffect(() => {
    if (!startTime || !isActive) return;

    // Initial calculation
    const updateTime = () => {
      let remaining: number;

      if (pauseTimestamp && sisaWaktu !== undefined) {
        // Timer sedang dipause, gunakan sisaWaktu yang tersimpan
        remaining = sisaWaktu;
        console.log(`⏸️ [TimerDisplay] Using saved sisaWaktu: ${remaining}s`);
      } else {
        // Timer berjalan normal, hitung dari start time
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const elapsedMs = now - start;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const totalSeconds = totalMinutes * 60;
        remaining = Math.max(0, totalSeconds - elapsedSeconds);
      }

      setTimeRemaining(remaining);
    };

    updateTime();

    // Update every second (countdown) - HANYA jika TIDAK pause
    // Jika pause, jangan update interval karena menggunakan sisaWaktu yang fix
    if (!pauseTimestamp) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, totalMinutes, pauseTimestamp, sisaWaktu, isActive]);

  // Format waktu ke MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    timeRemaining,
    timeRemainingFormatted: formatTime(timeRemaining),
  };
}
