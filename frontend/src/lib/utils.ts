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

export function parseReports(data: Record<string, unknown>[]): IReport[] {
  return data.map((d) => ({
    id: d["id"] as number,
    seamanCode: d["seamanCode"] as string,
    seafarerCode: d["seafarerCode"] as string,
    nama: d["nama"] as string,
    jabatan: d["jabatan"] as string,
    vesselName: d["vesselName"] as string,
    certificate: d["certificate"] as string,
    age: d["age"] as string,
    tanggalLahir: d["tanggalLahir"] as string,
    startDate: d["startDate"] as string,

    // Catatan Indisipliner
    warningLetter: d["warningLetter"] as string,
    caseHistory: d["caseHistory"] as string,
    yearOfCase: d["yearOfCase"] as string,

    // Data History Vessel
    vesselHistory: d["vesselHistory"] as string,

    // Kinerja
    konditeReview: d["konditeReview"] as number,
    kpiVessel: d["kpiVessel"] as number,
    performanceScore: d["performanceScore"] as number,
    valueAssessment: d["valueAssessment"] as number,
    valueAssessmentScore: d["valueAssessmentScore"] as number,
    assessmentCenter: d["assessmentCenter"] as number,
    potentialScore: d["potentialScore"] as number,
    havQuadran: d["havQuadran"] as number,
    havMapping: d["havMapping"] as string,
    competencyGapAnalysis: d["competencyGapAnalysis"] as string,
    totalGap: d["totalGap"] as number,
    strength: d["strength"] as number,
    talentClassified: d["talentClassified"] as string,
    idpProgram: d["idpProgram"] as string,
    idp: d["idp"] as string,
    havQuadran2: d["havQuadran2"] as number,
    talentClassified2: d["talentClassified2"] as string,
    readiness: d["readiness"] as string,
    certificateEligible: d["certificateEligible"] as string,

    // Training, Mentoring, Coaching
    trainingCompleted: d["trainingCompleted"] as string,
    trainingPlanned: d["trainingPlanned"] as string,
    mentoringCompleted: d["mentoringCompleted"] as string,
    mentoringPlanned: d["mentoringPlanned"] as string,
    coachingCompleted: d["coachingCompleted"] as string,
    coachingPlanned: d["coachingPlanned"] as string,

    // Succession Plan
    dataIncumbent: d["dataIncumbent"] as string,
    successionVessel: d["successionVessel"] as string,
    successionRank: d["successionRank"] as string,

    // Individual Development Plan
    idpStart: d["idpStart"] as string,
    idpMentor: d["idpMentor"] as string,
    idpCoach: d["idpCoach"] as string,
    competencies: d["competencies"] as IReport["competencies"],
  }));
}

export function parsePaginationData<T>(
  response: Record<string, unknown>,
  parser: (data: Record<string, unknown>[]) => T[]
): IPaginationData<T> {
  const { first_id, first_page, has_more, last_id, page_size, results } =
    response;
  return {
    results: parser((results as Record<string, unknown>[]) ?? []),
    first_id: (first_id as number) ?? null,
    last_id: (last_id as number) ?? null,
    page_size: page_size as number,
    has_more: has_more as boolean,
    first_page: first_page as boolean,
  };
}
