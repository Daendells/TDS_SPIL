"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TutorialEditor } from "@/components/tutorial-editor";
import { useUpdateAssessmentTutorial } from "./_hooks/useAssessment";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TutorialEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: number | null;
  assessmentName: string;
  initialContent?: string | null;
  initialTimerMinutes?: number | null;
}

export default function TutorialEditorDialog({
  open,
  onOpenChange,
  assessmentId,
  assessmentName,
  initialContent,
  initialTimerMinutes,
}: TutorialEditorDialogProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateAssessmentTutorial();

  const [content, setContent] = useState<string>(initialContent ?? "");
  const [timerMinutes, setTimerMinutes] = useState<number>(initialTimerMinutes ?? 1);

  // Sync when dialog opens with fresh data
  useEffect(() => {
    if (open) {
      setContent(initialContent ?? "");
      setTimerMinutes(initialTimerMinutes ?? 1);
    }
  }, [open, initialContent, initialTimerMinutes]);

  function handleSave() {
    if (!assessmentId) return;

    updateMutation.mutate(
      {
        assessmentId,
        tutorialContent: content || null,
        tutorialTimerMinutes: timerMinutes,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["assessments"] });
          toast.success("Tutorial berhasil disimpan");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(`Gagal menyimpan tutorial: ${err.message}`);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Tutorial — {assessmentName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden gap-4 py-2 min-h-0">
          {/* Timer config */}
          <div className="flex items-center gap-3 shrink-0">
            <Label htmlFor="timer-minutes" className="whitespace-nowrap">
              Waktu baca (menit)
            </Label>
            <Input
              id="timer-minutes"
              type="number"
              min={0}
              step={0.5}
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(parseFloat(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              Default: 1 menit. Isi 0 untuk langsung bisa lanjut.
            </span>
          </div>

          {/* Tiptap editor */}
          <div className="flex-1 min-h-0">
            <TutorialEditor content={content} onChange={setContent} />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Tutorial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
