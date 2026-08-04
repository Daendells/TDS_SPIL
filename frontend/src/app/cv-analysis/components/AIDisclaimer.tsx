"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Info } from "lucide-react";

export function AIDisclaimer() {
  return (
    <Alert className="bg-amber-50 border-amber-200 shadow-sm">
      <ShieldAlert className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800 font-semibold">
        AI-Generated Analysis — Not a Final Decision
      </AlertTitle>
      <AlertDescription className="text-amber-700 text-sm leading-relaxed mt-2">
        All scores, ratings, graphs, and recommendations above are the result of AI
        analysis and <strong>do not constitute an absolute or final judgment</strong>{" "}
        in the recruitment process. This analysis should be used as a{" "}
        <strong>consideration aid for HR professionals</strong> and must be
        supplemented with human evaluation, interviews, and other assessment methods
        before making any hiring decisions. The AI may not fully capture a candidate's
        potential, interpersonal skills, or cultural alignment. Always verify AI
        recommendations through direct interaction and corroborating evidence.
      </AlertDescription>
    </Alert>
  );
}