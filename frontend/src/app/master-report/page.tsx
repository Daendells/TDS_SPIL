import type { Metadata } from "next";
import MasterPage from "./master-report";

export const metadata: Metadata = {
  title: "Master Report",
  description: "Comprehensive master data view of all seafarer performance.",
};

export default function Page() {
  return <MasterPage />;
}
