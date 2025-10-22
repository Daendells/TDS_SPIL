"use client";

import { useState, useEffect } from "react";
import Greetings from "./greetings";
import PersonalIdentity from "./personal_identity";
import Section1 from "./section1";
import Section2 from "./section2";
import Section3 from "./section3";
import Completion from "./completion";
import AssessmentProgress from "@/components/assessment-progress";
export interface ValueAssessmentData {
  email: string;
  consent: boolean;
  fullName: string;
  identityNumber: string;
  rank: string;
  vesselName: string;
  seafarerCode: string;
  section1Answers: { [questionId: number]: number };
  section2Answers: { [questionId: number]: string };
  section3Answers: { [questionId: number]: number };
  startTime?: string;
  currentStep?: number;
  section1StartTime?: string;
  section2StartTime?: string;
  section3StartTime?: string;
  seamanCode?: string;
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

  // Set client-side flag and load data after mount - only once
  useEffect(() => {
    setIsClient(true);
    // Load stored data only once on mount
    try {
      const saved = sessionStorage.getItem("valueAssessmentFormData");
      if (saved) {
        const data = JSON.parse(saved);
        if (
          data.assessmentData &&
          (data.assessmentData.email || data.currentStep > 1)
        ) {
          setAssessmentData(data.assessmentData);
          setCurrentStep(data.currentStep);
        }
      }
    } catch (error) {
      console.warn("Error loading stored data:", error);
    }
  }, []);

  // Save data to sessionStorage whenever assessmentData or currentStep changes
  useEffect(() => {
    if (
      isClient &&
      (assessmentData.email || assessmentData.fullName || currentStep > 1)
    ) {
      try {
        const dataToSave = {
          assessmentData,
          currentStep,
          timestamp: new Date().toISOString(),
        };
        sessionStorage.setItem(
          "valueAssessmentFormData",
          JSON.stringify(dataToSave)
        );
      } catch (error) {
        console.warn("Error saving data:", error);
      }
    }
  }, [isClient, assessmentData, currentStep]);

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

  const updateAssessmentData = (data: Partial<ValueAssessmentData>) => {
    setAssessmentData((prev) => {
      const updated = { ...prev, ...data };

      // Set overall start time when user first provides consent
      if (data.consent && !prev.startTime) {
        updated.startTime = new Date().toISOString();
      }

      return updated;
    });
  };

  const handleDataRestore = (data: ValueAssessmentData) => {
    setAssessmentData(data);
    setCurrentStep(data.currentStep || 1);
  };

  // Function to clear all stored data (useful when assessment is completed)
  const handleClearStoredData = () => {
    try {
      sessionStorage.removeItem("valueAssessmentFormData");
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
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar - Show only if assessment has started and on client */}
      {isClient &&
        (assessmentData.email ||
          assessmentData.fullName ||
          currentStep > 1) && (
          <div className="max-w-4xl mx-auto px-6 pt-4">
            <AssessmentProgress
              assessmentData={assessmentData}
              currentStep={currentStep}
              onDataRestore={handleDataRestore}
            />
          </div>
        )}
      {renderCurrentStep()}
    </div>
  );
}
