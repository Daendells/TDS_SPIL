"use client";

import { useState, useEffect, useCallback } from "react";
import Greetings from "./greetings";
import PersonalIdentity from "./personal_identity";
import Section1 from "./section1";
import Section2 from "./section2";
import Section3 from "./section3";
import Completion from "./completion";
import AssessmentProgress from "@/components/assessment-progress";
import styles from "./assessment.module.css";
export interface ValueAssessmentData {
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
}

export default function ValueAssessmentPage() {
  const [isClient, setIsClient] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<ValueAssessmentData>({
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
  });

  // localStorage key untuk menyimpan assessment data dengan expiry 24 jam
  const STORAGE_KEY = "valueAssessmentFormData";
  const EXPIRY_MINUTES = 24 * 60; // 24 jam

  // Set client-side flag dan load data dari localStorage setelah mount
  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);

        // Check if data has expiry field dan belum expired
        if (parsed.expiresAt) {
          const now = new Date().getTime();
          if (now <= parsed.expiresAt) {
            const data = parsed.value;
            if (
              data.assessmentData &&
              (data.assessmentData.email || data.currentStep > 1)
            ) {
              setAssessmentData(data.assessmentData);
              setCurrentStep(data.currentStep);
            }
          } else {
            // Data expired, hapus dari localStorage
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
  }, []);

  // Save data ke localStorage dengan expiry 24 jam setiap kali assessmentData atau currentStep berubah
  useEffect(() => {
    if (
      isClient &&
      (assessmentData.email || assessmentData.fullName || currentStep > 1)
    ) {
      try {
        const now = new Date().getTime();
        const expiryTime = now + EXPIRY_MINUTES * 60 * 1000; // Convert minutes to ms

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

    // Set start time for sections
    const now = new Date().toISOString();
    if (nextStep === 3 && !assessmentData.section1StartTime) {
      updateAssessmentData({ section1StartTime: now });
    } else if (nextStep === 4 && !assessmentData.section2StartTime) {
      updateAssessmentData({ section2StartTime: now });
    } else if (nextStep === 5 && !assessmentData.section3StartTime) {
      updateAssessmentData({ section3StartTime: now });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const updateAssessmentData = useCallback(
    (data: Partial<ValueAssessmentData>) => {
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
    },
    []
  );

  // Function to clear all stored data (useful when assessment is completed)
  const handleClearStoredData = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
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
          <Completion
            assessmentData={assessmentData}
            clearStoredData={handleClearStoredData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${styles.assessmentContainer}`}>
      {/* Progress Bar - Show only if assessment has started and on client */}
      {isClient &&
        (assessmentData.email ||
          assessmentData.fullName ||
          currentStep > 1) && (
          <div className="max-w-4xl mx-auto px-6 pt-4">
            <AssessmentProgress
              assessmentData={assessmentData}
              currentStep={currentStep}
            />
          </div>
        )}
      {renderCurrentStep()}
    </div>
  );
}
