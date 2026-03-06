import { OptionResponse } from "./option";
import { QuestionResponse } from "./question";

export type AssessmentResponse = {
  assessmentId: number;
  role: string;
  assessmentName: string;
  usingTimer: boolean;
  timerLimitMinutes: number | null;
  tutorialContent?: string | null;
  tutorialTimerMinutes?: number | null;
  questions?: QuestionOptionResponse[];
};

export type QuestionOptionResponse = {
  options: OptionResponse[];
} & QuestionResponse;

export type AssessmentPayload = {
  id?: number;
  role: string;
  assessmentName?: string;
  usingTimer: boolean;
  timerLimitMinutes: number;
  tutorialContent?: string | null;
  tutorialTimerMinutes?: number | null;
};
