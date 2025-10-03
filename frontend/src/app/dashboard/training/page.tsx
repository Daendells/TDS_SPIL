import { Metadata } from "next";
import Training from "./training";

export const metadata: Metadata = {
  title: "Training - Talent Development System",
};

export default function Page() {
  return <Training />;
}