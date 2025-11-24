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
import { CESAssessmentData } from "../types";

export default function CESAssessmentPage() {
  const params = useParams();
  const role = params.role as string;

  const [isClient, setIsClient] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<CESAssessmentData>({
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

  // localStorage key untuk menyimpan assessment data dengan expiry 3 hari
  const STORAGE_KEY = `cesAssessmentFormData_${role}`;
  const EXPIRY_MINUTES = 3 * 24 * 60; // 3 hari

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

  // Set client-side flag dan load data dari localStorage setelah mount
  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);

        if (parsed.expiresAt) {
          const now = new Date().getTime();
          if (now <= parsed.expiresAt) {
            const data = parsed.value;
            if (data.assessmentData && (data.assessmentData.fullName || data.currentStep > 1)) {
              setAssessmentData(data.assessmentData);
              setCurrentStep(data.currentStep);

              // if (data.assessmentData.sisaWaktu !== undefined) {
              //   setTimeLeft(data.assessmentData.sisaWaktu);
              // }
            }
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
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

  // Save data ke localStorage
  useEffect(() => {
    if (isClient && (assessmentData.fullName || assessmentData.consent || currentStep > 1)) {
      try {
        const now = new Date().getTime();
        const expiryTime = now + EXPIRY_MINUTES * 60 * 1000;

        const dataToSave = {
          assessmentData,
          currentStep,
          timestamp: new Date().toISOString(),
        };

        const storageData = {
          value: dataToSave,
          expiresAt: expiryTime,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
      } catch (error) {
        console.warn("Error saving data:", error);
      }
    }
  }, [isClient, assessmentData, currentStep, EXPIRY_MINUTES, STORAGE_KEY]);

  const handleNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Set start time for assessment questions
    const now = new Date().toISOString();
    if (nextStep === 3 && !assessmentData.assessmentStartTime) {
      updateAssessmentData({ assessmentStartTime: now });
    }

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
      const sectionPauseTimestamp = assessmentData.pauseTimestamp;
      const sectionTimerMinutes = assessmentData.timerMinutes || 60;
      const sectionSisaWaktu = assessmentData.sisaWaktu;

      if (!sectionStartTime) return;

      let sectionTimeRemaining: number;

      if (sectionPauseTimestamp && sectionSisaWaktu !== undefined) {
        sectionTimeRemaining = sectionSisaWaktu;
      } else {
        const start = new Date(sectionStartTime).getTime();
        const now = new Date().getTime();
        const elapsedMs = now - start;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const totalSeconds = sectionTimerMinutes * 60;
        sectionTimeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
      }

      // setTimeLeft(sectionTimeRemaining);

      // Show warning modal at specific intervals
      if (
        (sectionTimeRemaining === 600 ||
          sectionTimeRemaining === 300 ||
          sectionTimeRemaining === 60) &&
        sectionTimeRemaining !== lastWarningTime &&
        !sectionPauseTimestamp &&
        sectionTimeRemaining > 0
      ) {
        // setShowTimeWarning(true);
        setLastWarningTime(sectionTimeRemaining);
        toast.warning(
          `Perhatian! Sisa waktu tinggal ${Math.floor(sectionTimeRemaining / 60)} menit`
        );
      }

      // Handle auto submit ketika waktu habis
      if (sectionTimeRemaining === 0 && !sectionPauseTimestamp) {
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
    assessmentData.pauseTimestamp,
    assessmentData.sisaWaktu,
    lastWarningTime,
    handleTimeUp,
  ]);

  // Handle visibility change dan window focus untuk pause/resume timer
  useEffect(() => {
    const calculateCurrentSisaWaktu = () => {
      const sectionStartTime = assessmentData.assessmentStartTime;
      const sectionTimerMinutes = assessmentData.timerMinutes || 60;

      if (!sectionStartTime) return 0;

      const start = new Date(sectionStartTime).getTime();
      const now = new Date().getTime();
      const elapsedMs = now - start;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const totalSeconds = sectionTimerMinutes * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

      return remainingSeconds;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (currentStep === 3) {
          const now = new Date().toISOString();
          const sisaWaktu = calculateCurrentSisaWaktu();
          updateAssessmentData({
            pauseTimestamp: now,
            sisaWaktu: sisaWaktu,
          });
        }
      } else {
        if (currentStep === 3 && assessmentData.sisaWaktu !== undefined) {
          const newStartTime = new Date(
            Date.now() -
              ((assessmentData.timerMinutes || 60) * 60 - assessmentData.sisaWaktu) * 1000
          ).toISOString();
          updateAssessmentData({
            pauseTimestamp: undefined,
            assessmentStartTime: newStartTime,
          });
        }
      }
    };

    const handleWindowBlur = () => {
      if (currentStep === 3) {
        const now = new Date().toISOString();
        const sisaWaktu = calculateCurrentSisaWaktu();
        updateAssessmentData({
          pauseTimestamp: now,
          sisaWaktu: sisaWaktu,
        });
      }
    };

    const handleWindowFocus = () => {
      if (currentStep === 3 && assessmentData.sisaWaktu !== undefined) {
        const newStartTime = new Date(
          Date.now() - ((assessmentData.timerMinutes || 60) * 60 - assessmentData.sisaWaktu) * 1000
        ).toISOString();
        updateAssessmentData({
          pauseTimestamp: undefined,
          assessmentStartTime: newStartTime,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [
    updateAssessmentData,
    currentStep,
    assessmentData.assessmentStartTime,
    assessmentData.timerMinutes,
    assessmentData.sisaWaktu,
  ]);

  const handleClearStoredData = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      // setTimeLeft(0);
    } catch (error) {
      console.warn("Error clearing stored data:", error);
    }
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
      {isClient && (
        <>
          {/* Timer Display - Show only during assessment questions */}
          {currentStep === 3 && (
            <TimerDisplay
              sectionName={`CES Assessment - ${role.replace(/_/g, " ").toUpperCase()}`}
              startTime={assessmentData.assessmentStartTime}
              timerMinutes={assessmentData.timerMinutes}
              pauseTimestamp={assessmentData.pauseTimestamp}
              sisaWaktu={assessmentData.sisaWaktu}
              isActive={currentStep === 3}
            />
          )}
          {renderCurrentStep()}
        </>
      )}
    </div>
  );
}
