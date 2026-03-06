export interface AssessmentData {
  email: string;
  consent: boolean;
  fullName: string;
  identityNumber: string;
  rank: string;
  vesselName: string;
  seafarerCode: string;
  answers: { [questionId: number]: number };
  startTime?: string;
  currentStep?: number;
  assessmentStartTime?: string;
  timerMinutes?: number;
  pauseTimestamp?: string;
  sisaWaktu?: number;
  usingTimer?: boolean;
  // Persisted tutorial dismissal flag to survive page reload
  tutorialDismissed?: boolean;
}

export type CESAssessmentData = AssessmentData;
