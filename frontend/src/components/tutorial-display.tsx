"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TutorialDisplayProps {
  assessmentName: string;
  content: string | null | undefined;
  timerMinutes: number | null | undefined;
  onProceed: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TutorialDisplay({
  assessmentName,
  content,
  timerMinutes,
  onProceed,
}: TutorialDisplayProps) {
  const minutes = timerMinutes ?? 1;
  const initialSeconds = Math.round(minutes * 60);
  const [remaining, setRemaining] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onProceedRef = useRef(onProceed);

  useEffect(() => {
    onProceedRef.current = onProceed;
  }, [onProceed]);

  useEffect(() => {
    if (initialSeconds <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [initialSeconds]);

  // Auto-advance when countdown reaches zero
  useEffect(() => {
    if (remaining === 0 && initialSeconds > 0) {
      onProceedRef.current();
    }
  }, [remaining, initialSeconds]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 pb-8">
      <Card className="w-full max-w-3xl shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">{assessmentName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Baca penjelasan berikut sebelum memulai assessment.
          </p>
        </CardHeader>

        <CardContent className="py-6">
          {content ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-muted-foreground italic">
              Tidak ada penjelasan untuk assessment ini.
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {remaining > 0 ? (
              <span>
                Lanjut otomatis dalam{" "}
                <span className="font-mono font-semibold text-foreground">
                  {formatTime(remaining)}
                </span>
              </span>
            ) : (
              <span className="text-green-600 font-medium">Anda sudah bisa memulai</span>
            )}
          </div>

          <Button onClick={onProceed}>Mulai Assessment</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
