"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Greetings from "./greetings";
import PersonalIdentity from "./personal_identity";
import Section1 from "./section1";
import Section2 from "./section2";
import Section3 from "./section3";
import Completion from "./completion";
// import AssessmentProgress from "@/components/assessment-progress";
import TimerDisplay from "@/components/timer-display";
import { useCheckAssessmentTypeStatus } from "./_hooks/useAssessmentTypeStatus";
import { useCheckSeafarerAssignment } from "./_hooks/useCheckSeafarerAssignment";
import styles from "./assessment.module.css";
export interface ValueAssessmentData {
  token: string;
  email: string;
  consent: boolean;
  fullName: string;
  identityNumber: string;
  rank: string;
  vesselName: string;
  seafarerCode: string;
  section1Answers: { [questionId: number]: number };
  section2Answers: { [questionId: number]: number };
  section3Answers: { [questionId: number]: number };
  startTime?: string;
  currentStep?: number;
  section1StartTime?: string;
  section2StartTime?: string;
  section3StartTime?: string;
  sisaWaktu?: number; // dalam detik
  timerPausedAt?: string;
  isTimerActive?: boolean;
  // Section-specific timer fields
  section1TimerMinutes?: number;
  section2TimerMinutes?: number;
  section3TimerMinutes?: number;
  section1PauseTimestamp?: string;
  section2PauseTimestamp?: string;
  section3PauseTimestamp?: string;
  // Section-specific remaining time when paused
  section1SisaWaktu?: number;
  section2SisaWaktu?: number;
  section3SisaWaktu?: number;
  usingTimer?: boolean;
  // Persisted tutorial dismissal flags to survive page reload
  section1TutorialDismissed?: boolean;
  section2TutorialDismissed?: boolean;
  section3TutorialDismissed?: boolean;
}

export default function ValueAssessmentPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<ValueAssessmentData>({
    token: "",
    email: "",
    consent: false,
    fullName: "",
    identityNumber: "",
    rank: "",
    vesselName: "",
    seafarerCode: "",
    section1Answers: {},
    section2Answers: {},
    section3Answers: {},
    startTime: undefined,
    sisaWaktu: 0,
    timerPausedAt: undefined,
    isTimerActive: false,
  });

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

  const [assignmentStatus, setAssignmentStatus] = useState<{
    isAssigned: boolean;
    checked: boolean;
    message?: string;
  }>({
    isAssigned: false,
    checked: false,
  });

  // Check assessment type status
  const { data: statusData } = useCheckAssessmentTypeStatus(1);

  // Check seafarer assignment - only check when we have seafarer code
  const { data: assignmentData } = useCheckSeafarerAssignment(assessmentData.token || "", 1);
  const STORAGE_KEY = "newRecruiterValueAssessmentFormData";
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

  // Update assignment status when assignment data changes
  useEffect(() => {
    if (assignmentData) {
      setAssignmentStatus({
        isAssigned: assignmentData.isAssigned,
        checked: true,
        message: assignmentData.message,
      });
    }
  }, [assignmentData]);

  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed.expiresAt && Date.now() <= parsed.expiresAt) {
          const data = parsed.value;
          if (data?.assessmentData && (data.assessmentData.email || data.currentStep > 1)) {
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
  }, []);

  useEffect(() => {
    if (!isClient || (!assessmentData.email && !assessmentData.fullName && currentStep <= 1)) {
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

    // Reset timer state saat pindah step (akan diatur oleh section component)
    if (nextStep >= 3 && nextStep <= 5) {
      // Reset to default, akan diupdate oleh section component setelah API load
      // setTimeLeft(0);
      updateAssessmentData({
        sisaWaktu: 0,
        isTimerActive: false,
        timerPausedAt: undefined,
      });
    } else {
      // Non-assessment steps
      // setTimeLeft(0);
      updateAssessmentData({
        sisaWaktu: 0,
        isTimerActive: false,
        timerPausedAt: undefined,
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const updateAssessmentData = useCallback((data: Partial<ValueAssessmentData>) => {
    console.log(`[updateAssessmentData] Called with:`, data);
    setAssessmentData((prev) => {
      const updated = { ...prev, ...data };

      // Set overall start time when user first provides consent
      if (data.consent && !prev.startTime) {
        updated.startTime = new Date().toISOString();
      }

      console.log(`[updateAssessmentData] State updated:`, updated);
      return updated;
    });
  }, []);

  // Legacy timer functions - kept for backward compatibility with TimeWarningModal
  // Actual timer logic is now handled by individual section components

  // Handle ketika waktu habis
  const handleTimeUp = useCallback(() => {
    updateAssessmentData({
      sisaWaktu: 0,
      isTimerActive: false,
    });

    // Auto navigate ke completion atau submit assessment
    if (currentStep < 6) {
      setCurrentStep(6);
    }
  }, [currentStep, updateAssessmentData]);

  // Format waktu untuk display
  // const formatTime = useCallback((seconds: number) => {
  //   const minutes = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return `${minutes.toString().padStart(2, "0")}:${secs
  //     .toString()
  //     .padStart(2, "0")}`;
  // }, []);

  // Legacy timer state is now managed by the timer warnings useEffect below

  // Timer warnings and auto-submit using section countdown data with sisaWaktu approach
  useEffect(() => {
    // Only run this effect every second when we're in assessment sections
    if (currentStep < 3 || currentStep > 5) return;

    const updateTimer = () => {
      // Get current section data
      let sectionStartTime: string | undefined;
      let sectionTimerMinutes = 30;

      if (currentStep === 3) {
        sectionStartTime = assessmentData.section1StartTime;
        sectionTimerMinutes = assessmentData.section1TimerMinutes || 30;
      } else if (currentStep === 4) {
        sectionStartTime = assessmentData.section2StartTime;
        sectionTimerMinutes = assessmentData.section2TimerMinutes || 60;
      } else if (currentStep === 5) {
        sectionStartTime = assessmentData.section3StartTime;
        sectionTimerMinutes = assessmentData.section3TimerMinutes || 30;
      }

      if (!sectionStartTime) return;

      const start = new Date(sectionStartTime).getTime();
      const now = new Date().getTime();
      const elapsedMs = now - start;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const totalSeconds = sectionTimerMinutes * 60;
      const sectionTimeRemaining = Math.max(0, totalSeconds - elapsedSeconds);

      // Update global timer state for warning modal compatibility
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
        console.log(`⚠️ [Section Timer] Warning at ${sectionTimeRemaining}s`);
      }

      // Handle auto submit ketika waktu habis
      if (sectionTimeRemaining === 0) {
        handleTimeUp();
        console.log("⏰ [Section Timer] Auto submit triggered");
      }
    };

    // Run immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    currentStep,
    assessmentData.section1StartTime,
    assessmentData.section1TimerMinutes,
    assessmentData.section2StartTime,
    assessmentData.section2TimerMinutes,
    assessmentData.section3StartTime,
    assessmentData.section3TimerMinutes,
    lastWarningTime,
    handleTimeUp,
  ]);

  // Check seafarer assignment when reaching completion step
  useEffect(() => {
    if (currentStep === 6 && assessmentData.token && assignmentStatus.checked) {
      // Only show error if checked and not assigned
      if (!assignmentStatus.isAssigned) {
        toast.error(
          assignmentStatus.message ||
            "User tidak terassign pada assessment ini. Silakan hubungi administrator.",
          {
            duration: 5000,
          }
        );
        // Go back to previous step
        setCurrentStep(5);
      }
    }
  }, [
    currentStep,
    assessmentData.token,
    assignmentStatus.checked,
    assignmentStatus.isAssigned,
    assignmentStatus.message,
  ]);

  // Function to clear all stored data (useful when assessment is completed)
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
          />
        );
      case 2:
        return (
          <PersonalIdentity
            onNext={handleNext}
            onBack={handleBack}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
          />
        );
      case 3:
        return (
          <Section1
            onNext={handleNext}
            onBack={handleBack}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
          />
        );
      case 4:
        return (
          <Section2
            onNext={handleNext}
            onBack={handleBack}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
          />
        );
      case 5:
        return (
          <Section3
            onNext={handleNext}
            onBack={handleBack}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
          />
        );
      case 6:
        return (
          <Completion assessmentData={assessmentData} clearStoredData={handleClearStoredData} />
        );
      default:
        return null;
    }
  };

  const showTimer =
    currentStep >= 3 &&
    currentStep <= 5 &&
    !!(currentStep === 3
      ? assessmentData.section1StartTime
      : currentStep === 4
        ? assessmentData.section2StartTime
        : assessmentData.section3StartTime);

  return (
    <div className={`min-h-screen bg-gray-50 ${styles.assessmentContainer}`}>
      {
        <>
          {/* Timer Display - Show only during assessment sections, after tutorial is dismissed */}
          {showTimer && (
            <TimerDisplay
              sectionName={
                currentStep === 3
                  ? "Section 1 - Assessment"
                  : currentStep === 4
                    ? "Section 2 - Assessment"
                    : currentStep === 5
                      ? "Section 3 - Assessment"
                      : undefined
              }
              startTime={
                currentStep === 3
                  ? assessmentData.section1StartTime
                  : currentStep === 4
                    ? assessmentData.section2StartTime
                    : currentStep === 5
                      ? assessmentData.section3StartTime
                      : undefined
              }
              timerMinutes={
                currentStep === 3
                  ? assessmentData.section1TimerMinutes
                  : currentStep === 4
                    ? assessmentData.section2TimerMinutes
                    : currentStep === 5
                      ? assessmentData.section3TimerMinutes
                      : undefined
              }
              isActive={currentStep >= 3 && currentStep <= 5}
              usingTimer={assessmentData.usingTimer}
            />
          )}

          {/* Progress Bar - Show only if assessment has started and on client */}
          {/* {(assessmentData.email || assessmentData.fullName || currentStep > 1) && (
            <div className="max-w-4xl mx-auto px-6 pt-4">
              <AssessmentProgress assessmentData={assessmentData} currentStep={currentStep} />
            </div>
          )} */}
          {renderCurrentStep()}
        </>
      }
    </div>
  );
}
