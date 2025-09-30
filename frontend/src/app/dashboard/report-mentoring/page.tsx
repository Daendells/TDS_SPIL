import { Metadata } from "next";
import ReportMentoringDashboard from "./report-mentoring-dashboard";

export const metadata: Metadata = {
  title: "Report Mentoring Dashboard - Talent Development System",
};

export default function Page() {
  return <ReportMentoringDashboard />;
}