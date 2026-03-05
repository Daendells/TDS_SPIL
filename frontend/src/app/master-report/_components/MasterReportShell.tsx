"use client";

import { useState } from "react";
import MasterPage from "../master-report";
import AssignmentTable from "../../assignments/assignmentTable";
import { Separator } from "@/components/ui/separator";

export default function MasterReportShell() {
  const [sharedBatchId, setSharedBatchId] = useState<number | null>(null);

  return (
    <>
      <MasterPage onBatchChange={setSharedBatchId} />
      <Separator className="my-6" />
      <AssignmentTable batchId={sharedBatchId !== null ? sharedBatchId.toString() : null} />
    </>
  );
}
