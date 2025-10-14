"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface BulkDeleteConfirmationDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  selectedCount: number;
  loading?: boolean;
}

export default function BulkDeleteConfirmationDialog({
  open,
  onCancel,
  onConfirm,
  selectedCount,
  loading = false
}: BulkDeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="!w-[90vw] !max-w-[500px] !h-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Hapus Beberapa Pertanyaan</DialogTitle>
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-2xl font-bold uppercase text-red-600">
              Hapus Beberapa Pertanyaan
            </h1>
          </div>
        </DialogHeader>

        <div className="border rounded-xl shadow-sm p-6 bg-white">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Apakah Anda yakin ingin menghapus {selectedCount} pertanyaan?
              </h2>
              <p className="text-sm text-gray-600">
                Tindakan ini tidak dapat dibatalkan. Semua pertanyaan yang dipilih dan opsi jawabannya akan dihapus secara permanen.
              </p>
            </div>


            <div className="flex justify-center gap-3 w-full pt-4">
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
                className="flex-1 max-w-[120px]"
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 max-w-[120px]"
              >
                {loading ? "Menghapus..." : "Hapus Semua"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}