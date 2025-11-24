import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import {
  useGetAssessmentReport,
  type AspectScoreResult,
} from "@/app/assessment-results/_hooks/useAssessmentResults";

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
  // Use React Query hook
  const {
    data: assessmentReport,
    isLoading,
    error,
  } = useGetAssessmentReport(seafarerCode);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCorevaCategory = (rawScore: number): string => {
    if (rawScore <= 100) return "Rendah";
    if (rawScore <= 131) return "Sedang";
    return "Tinggi";
  };

  const getAwareCategory = (rawScore: number): string => {
    if (rawScore <= 30) return "Tidak Direkomendasi";
    if (rawScore <= 45) return "Rekomendasi dengan Pengawasan";
    return "Rekomendasi";
  };

  const getGritCategory = (rawScore: number): string => {
    if (rawScore <= 24) return "Rendah";
    if (rawScore <= 36) return "Sedang";
    return "Tinggi";
  };

  const getCategoryColor = (category: string): string => {
    if (category === "Rendah" || category === "Tidak Direkomendasi") return "text-red-600";
    if (category === "Sedang" || category === "Rekomendasi dengan Pengawasan") return "text-yellow-600";
    return "text-green-600";
  };

  // Fungsi untuk klasifikasi aspek COREVA berdasarkan raw score
  // Formula: =IF(rawScore<=16; "Rendah"; IF(rawScore<=25; "Sedang";"Tinggi"))
  const getAspectCategory = (rawScore: number): string => {
    if (rawScore <= 16) return "Rendah";
    if (rawScore <= 25) return "Sedang";
    return "Tinggi";
  };

  // Determine error message
  const getErrorMessage = () => {
    if (!error) return null;

    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 404) {
      return "Assessment belum dikerjakan atau data tidak ditemukan";
    } else if (axiosError.response?.status && axiosError.response.status >= 500) {
      return "Terjadi kesalahan server. Silakan coba lagi nanti";
    }
    return "Gagal memuat data assessment";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[800px] !h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Assessment Result</DialogTitle>
          <div className="flex justify-between items-center">
            <Image src="/images/logo1.png" alt="Logo Kiri" width={48} height={48} className="h-12 w-auto" />
            <h1 className="text-2xl font-bold uppercase">Values Assessment Result</h1>
            <Image src="/images/logo2.png" alt="Logo Kanan" width={48} height={48} className="h-12 w-auto" />
          </div>
        </DialogHeader>

        {isLoading ? (
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
              <p className="text-gray-500 mb-2">{getErrorMessage()}</p>
              <p className="text-sm text-gray-400">
                Seafarer Code: <span className="font-mono">{seafarerCode}</span>
              </p>
            </div>
          </div>
        ) : assessmentReport ? (
          <div className="space-y-6 mt-6">
            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">INFORMASI PESERTA</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Nama:</strong> {seamanName}</p>
                <p><strong>Seafarer Code:</strong> {assessmentReport.seafarerCode}</p>
                <p><strong>Tanggal Selesai:</strong> {formatDate(assessmentReport.completedAt)}</p>
                <p><strong>Value Assessment Score:</strong> <span className="text-2xl font-bold text-green-600">{assessmentReport.valueAssessmentScore}</span></p>
                <p className="col-span-2"><strong>Total Score:</strong> <span className="text-2xl font-bold text-blue-600">{assessmentReport.totalScore.toFixed(2)}</span></p>
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-blue-50">
              <h2 className="font-bold text-lg mb-4">INTERPRETASI</h2>
              <p className="text-sm">{assessmentReport.interpretasi}</p>
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">COREVA</h2>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm font-semibold text-gray-600 mb-1">Kategori</p>
                <p className={`text-xl font-bold ${getCategoryColor(getCorevaCategory(assessmentReport.coreva.rawScore))}`}>
                  {getCorevaCategory(assessmentReport.coreva.rawScore)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <p className="font-semibold">Raw Score</p>
                  <p className="text-2xl font-bold text-blue-600">{assessmentReport.coreva.rawScore}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="font-semibold">Final Score</p>
                  <p className="text-2xl font-bold text-green-600">{assessmentReport.coreva.finalScore}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <p className="font-semibold">Konversi Score (40%)</p>
                  <p className="text-2xl font-bold text-purple-600">{assessmentReport.coreva.konversiScore.toFixed(2)}</p>
                </div>
              </div>

              {assessmentReport.coreva.scoreResult && assessmentReport.coreva.scoreResult.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Breakdown per Aspect:</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {assessmentReport.coreva.scoreResult.map((aspect: AspectScoreResult) => (
                      <div key={aspect.aspectId} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold">{aspect.aspectName}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            getAspectCategory(aspect.rawScore) === "Rendah" ? "bg-red-100 text-red-700" :
                            getAspectCategory(aspect.rawScore) === "Sedang" ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {getAspectCategory(aspect.rawScore)}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Raw:</span>
                            <span className="ml-1 font-semibold">{aspect.rawScore}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Final:</span>
                            <span className="ml-1 font-semibold text-blue-600">{aspect.finalScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">AWARE</h2>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm font-semibold text-gray-600 mb-1">Kategori</p>
                <p className={`text-xl font-bold ${getCategoryColor(getAwareCategory(assessmentReport.aware.rawScore))}`}>
                  {getAwareCategory(assessmentReport.aware.rawScore)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-teal-50 rounded">
                  <p className="font-semibold">Raw Score</p>
                  <p className="text-2xl font-bold text-teal-600">{assessmentReport.aware.rawScore}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="font-semibold">Final Score</p>
                  <p className="text-2xl font-bold text-green-600">{assessmentReport.aware.finalScore}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <p className="font-semibold">Konversi Score (30%)</p>
                  <p className="text-2xl font-bold text-orange-600">{assessmentReport.aware.konversiScore.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-4 bg-white">
              <h2 className="font-bold text-lg mb-4">GRIT</h2>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm font-semibold text-gray-600 mb-1">Kategori</p>
                <p className={`text-xl font-bold ${getCategoryColor(getGritCategory(assessmentReport.grit.rawScore))}`}>
                  {getGritCategory(assessmentReport.grit.rawScore)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-indigo-50 rounded">
                  <p className="font-semibold">Raw Score</p>
                  <p className="text-2xl font-bold text-indigo-600">{assessmentReport.grit.rawScore}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="font-semibold">Final Score</p>
                  <p className="text-2xl font-bold text-green-600">{assessmentReport.grit.finalScore}</p>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded">
                  <p className="font-semibold">Konversi Score (30%)</p>
                  <p className="text-2xl font-bold text-pink-600">{assessmentReport.grit.konversiScore.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Image
                src="/images/logo2.png"
                alt="Logo Perusahaan"
                width={40}
                height={40}
                className="h-10 w-auto mx-auto"
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
