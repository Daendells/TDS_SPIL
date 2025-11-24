"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { AspectResponse } from "@/types/aspect";

interface BulkAssignAspectDialogProps {
  open: boolean;
  onConfirm: (aspectId: number | null) => void;
  onCancel: () => void;
  selectedCount: number;
  aspects: AspectResponse[];
  loading?: boolean;
}

export default function BulkAssignAspectDialog({
  open,
  onConfirm,
  onCancel,
  selectedCount,
  aspects,
  loading = false,
}: BulkAssignAspectDialogProps) {
  const [selectedAspectId, setSelectedAspectId] = useState<string>("0");

  const handleConfirm = () => {
    const aspectId = selectedAspectId === "0" ? null : parseInt(selectedAspectId);
    onConfirm(aspectId);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
      setSelectedAspectId("0");
    }
  };

  const selectedAspect = aspects.find((a) => a.id.toString() === selectedAspectId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Aspect ke Pertanyaan</DialogTitle>
          <DialogDescription>
            Anda akan mengassign aspect ke {selectedCount} pertanyaan yang dipilih. Pilih aspect
            yang ingin diassign.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedAspectId} onValueChange={setSelectedAspectId} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Aspect">
                {selectedAspect ? (
                  <span>{selectedAspect.name}</span>
                ) : selectedAspectId === "0" ? (
                  <span className="text-muted-foreground">Tidak ada aspect (hapus assignment)</span>
                ) : (
                  <span className="text-muted-foreground">Pilih Aspect</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">
                <span className="text-muted-foreground">Tidak ada aspect (hapus assignment)</span>
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
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengassign...
              </>
            ) : (
              `Assign ke ${selectedCount} Pertanyaan`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
