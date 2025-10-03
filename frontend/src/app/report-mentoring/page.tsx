import { Metadata } from "next";
import ReportMentoring from "@/app/report-mentoring/report-mentoring";

export const metadata: Metadata = {
  title: "Report Mentoring - Talent Development System",
};

export default function Page() {
  return <ReportMentoring />;
}