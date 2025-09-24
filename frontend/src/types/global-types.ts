export type PageType = "prev" | "next";
export type FilterType = "" | "MDP" | "FDP" | "SDP";

export interface IReport {
  id: number;
  seamanCode: string;
  nama: string;
  jabatan: string;
  idpProgram: string;
  readiness:  string;
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
