export interface CESAssessmentData {
  token: string;
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
  sisaWaktu?: number;
  pauseTimestamp?: string;
  usingTimer?: boolean;
  tutorialDismissed?: boolean;
}
