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

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseReports(data: Record<any, any>[]): IReport[] {
  return data.map((d: any) => ({
    id: d["id"],
    seamanCode: d["seamanCode"],
    seafarerCode: d["seafarerCode"],
    nama: d["nama"],
    jabatan: d["jabatan"],
    vesselName: d["vesselName"],
    certificate: d["certificate"],
    age: d["age"],
    tanggalLahir: d["tanggalLahir"],
    startDate: d["startDate"],

    // Catatan Indisipliner
    warningLetter: d["warningLetter"],
    caseHistory: d["caseHistory"],
    yearOfCase: d["yearOfCase"],

    // Data History Vessel
    vesselHistory: d["vesselHistory"],

    // Kinerja
    konditeReview: d["konditeReview"],
    kpiVessel: d["kpiVessel"],
    performanceScore: d["performanceScore"],
    valueAssessment: d["valueAssessment"],
    assessmentCenter: d["assessmentCenter"],
    potentialScore: d["potentialScore"],
    havQuadran: d["havQuadran"],
    havMapping: d["havMapping"],
    competencyGapAnalysis: d["competencyGapAnalysis"],
    totalGap: d["totalGap"],
    strength: d["strength"],
    talentClassified: d["talentClassified"],
    idpProgram: d["idpProgram"],
    idp: d["idp"],
    havQuadran2: d["havQuadran2"],
    talentClassified2: d["talentClassified2"],
    readiness: d["readiness"],
    certificateEligible: d["certificateEligible"],

    // Training, Mentoring, Coaching
    trainingCompleted: d["trainingCompleted"],
    trainingPlanned: d["trainingPlanned"],
    mentoringCompleted: d["mentoringCompleted"],
    mentoringPlanned: d["mentoringPlanned"],
    coachingCompleted: d["coachingCompleted"],
    coachingPlanned: d["coachingPlanned"],

    // Succession Plan
    dataIncumbent: d["dataIncumbent"],
    successionVessel: d["successionVessel"],
    successionRank: d["successionRank"],

    // Individual Development Plan
    idpStart: d["idpStart"],
    idpMentor: d["idpMentor"],
    idpCoach: d["idpCoach"],
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
