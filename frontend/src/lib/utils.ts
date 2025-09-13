import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { IPaginationData, IReport } from "@/types/global-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSegmet(segment: string) {
  return segment
    .split(/[-_]/) // split by dash or underscore
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseReports(data: Record<any, any>): IReport[] {
  return data.map((d: any) => ({
    id: d["id"],
    vesselName: d["vessel_name"],
    nama: d["nama"],
    jabatan: d["jabatan"],
    konditeReview: d["kondite_review"],
    kpiVessel: d["kpi_vessel"],
    performanceScore: d["performance_score"],
    valueAssessment: d["value_assessment"],
    assessmentCenter: d["assessment_center"],
    potentialScore: d["potential_score"],
    havQuadran: d["hav_quadran"],
    havMapping: d["hav_mapping"],
    competencyGapAnalysis: d["competency_gap_analysis"],
    talentClassified: d["talent_classified"],
    idpProgram: d["idp_program"],
  }));
}

export function parsePaginationData<T>(
  response: Record<string, any>,
  parser: (data: any) => T[]
): IPaginationData<T> {
  const { first_id, first_page, has_more, last_id, page_size, results } =
    response;
  return {
    data: parser(results ?? []),
    firstId: first_id ?? null,
    lastId: last_id ?? null,
    pageSize: page_size,
    hasMore: has_more,
    firstPage: first_page,
  };
}
