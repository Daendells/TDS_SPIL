import { Metadata } from "next";
import Excel from "./excel";

export const metadata: Metadata = {
  title: "Upload Excel - Talent Development System",
};

export default function Page() {
  return <Excel />;
}
