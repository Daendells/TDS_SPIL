export type AspectResponse = {
  id: number;
  name: string;
  weight: number;
  assessmentId: number;
  questionId: number | null;
};

export type AspectCreatePayload = {
  name: string;
  weight: number;
  assessmentId: number;
  questionId?: number | null;
};

export type AspectUpdatePayload = {
  name?: string;
  weight?: number;
  assessmentId?: number;
  questionId?: number | null;
};
