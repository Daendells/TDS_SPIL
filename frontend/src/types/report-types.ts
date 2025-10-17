export interface ReportData {
  reportId: number;
  seafarerCode: string;
  nama: string;
  jabatan: string;
  vesselName: string;
  role: string;
  overallScore: number;
  reportStatus: "pending" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  sections?: ReportSection[];
  personalInfo?: PersonalInfo;
}

export interface ReportSection {
  sectionId: number;
  sectionName: string;
  sectionScore: number;
  maxScore: number;
  percentage: number;
  answers: SectionAnswer[];
}

export interface SectionAnswer {
  questionId: number;
  questionText: string;
  selectedOptionId: number;
  selectedOptionText: string;
  score: number;
  maxScore: number;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  experience: string;
  education: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ReportListResponse {
  reports: ReportData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Query parameters for filtering
export interface ReportQueryParams {
  page?: number;
  limit?: number;
  status?: "pending" | "completed" | "failed";
  role?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Assessment related types
export interface AssessmentResult {
  assessmentResultId: number;
  seafarerCode: string;
  role: string;
  totalScore: number;
  submittedAt: string;
  answers: AssessmentAnswer[];
}

export interface AssessmentAnswer {
  questionId: number;
  optionId: number;
  score: number;
}

// API Error types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
