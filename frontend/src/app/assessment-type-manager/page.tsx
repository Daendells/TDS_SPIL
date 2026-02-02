import { Metadata } from "next";
import AssessmentTypeAdmin from "./assessment-type-admin";

export const metadata: Metadata = {
  title: "Assessment Activation - Talent Development System",
};

export default function Page() {
  return <AssessmentTypeAdmin />;
}
