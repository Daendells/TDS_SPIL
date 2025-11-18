"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AspectResponse } from "@/types/aspect";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface QuestionAspectSelectorProps {
  questionId: number;
  currentAspectId?: number;
  assessmentId: number;
  aspects: AspectResponse[];
  onSuccess?: () => void;
}

export function QuestionAspectSelector({
  questionId,
  currentAspectId,
  assessmentId,
  aspects,
  onSuccess,
}: QuestionAspectSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const api = useApi();
  const queryClient = useQueryClient();

  const updateQuestionAspectMutation = useMutation({
    mutationFn: async (aspectId: number | null) => {
      const response = await api.put(`/api/questions/${questionId}/aspect`, {
        aspectId: aspectId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      if (onSuccess) onSuccess();
    },
  });

  const handleAspectChange = async (value: string) => {
    setIsUpdating(true);
    try {
      const aspectId = value === "0" ? null : parseInt(value);
      await updateQuestionAspectMutation.mutateAsync(aspectId);
      toast.success("Aspect berhasil diperbarui");
    } catch (error) {
      console.error("Error updating aspect:", error);
      toast.error("Gagal memperbarui aspect");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentAspect = aspects.find((a) => a.id === currentAspectId);

  if (aspects.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No aspects
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
      <Select
        value={currentAspectId?.toString() || "0"}
        onValueChange={handleAspectChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue placeholder="Pilih Aspect">
            {currentAspect ? (
              <span className="text-sm">{currentAspect.name}</span>
            ) : (
              <span className="text-muted-foreground text-sm">Tidak ada</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">
            <span className="text-muted-foreground">Tidak ada aspect</span>
          </SelectItem>
          {aspects.map((aspect) => (
            <SelectItem key={aspect.id} value={aspect.id.toString()}>
              <div className="flex items-center gap-2">
                <span>{aspect.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {aspect.weight}%
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
