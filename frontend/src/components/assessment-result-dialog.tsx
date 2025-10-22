import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AssessmentResult {
  id: number;
  seafarerCode: string;
  va1RawScore: number;
  va2RawScore: number;
  va3RawScore: number;
  va1CategoryScores: string;
  corevaOcai: number;
  awareConverted: number;
  gritConverted: number;
  corevaFinal: number;
  awareFinal: number;
  gritFinal: number;
  totalFinalScore: number;
  isCompleted: boolean;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResultDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  seafarerCode: string;
  seamanName: string;
}

export default function AssessmentResultDialog({
  open,
  setOpen,
  seafarerCode,
  seamanName,
}: AssessmentResultDialogProps) {
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    if (open && seafarerCode) {
      fetchAssessmentResult();
    }
  }, [open, seafarerCode]);

  const fetchAssessmentResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/assessment-results/seafarer/${seafarerCode}`);
      
      if (response.data && response.data.code === 200) {
        if (response.data.data) {
          setAssessmentResult(response.data.data);
        } else {
          setAssessmentResult(null);
          setError("Assessment belum dikerjakan");
        }
      } else {
        setAssessmentResult(null);
        setError("Data assessment tidak ditemukan");
      }
    } catch (error: any) {
      console.error("Failed to fetch assessment result:", error);
      setAssessmentResult(null);
      
      // Handle different error types
      if (error.response?.status === 404) {
        setError("Assessment belum dikerjakan atau data tidak ditemukan");
      } else if (error.response?.status >= 500) {
        setError("Terjadi kesalahan server. Silakan coba lagi nanti");
      } else {
        setError("Gagal memuat data assessment");
      }
      
      // Don't show toast for 404 errors as they're expected
      if (error.response?.status !== 404) {
        toast.error("Gagal memuat hasil assessment");
      }
    } finally {
      setLoading(false);
    }
  };

  const parseCategoryScores = (categoryScoresJson: string): Record<string, number> => {
    try {
      const parsed = JSON.parse(categoryScoresJson);
      // Ensure all values are numbers
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'number') {
          result[key] = value;
        }
      }
      return result;
    } catch {
      return {};
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[800px] !h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Assessment Result</DialogTitle>
          <div className="flex justify-between items-center">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-12" />
            <h1 className="text-2xl font-bold uppercase">Values Assessment Result</h1>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-12" />
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Memuat hasil assessment...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">{error}</p>
              <p className="text-sm text-gray-400">
                Seafarer Code: <span className="font-mono">{seafarerCode}</span>
              </p>
            </div>
          </div>
        ) : assessmentResult ? (
          <div className="space-y-6 mt-6">
            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">INFORMASI PESERTA</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Nama:</strong> {seamanName}</p>
                <p><strong>Seafarer Code:</strong> {assessmentResult.seafarerCode}</p>
                <p><strong>Status:</strong> {assessmentResult.isCompleted ? "Selesai" : "Belum Selesai"}</p>
                <p><strong>Tanggal Selesai:</strong> {assessmentResult.completedAt ? formatDate(assessmentResult.completedAt) : "-"}</p>
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">RAW SCORES</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <p className="font-semibold">COREVA Raw</p>
                  <p className="text-2xl font-bold text-blue-600">{assessmentResult.va1RawScore}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="font-semibold">AWARE Raw</p>
                  <p className="text-2xl font-bold text-green-600">{assessmentResult.va2RawScore}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <p className="font-semibold">GRIT Raw</p>
                  <p className="text-2xl font-bold text-purple-600">{assessmentResult.va3RawScore}</p>
                </div>
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">COREVA</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(parseCategoryScores(assessmentResult.va1CategoryScores)).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="font-semibold">{value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">SKOR SISTEM</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-orange-50 rounded">
                  <p className="font-semibold">COREVA OCAI</p>
                  <p className="text-2xl font-bold text-orange-600">{assessmentResult.corevaOcai}</p>
                </div>
                <div className="text-center p-3 bg-teal-50 rounded">
                  <p className="font-semibold">AWARE</p>
                  <p className="text-2xl font-bold text-teal-600">{assessmentResult.awareConverted}</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded">
                  <p className="font-semibold">GRIT</p>
                  <p className="text-2xl font-bold text-indigo-600">{assessmentResult.gritConverted}</p>
                </div>
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">SKOR FINAL</h2>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="text-center p-3 bg-red-50 rounded">
                  <p className="font-semibold">Konversi COREVA</p>
                  <p className="text-2xl font-bold text-red-600">{assessmentResult.corevaFinal}</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <p className="font-semibold">Konversi Aware</p>
                  <p className="text-2xl font-bold text-yellow-600">{assessmentResult.awareFinal}</p>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded">
                  <p className="font-semibold">Konversi Grit</p>
                  <p className="text-2xl font-bold text-pink-600">{assessmentResult.gritFinal}</p>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded border-2 border-gray-300">
                  <p className="font-semibold">Total Final Score</p>
                  <p className="text-3xl font-bold text-gray-800">{assessmentResult.totalFinalScore}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <img
                src="/images/logo2.png"
                alt="Logo Perusahaan"
                className="h-10 mx-auto"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Tidak ada data assessment untuk seafarer code ini</p>
              <p className="text-sm text-gray-400">Pastikan assessment sudah diselesaikan</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}