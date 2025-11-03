import type { Metadata } from "next";
import MasterPage from "./master";

// Page metadata (for SEO, browser tab title, etc.)
export const metadata: Metadata = {
  title: "Master Report",
  description:
    "Comprehensive master data view of all seafarer performance, readiness, and development information.",
};

// Page entry point
export default function Page() {
  return <MasterPage />;
}
