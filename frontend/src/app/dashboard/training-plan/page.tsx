import { Metadata } from "next";
import TrainingPlan from "./training-plan";

export const metadata: Metadata = {
  title: "Training Plan",
};

export default function TrainingPlanPage() {
  return <TrainingPlan />;
}