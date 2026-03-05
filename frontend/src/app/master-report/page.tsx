import type { Metadata } from "next";
import MasterReportShell from "./_components/MasterReportShell";

export const metadata: Metadata = {
  title: "Master Report",
  description: "Comprehensive master data view of all seafarer performance.",
};

export default function Page() {
  return <MasterReportShell />;
}
