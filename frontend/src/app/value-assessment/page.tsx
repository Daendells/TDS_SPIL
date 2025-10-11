"use client";

import { useState } from "react";
import Greetings from "./greetings";
import PersonalIdentity from "./personal_identity";
import Section1 from "./section1";
import Section2 from "./section2";
import Section3 from "./section3";
import Completion from "./completion";

export interface ValueAssessmentData {
  email: string;
  consent: boolean;
  fullName: string;
  identityNumber: string;
  rank: string;
  vesselName: string;
  seamanCode: string;
  section1Answers: { [questionId: number]: number };
  section2Answers: { [questionId: number]: string };
  section3Answers: { [questionId: number]: number };
}

export default function ValueAssessmentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState<ValueAssessmentData>({
    email: "",
    consent: false,
    fullName: "",
    identityNumber: "",
    rank: "",
    vesselName: "",
    seamanCode: "",
    section1Answers: {},
    section2Answers: {},
    section3Answers: {},
  });

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const updateAssessmentData = (data: Partial<ValueAssessmentData>) => {
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