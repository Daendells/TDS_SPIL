"use client";

import { useState } from "react";
import Greetings from "./greetings";
import PersonalIdentity from "./personal_identity";
import Questions from "./questions";

export interface AssessmentData {
  fullName: string;
  identityNumber: string;
  rank: string;
  vesselName: string;
  consent: boolean;
  answers: { [questionId: number]: number };
}

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    fullName: "",
    identityNumber: "",
    rank: "",
    vesselName: "",
    consent: false,
    answers: {},
  });

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const updateAssessmentData = (data: Partial<AssessmentData>) => {
    setAssessmentData(prev => ({ ...prev, ...data }));
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
          <Questions
            onBack={handleBack}
            assessmentData={assessmentData}
            updateAssessmentData={updateAssessmentData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentStep()}
    </div>
  );
}