import { useState, useEffect } from "react";

export function useSessionStorage<T>(key: string, initialValue: T) {
  // Always start with initial value to avoid hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  // Load from sessionStorage only after component mounts (client-side)
  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key]);

  // Only save to sessionStorage when client-side
  const saveToStorage = (value: T) => {
    if (isClient) {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    }
  };

  // Return a wrapped version of useState's setter function that persists the new value to sessionStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      saveToStorage(valueToStore);
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  // Remove from sessionStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (isClient) {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

export function useCountdown(
  startTime: string | undefined,
  totalMinutes: number = 30,
  pauseTimestamp: string | undefined = undefined
) {
  const [timeLeft, setTimeLeft] = useState(totalMinutes * 60);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate initial time only on client
  useEffect(() => {
    if (isClient && startTime) {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();

      // Formula:
      // If paused: elapsed = pauseTime - startTime (stop counting at pause)
      // If not paused: elapsed = now - startTime (keep counting)
      let elapsedMs: number;

      console.log(
        `%c[TIMER] 📊 Timer Calculation at ${new Date().toISOString()}`,
        "color: blue; font-weight: bold;"
      );
      console.log(`%c[TIMER] Start time: ${startTime}`, "color: blue;");
      console.log(`%c[TIMER] Pause timestamp: ${pauseTimestamp || "NOT PAUSED"}`, "color: blue;");
      console.log(`%c[TIMER] Current time: ${new Date().toISOString()}`, "color: blue;");

      if (pauseTimestamp) {
        // Sudah dipause: gunakan waktu pause sebagai reference point
        const pauseStart = new Date(pauseTimestamp).getTime();
        elapsedMs = pauseStart - start;
        console.log(
          `%c[TIMER] ⏸️ PAUSED MODE: elapsed = ${elapsedMs}ms (pauseTime - startTime)`,
          "color: red; font-weight: bold;"
        );
      } else {
        // Belum dipause: gunakan waktu sekarang
        elapsedMs = now - start;
        console.log(
          `%c[TIMER] ▶️ RUNNING MODE: elapsed = ${elapsedMs}ms (now - startTime)`,
          "color: green; font-weight: bold;"
        );
      }

      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const totalSeconds = totalMinutes * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

      console.log(
        `%c[TIMER] ⏱️ Elapsed: ${elapsedSeconds}s | Remaining: ${remainingSeconds}s | Total: ${totalSeconds}s`,
        "color: blue;"
      );
      setTimeLeft(remainingSeconds);
    }
  }, [isClient, startTime, totalMinutes, pauseTimestamp]);

  // Timer effect - HANYA terus countdown jika TIDAK pause
  useEffect(() => {
    if (isClient && timeLeft > 0 && !pauseTimestamp) {
      console.log(
        `%c[COUNTDOWN] ⏳ Timer running: ${timeLeft}s remaining`,
        "color: green; font-size: 10px;"
      );
      const timer = setTimeout(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
      return () => clearTimeout(timer);
    } else if (pauseTimestamp) {
      console.log(
        `%c[COUNTDOWN] ⏸️ Timer PAUSED at: ${timeLeft}s remaining`,
        "color: red; font-size: 10px;"
      );
    }
  }, [isClient, timeLeft, pauseTimestamp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return { timeLeft, formatTime };
}
