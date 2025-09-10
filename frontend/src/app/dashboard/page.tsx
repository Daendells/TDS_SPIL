import { Metadata } from "next";
import Dashboard from "./dashboard";

export const metadata: Metadata = {
  title: "Dashboard - Talent Development System",
};

export default function Page() {
  return <Dashboard />;
}
