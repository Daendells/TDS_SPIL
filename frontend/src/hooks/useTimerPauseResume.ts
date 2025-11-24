import { useEffect, useRef, useCallback } from "react";

/**
 * Pause saat tab hidden ATAU window kehilangan fokus.
 * Koaleskan event (visibility/focus/blur) → 1 sinkronisasi per frame.
 */
export function useTimerPauseResume(
  isActive: boolean,
  onPause: () => void,
  onResume: () => void
) {
  const isPausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const stablePause = useCallback(() => {
    if (!isPausedRef.current) {
      isPausedRef.current = true;
      console.log(
        `%c[HOOK] 🔴 PAUSE EVENT - ${new Date().toISOString()}`,
        "color: red; font-weight: bold; font-size: 14px;"
      );
      onPause();
    }
  }, [onPause]);

  const stableResume = useCallback(() => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      console.log(
        `%c[HOOK] 🟢 RESUME EVENT - ${new Date().toISOString()}`,
        "color: green; font-weight: bold; font-size: 14px;"
      );
      onResume();
    }
  }, [onResume]);

  useEffect(() => {
    if (!isActive) return;

    const sync = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const shouldPause = document.hidden || !document.hasFocus();
        console.log(
          `%c[SYNC] hidden=${
            document.hidden
          } hasFocus=${document.hasFocus()} → shouldPause=${shouldPause}`,
          "color: purple; font-size: 12px;"
        );
        if (shouldPause) {
          stablePause();
        } else {
          stableResume();
        }
      });
    };

    // Dengarkan semua, tapi keputusan cuma dari sync()
    const onVisibility = () => {
      console.log("%c[EVENT] visibilitychange", "color: purple;");
      sync();
    };
    const onBlur = () => {
      console.log("%c[EVENT] blur", "color: orange;");
      sync();
    };
    const onFocus = () => {
      console.log("%c[EVENT] focus", "color: blue;");
      sync();
    };

    document.addEventListener("visibilitychange", onVisibility, {
      passive: true,
    });
    window.addEventListener("blur", onBlur, { passive: true });
    window.addEventListener("focus", onFocus, { passive: true });

    // iOS/Safari kadang lebih andal dengan pageshow/pagehide
    window.addEventListener("pageshow", onFocus, { passive: true });
    window.addEventListener("pagehide", onBlur, { passive: true });

    // Sinkronisasi awal saat mount
    sync();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      window.removeEventListener("pagehide", onBlur);
    };
  }, [isActive, stablePause, stableResume]);
}
