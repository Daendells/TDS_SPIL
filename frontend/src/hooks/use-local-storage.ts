import { useCallback, useEffect, useState } from "react";

interface StorageData<T> {
  value: T;
  expiresAt: number; // timestamp in ms
}

/**
 * Hook untuk localStorage dengan auto-expiry setelah durasi tertentu
 * @param key - localStorage key
 * @param initialValue - nilai default jika tidak ada di storage
 * @param expiryMinutes - berapa menit data berlaku (default: 24 jam = 1440 menit)
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  expiryMinutes: number = 1440 // 24 jam default
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const data: StorageData<T> = JSON.parse(item);
        const now = new Date().getTime();

        // Check if expired
        if (now > data.expiresAt) {
          window.localStorage.removeItem(key);
          setStoredValue(initialValue);
        } else {
          setStoredValue(data.value);
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Save to localStorage dengan expiry
  const setValue = useCallback(
    (value: T) => {
      try {
        const now = new Date().getTime();
        const expiryTime = now + expiryMinutes * 60 * 1000; // Convert minutes to ms

        const data: StorageData<T> = {
          value,
          expiresAt: expiryTime,
        };

        window.localStorage.setItem(key, JSON.stringify(data));
        setStoredValue(value);
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, expiryMinutes]
  );

  return [storedValue, setValue];
}

/**
 * Hook untuk mendapatkan waktu expiry dari localStorage
 */
export function useLocalStorageExpiry(key: string): number | null {
  const [expiryTime, setExpiryTime] = useState<number | null>(null);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        interface ExpiryData {
          value: object;
          expiresAt: number;
        }

        const data: ExpiryData = JSON.parse(item);
        setExpiryTime(data.expiresAt);
      }
    } catch (error) {
      console.error(`Error reading expiry from key "${key}":`, error);
    }
  }, [key]);

  return expiryTime;
}

/**
 * Hook untuk countdown timer berdasarkan localStorage expiry
 */
export function useStorageCountdown(storageKey: string) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      if (!item) {
        setIsExpired(true);
        return;
      }

      interface ExpiryData {
        value: object;
        expiresAt: number;
      }

      const data: ExpiryData = JSON.parse(item);
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const remaining = data.expiresAt - now;

        if (remaining <= 0) {
          setTimeLeft(0);
          setIsExpired(true);
          clearInterval(interval);
          window.localStorage.removeItem(storageKey);
        } else {
          setTimeLeft(remaining);
          setIsExpired(false);
        }
      }, 1000); // Update setiap 1 detik

      // Set initial value
      const now = new Date().getTime();
      const remaining = data.expiresAt - now;
      setTimeLeft(Math.max(0, remaining));
      setIsExpired(remaining <= 0);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Error in useStorageCountdown:", error);
      setIsExpired(true);
    }
  }, [storageKey]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    isExpired,
    formatTime,
  };
}
