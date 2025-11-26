"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface QuestionOption {
  id: number;
  text: string;
  value?: string;
}

interface QuestionWithOptions {
  questionId: number;
  questionText: string;
  category?: string;
  isImage?: string;
  imageUrl?: string;
  options?: QuestionOption[];
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  question: QuestionWithOptions | null;
  loading?: boolean;
}

export default function DeleteConfirmationDialog({
  open,
  onCancel,
  onConfirm,
  question,
  loading = false,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="!w-[90vw] !max-w-[500px] !h-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Hapus Pertanyaan</DialogTitle>
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-2xl font-bold uppercase text-red-600">Hapus Pertanyaan</h1>
          </div>
        </DialogHeader>

        <div className="border rounded-xl shadow-sm p-6 bg-white">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Apakah Anda yakin ingin menghapus pertanyaan ini?
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 w-full">
              <p className="text-sm font-medium text-gray-700 mb-1">Pertanyaan:</p>
              <p className="text-sm text-gray-900 line-clamp-3">
                {question?.questionText || "Tidak ada teks pertanyaan tersedia"}
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
                {loading ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
