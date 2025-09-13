export type PageType = "prev" | "next";
export type FilterType = "" | "MDP" | "FDP" | "SDP";

export interface IReport {
  id: number;
  vesselName: string;
  nama: string;
  jabatan: string;
  konditeReview: number;
  kpiVessel: number;
  performanceScore: number;
  valueAssessment: number;
  assessmentCenter: number;
  potentialScore: number;
  havQuadran: string;
  havMapping: string;
  competencyGapAnalysis: string;
  talentClassified: string;
  idpProgram: string;
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
  anchorId: number;
  page: PageType;
  pageSize: number;
  filter: FilterType;
}
