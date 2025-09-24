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
export function parseReports(data: Record<any, any>): IReport[] {
  return data.map((d: any) => ({
    id: d["id"],
    seamanCode: d["seaman_code"],
    nama: d["nama"],
    jabatan: d["jabatan"],
    idpProgram: d["idp_program"],
    readiness: d["readiness"]
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
