import { Metadata } from "next";
import ReportMentoring from "./report-mentoring";

export const metadata: Metadata = {
  title: "Report Mentoring - Talent Development System",
};

export default function Page() {
  return <ReportMentoring />;
}