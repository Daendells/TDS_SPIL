"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { ValueAssessmentData } from "@/app/value-assessment/page";
import { ValueAssessmentStorage } from "@/lib/assessment-storage";
import { Progress } from "@/components/ui/progress";

interface AssessmentProgressProps {
  assessmentData: ValueAssessmentData;
  currentStep: number;
}

export default function AssessmentProgress({
  assessmentData,
  currentStep,
}: AssessmentProgressProps) {
  const progress = ValueAssessmentStorage.getProgress(assessmentData);

  const stepNames = [
    "Email & Persetujuan",
    "Identitas Diri",
    "Section 1",
    "Section 2",
    "Section 3",
    "Selesai",
  ];

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

        {/* Info Text */}
        <div className="text-xs text-gray-500">
          <p>
            * Data akan otomatis tersimpan di browser dan akan hilang jika cache
            dibersihkan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
