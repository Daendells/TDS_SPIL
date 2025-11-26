"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AspectResponse } from "@/types/aspect";
import { useCreateAspect, useUpdateAspect } from "./_hooks/useAspect";

interface AspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: number;
  aspect?: AspectResponse | null;
  onSuccess?: () => void;
}

export function AspectDialog({
  open,
  onOpenChange,
  assessmentId,
  aspect,
  onSuccess,
}: AspectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    weight: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAspectMutation = useCreateAspect();
  const updateAspectMutation = useUpdateAspect();

  const isEditing = !!aspect;

  useEffect(() => {
    if (aspect) {
      setFormData({
        name: aspect.name,
        weight: aspect.weight,
      });
    } else {
      setFormData({
        name: "",
        weight: 0,
      });
    }
  }, [aspect, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nama aspect harus diisi");
      return;
    }

    if (formData.weight <= 0 || formData.weight > 100) {
      toast.error("Weight harus antara 1 dan 100");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && aspect) {
        await updateAspectMutation.mutateAsync({
          id: aspect.id,
          payload: {
            name: formData.name,
            weight: formData.weight,
          },
        });
        toast.success("Aspect berhasil diperbarui");
      } else {
        await createAspectMutation.mutateAsync({
          name: formData.name,
          weight: formData.weight,
          assessmentId: assessmentId,
        });
        toast.success("Aspect berhasil dibuat");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving aspect:", error);
      toast.error("Gagal menyimpan aspect");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Aspect" : "Tambah Aspect"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah detail aspect yang ada"
              : "Tambahkan aspect baru untuk assessment ini"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Aspect</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Integrity, Customer Oriented"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (%)</Label>
            <Input
              id="weight"
              type="number"
              min={1}
              max={100}
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
              placeholder="Contoh: 40"
            />
            <p className="text-xs text-muted-foreground">
              Total weight semua aspect dalam satu assessment harus 100%
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
