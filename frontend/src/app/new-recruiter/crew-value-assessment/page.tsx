"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Greetings from "./greetings";
import PersonalIdentity from "./personal_identity";
import Questions from "./questions";
import Completion from "./completion";
import TimerDisplay from "@/components/timer-display";
import { useCheckAssessmentTypeStatus } from "./_hooks/useAssessmentTypeStatus";
import { CESAssessmentData } from "./types";

export default function CESAssessmentPage() {
  const params = useParams();
  const roleParam = params.role;
  const role = Array.isArray(roleParam)
    ? roleParam[0] || ""
    : typeof roleParam === "string"
      ? roleParam
      : "";

  const [isClient, setIsClient] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<CESAssessmentData>({
    token: "",
    email: "",
    consent: false,
    fullName: "",
    identityNumber: "",
    rank: "",
    vesselName: "",
    seafarerCode: "",
    answers: {},
    startTime: undefined,
    sisaWaktu: 0,
    pauseTimestamp: undefined,
  });

  // const [timeLeft, setTimeLeft] = useState<number>(0);
  // const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [lastWarningTime, setLastWarningTime] = useState<number>(0);
  const [assessmentStatus, setAssessmentStatus] = useState<{
    isOpen: boolean;
    message: string;
    startTimeFormatted?: string;
    endTimeFormatted?: string;
    loaded: boolean;
  }>({
    isOpen: true,
    message: "",
    loaded: false,
  });

  // Check assessment type status (using ID 2 for CES, adjust as needed)
  const { data: statusData } = useCheckAssessmentTypeStatus(2);
  const STORAGE_KEY = `newRecruiterCesAssessmentFormData_${role}`;
  const EXPIRY_MINUTES = 3 * 24 * 60;

  // Update assessment status when statusData changes
  useEffect(() => {
    if (statusData) {
      setAssessmentStatus({
        isOpen: statusData.isOpen,
        message: statusData.openMessage,
        startTimeFormatted: statusData.startTimeFormatted,
        endTimeFormatted: statusData.endTimeFormatted,
        loaded: true,
      });
    }
  }, [statusData]);

  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed.expiresAt && Date.now() <= parsed.expiresAt) {
          const data = parsed.value;
          if (data?.assessmentData && (data.assessmentData.fullName || data.currentStep > 1)) {
            setAssessmentData(data.assessmentData);
            setCurrentStep(data.currentStep);
          }
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn("Error loading stored data:", error);
    }

    // Prevent copy, cut, paste, context menu
    const handleCopy = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleCut = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [STORAGE_KEY]);

  useEffect(() => {
    if (!isClient || (!assessmentData.fullName && !assessmentData.consent && currentStep <= 1)) {
      return;
    }

    try {
      const storageData = {
        value: {
          assessmentData,
          currentStep,
          timestamp: new Date().toISOString(),
        },
        expiresAt: Date.now() + EXPIRY_MINUTES * 60 * 1000,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.warn("Error saving data:", error);
    }
  }, [isClient, assessmentData, currentStep, STORAGE_KEY, EXPIRY_MINUTES]);

  const handleNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Reset timer state saat pindah ke questions step
    if (nextStep === 3) {
      // setTimeLeft(0);
      updateAssessmentData({
        sisaWaktu: 0,
        pauseTimestamp: undefined,
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const updateAssessmentData = useCallback((data: Partial<CESAssessmentData>) => {
    setAssessmentData((prev) => {
      const updated = { ...prev, ...data };

      if (data.consent && !prev.startTime) {
        updated.startTime = new Date().toISOString();
      }

      return updated;
    });
  }, []);

  // Handle ketika waktu habis
  const handleTimeUp = useCallback(() => {
    updateAssessmentData({
      sisaWaktu: 0,
      pauseTimestamp: undefined,
    });

    // Auto navigate ke completion
    if (currentStep < 4) {
      setCurrentStep(4);
    }
  }, [currentStep, updateAssessmentData]);

  // Timer warnings and auto-submit
  useEffect(() => {
    if (currentStep !== 3) return;

    const updateTimer = () => {
      const sectionStartTime = assessmentData.assessmentStartTime;
      const sectionTimerMinutes = assessmentData.timerMinutes || 60;

      if (!sectionStartTime) return;

      const start = new Date(sectionStartTime).getTime();
      const now = new Date().getTime();
      const elapsedMs = now - start;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const totalSeconds = sectionTimerMinutes * 60;
      const sectionTimeRemaining = Math.max(0, totalSeconds - elapsedSeconds);

      // setTimeLeft(sectionTimeRemaining);

      // Show warning modal at specific intervals
      if (
        (sectionTimeRemaining === 600 ||
          sectionTimeRemaining === 300 ||
          sectionTimeRemaining === 60) &&
        sectionTimeRemaining !== lastWarningTime &&
        sectionTimeRemaining > 0
      ) {
        // setShowTimeWarning(true);
        setLastWarningTime(sectionTimeRemaining);
        toast.warning(
          `Perhatian! Sisa waktu tinggal ${Math.floor(sectionTimeRemaining / 60)} menit`
        );
      }

      // Handle auto submit ketika waktu habis
      if (sectionTimeRemaining === 0) {
        handleTimeUp();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    currentStep,
    assessmentData.assessmentStartTime,
    assessmentData.timerMinutes,
    lastWarningTime,
    handleTimeUp,
  ]);

  const handleClearStoredData = () => {
    if (!isClient) return;
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Greetings
            onNext={handleNext}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
            isAssessmentClosed={assessmentStatus.loaded && !assessmentStatus.isOpen}
            closedMessage={assessmentStatus.message}
            startTime={assessmentStatus.startTimeFormatted}
            endTime={assessmentStatus.endTimeFormatted}
            role={role}
          />
        );
      case 2:
        return (
          <PersonalIdentity
            onNext={handleNext}
            onBack={handleBack}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
            role={role}
          />
        );
      case 3:
        return (
          <Questions
            onNext={handleNext}
            onBack={handleBack}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
            role={role}
          />
        );
      case 4:
        return (
          <Completion
            assessmentData={assessmentData}
            clearStoredData={handleClearStoredData}
            role={role}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isClient && !role ? (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-xl border bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Role assessment belum dipilih</h1>
            <p className="mt-3 text-sm text-slate-600">
              Buka halaman CES new recruiter menggunakan link yang sudah menyertakan segment role.
            </p>
          </div>
        </div>
      ) : (
        isClient && (
          <>
            {/* Timer Display - Show only during assessment questions, after tutorial is dismissed */}
            {currentStep === 3 && assessmentData.assessmentStartTime && (
              <TimerDisplay
                sectionName={`CES Assessment - ${role.replace(/_/g, " ").toUpperCase()}`}
                startTime={assessmentData.assessmentStartTime}
                timerMinutes={assessmentData.timerMinutes}
                isActive={currentStep === 3}
                usingTimer={assessmentData.usingTimer}
              />
            )}
            {renderCurrentStep()}
          </>
        )
      )}
    </div>
  );
}
