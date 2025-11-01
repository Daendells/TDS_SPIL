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
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
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
  totalMinutes: number = 30
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
      const elapsedSeconds = Math.floor((now - start) / 1000);
      const totalSeconds = totalMinutes * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      setTimeLeft(remainingSeconds);
    }
  }, [isClient, startTime, totalMinutes]);

  // Timer effect
  useEffect(() => {
    if (isClient && timeLeft > 0) {
      const timer = setTimeout(
        () => setTimeLeft((prev) => Math.max(0, prev - 1)),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [isClient, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return { timeLeft, formatTime };
}
