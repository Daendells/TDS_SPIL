import type { Metadata } from "next";
import MasterPage from "./master-report";
import AssignmentTable from "../assignments/assignmentTable";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Master Report",
  description: "Comprehensive master data view of all seafarer performance.",
};

export default function Page() {
  return (
    <>
      <MasterPage />
      <Separator className="my-6" />
      <AssignmentTable />
    </>
  );
}
