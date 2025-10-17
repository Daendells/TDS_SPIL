"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Trash2, Clock, User } from "lucide-react";
import { ValueAssessmentData } from "@/app/value-assessment/page";
import { ValueAssessmentStorage } from "@/lib/assessment-storage";
import { toast } from "sonner";

interface AssessmentProgressProps {
  assessmentData: ValueAssessmentData;
  currentStep: number;
  onDataRestore?: (data: ValueAssessmentData) => void;
}

export default function AssessmentProgress({
  assessmentData,
  currentStep,
  onDataRestore,
}: AssessmentProgressProps) {
  const [isUploading, setIsUploading] = useState(false);

  const progress = ValueAssessmentStorage.getProgress(assessmentData);

  const handleExport = () => {
    ValueAssessmentStorage.exportToFile();
    toast.success("Data assessment berhasil di-export");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await ValueAssessmentStorage.importFromFile(file);
      if (data && onDataRestore) {
        onDataRestore(data);
        toast.success("Data assessment berhasil di-import");
      } else {
        toast.error("File tidak valid atau rusak");
      }
    } catch {
      toast.error("Gagal mengimport data");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleClearData = () => {
    if (
      confirm("Apakah Anda yakin ingin menghapus semua data yang tersimpan?")
    ) {
      ValueAssessmentStorage.clear();
      toast.success("Data assessment berhasil dihapus");
      window.location.reload();
    }
  };

  const stepNames = [
    "Email & Persetujuan",
    "Identitas Diri",
    "Section 1",
    "Section 2",
    "Section 3",
    "Selesai",
  ];

  const getTimeRemaining = (startTime: string | undefined) => {
    if (!startTime) return null;
    const remaining = ValueAssessmentStorage.getTimeRemaining(startTime, 30);
    return ValueAssessmentStorage.formatTime(remaining);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Progress Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Progres: {stepNames[currentStep - 1] || "Tidak diketahui"}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Assessment Info */}
        {assessmentData.fullName && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Nama:</strong> {assessmentData.fullName}
            </div>
            <div>
              <strong>Seafarer Code:</strong> {assessmentData.seafarerCode}
            </div>
            <div>
              <strong>Rank:</strong> {assessmentData.rank}
            </div>
            <div>
              <strong>Vessel:</strong> {assessmentData.vesselName}
            </div>
          </div>
        )}

        {/* Timer Info */}
        {currentStep >= 3 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Waktu Tersisa:</span>
            </div>
            <div className="mt-1 space-y-1">
              {currentStep === 3 && assessmentData.section1StartTime && (
                <div>
                  Section 1:{" "}
                  {getTimeRemaining(assessmentData.section1StartTime) ||
                    "Waktu habis"}
                </div>
              )}
              {currentStep === 4 && assessmentData.section2StartTime && (
                <div>
                  Section 2:{" "}
                  {getTimeRemaining(assessmentData.section2StartTime) ||
                    "Waktu habis"}
                </div>
              )}
              {currentStep === 5 && assessmentData.section3StartTime && (
                <div>
                  Section 3:{" "}
                  {getTimeRemaining(assessmentData.section3StartTime) ||
                    "Waktu habis"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Importing..." : "Import Data"}
            </Button>
          </div>

          <Button
            onClick={handleClearData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Data
          </Button>
        </div>

        {/* Info Text */}
        <div className="text-xs text-gray-500">
          <p>
            * Data akan otomatis tersimpan di browser dan akan hilang jika cache
            dibersihkan.
          </p>
          <p>* Gunakan Export/Import untuk backup data ke file.</p>
        </div>
      </CardContent>
    </Card>
  );
}
