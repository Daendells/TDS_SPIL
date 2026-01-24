export type QuestionResponse = {
  questionId: number;
  questionText: string;
  category: string;
  isImage: number;
  imageUrl: string;
  aspectId?: number;
  questionType?: string;
  acceptableAnswers?: string;
};
