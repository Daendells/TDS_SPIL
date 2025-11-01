export type PageType = "prev" | "next";
export type FilterType = "" | "MDP" | "FDP" | "SDP";

export interface IReport {
  id: number;
  seamanCode: string;
  seafarerCode: string;
  nama: string;
  jabatan: string;
  vesselName: string;
  certificate: string;
  age: string;
  tanggalLahir: string;
  startDate: string;
   user?: string;

  // Catatan Indisipliner
  warningLetter: string;
  caseHistory: string;
  yearOfCase: string;

  // Data History Vessel
  vesselHistory: string;

  // Kinerja
  konditeReview: number;
  kpiVessel: number;
  performanceScore: number;
  valueAssessment: number;
  assessmentCenter: number;
  potentialScore: number;
  havQuadran: number;
  havMapping: string;
  competencyGapAnalysis: string;
  totalGap: number;
  strength: number;
  talentClassified: string;
  idpProgram: string;
  idp: string; // 🔥 tambahan
  havQuadran2: number;
  talentClassified2: string;
  readiness: string;
  certificateEligible: string;

  // Training, Mentoring, Coaching
  trainingCompleted: string;
  trainingPlanned: string;
  mentoringCompleted: string;
  mentoringPlanned: string;
  coachingCompleted: string;
  coachingPlanned: string;

  // Succession Plan
  dataIncumbent: string;
  successionVessel: string;
  successionRank: string;

  // Individual Development Plan
  idpStart: string;
  idpMentor: string;
  idpCoach: string;
}

export interface IPaginationData<T> {
  data: T[];
  firstId: number | null;
  lastId: number | null;
  pageSize: number;
  hasMore: boolean;
  firstPage: boolean;
}

export interface IPaginationRequest {
  anchorId: number | null;
  page: PageType;
  pageSize: number;
  filter: FilterType;
}

// Re-export report types from specific types module
export type {
  ReportData,
  ApiResponse,
  ReportSection,
  SectionAnswer,
  PersonalInfo,
  ApiError,
  AssessmentAnswer,
} from "./report-types";
