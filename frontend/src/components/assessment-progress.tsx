"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, AlertCircle } from "lucide-react";
import { ValueAssessmentData } from "@/app/value-assessment/page";
import { ValueAssessmentStorage } from "@/lib/assessment-storage";
import { Progress } from "@/components/ui/progress";
import { useSectionCountdown } from "@/hooks/use-section-countdown";

interface AssessmentProgressProps {
  assessmentData: ValueAssessmentData;
  currentStep: number;
}

export default function AssessmentProgress({
  assessmentData,
  currentStep,
}: AssessmentProgressProps) {
  const progress = ValueAssessmentStorage.getProgress(assessmentData);

  // Section countdown timers - using dynamic timer values from assessmentData
  // Timer values are populated by each section component from GetAssessment API
  const section1Countdown = useSectionCountdown(
    assessmentData.section1StartTime,
    assessmentData.section1TimerMinutes ?? 30,
    assessmentData.section1PauseTimestamp,
    currentStep === 3
  );

  const section2Countdown = useSectionCountdown(
    assessmentData.section2StartTime,
    assessmentData.section2TimerMinutes ?? 60,
    assessmentData.section2PauseTimestamp,
    currentStep === 4
  );

  const section3Countdown = useSectionCountdown(
    assessmentData.section3StartTime,
    assessmentData.section3TimerMinutes ?? 30,
    assessmentData.section3PauseTimestamp,
    currentStep === 5
  );

  const stepNames = [
    "Email & Persetujuan",
    "Identitas Diri",
    "Section 1",
    "Section 2",
    "Section 3",
    "Selesai",
  ];

  const isPaused =
    (currentStep === 3 && assessmentData.section1PauseTimestamp) ||
    (currentStep === 4 && assessmentData.section2PauseTimestamp) ||
    (currentStep === 5 && assessmentData.section3PauseTimestamp);

  const formatPausedTime = (milliseconds: number | undefined) => {
    if (!milliseconds || milliseconds === 0) return "0s";
    const seconds = Math.round(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins > 0 ? mins + "m " : ""}${secs}s`;
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

        {/* Pause Status Warning */}
        {isPaused && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  ⏸️ Quiz Sedang Dijeda
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  Anda telah meninggalkan atau tab tidak terfokus. Timer sedang
                  berhenti. Kembali ke tab ini untuk melanjutkan.
                </p>
              </div>
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
                <div className="text-lg font-bold text-blue-600">
                  Section 1: {section1Countdown.timeRemainingFormatted}
                </div>
              )}
              {currentStep === 4 && assessmentData.section2StartTime && (
                <div className="text-lg font-bold text-blue-600">
                  Section 2: {section2Countdown.timeRemainingFormatted}
                </div>
              )}
              {currentStep === 5 && assessmentData.section3StartTime && (
                <div className="text-lg font-bold text-blue-600">
                  Section 3: {section3Countdown.timeRemainingFormatted}
                </div>
              )}
            </div>

            {/* Total Paused Time Info - Only show if currently paused */}
            {isPaused && (
              <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700">
                <p>
                  Waktu dijeda:{" "}
                  {currentStep === 3 && assessmentData.section1PauseTimestamp
                    ? formatPausedTime(
                        new Date().getTime() -
                          new Date(
                            assessmentData.section1PauseTimestamp
                          ).getTime()
                      )
                    : currentStep === 4 && assessmentData.section2PauseTimestamp
                    ? formatPausedTime(
                        new Date().getTime() -
                          new Date(
                            assessmentData.section2PauseTimestamp
                          ).getTime()
                      )
                    : currentStep === 5 && assessmentData.section3PauseTimestamp
                    ? formatPausedTime(
                        new Date().getTime() -
                          new Date(
                            assessmentData.section3PauseTimestamp
                          ).getTime()
                      )
                    : "0s"}
                </p>
              </div>
            )}
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
