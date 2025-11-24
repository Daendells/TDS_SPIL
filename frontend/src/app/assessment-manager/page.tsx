import { Metadata } from "next";
import QuestionsAdmin from "./questions-admin";

export const metadata: Metadata = {
  title: "Questions Admin - Talent Development System",
};

export default function Page() {
  return <QuestionsAdmin />;
}
