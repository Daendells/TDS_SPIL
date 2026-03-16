import type { Metadata } from "next";
import NewRecruiterReportShell from "./_components/NewRecruiterReportShell";

export const metadata: Metadata = {
  title: "New Recruiter Report",
  description: "Master data and assignment management for new recruiter participants.",
};

export default function Page() {
  return <NewRecruiterReportShell />;
}
