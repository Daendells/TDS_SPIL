"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BookOpen, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { TutorialEditor } from "@/components/tutorial-editor";
import { useUpdateAssessmentTutorial } from "./_hooks/useAssessment";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface TutorialSectionProps {
  assessmentId: number;
  assessmentName: string;
  initialContent?: string | null;
  initialTimerMinutes?: number | null;
}

export function TutorialSection({
  assessmentId,
  assessmentName,
  initialContent,
  initialTimerMinutes,
}: TutorialSectionProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateAssessmentTutorial();

  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState<string>(initialContent ?? "");
  const [timerMinutes, setTimerMinutes] = useState<number>(initialTimerMinutes ?? 1);

  // Reset when the selected assessment changes
  useEffect(() => {
    setIsEditing(false);
    setIsExpanded(false);
    setContent(initialContent ?? "");
    setTimerMinutes(initialTimerMinutes ?? 1);
  }, [assessmentId, initialContent, initialTimerMinutes]);

  function handleEdit() {
    setContent(initialContent ?? "");
    setTimerMinutes(initialTimerMinutes ?? 1);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setContent(initialContent ?? "");
    setTimerMinutes(initialTimerMinutes ?? 1);
  }

  function handleSave() {
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
          setIsEditing(false);
        },
        onError: (err) => {
          toast.error(`Gagal menyimpan tutorial: ${err.message}`);
        },
      }
    );
  }

  const hasContent = !!initialContent?.trim();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Tutorial — {assessmentName}
          </CardTitle>
          {isAdmin && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Tutorial
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Timer config */}
            <div className="flex items-center gap-3">
              <Label htmlFor="tutorial-timer" className="whitespace-nowrap text-sm">
                Waktu baca (menit)
              </Label>
              <Input
                id="tutorial-timer"
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

            {/* Tiptap editor — rendered directly in page, no Dialog */}
            <div className="h-[500px]">
              <TutorialEditor content={content} onChange={setContent} />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Tutorial"}
              </Button>
            </div>
          </div>
        ) : hasContent ? (
          <div>
            <div className={cn("relative overflow-hidden", !isExpanded && "max-h-[120px]")}>
              <div
                className="tiptap-content text-sm"
                dangerouslySetInnerHTML={{ __html: initialContent! }}
              />
              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Tutup
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Lihat Selengkapnya
                </>
              )}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Belum ada konten tutorial untuk assessment ini. Klik &quot;Edit Tutorial&quot; untuk
            menambahkan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
