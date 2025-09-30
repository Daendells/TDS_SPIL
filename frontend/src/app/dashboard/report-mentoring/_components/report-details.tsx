"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface IMentoringReport {
  id: number;
  mentorName: string;
  menteeName: string;
  department: string;
  program: string;
  sessionNumber: string;
  date: string;
  duration: string;
  period?: string;
  goals?: string;
  observations?: string;
  reflections?: string;
  actionPlan?: string;
  additionalNotes?: string;
}

interface ReportDetailsProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  report: IMentoringReport | null;
}

export default function ReportDetails({ open, setOpen, report }: ReportDetailsProps) {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="sr-only">Detail Report Mentoring</DialogTitle>
          <div className="flex justify-between items-center">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-12" />
            <h1 className="text-2xl font-bold uppercase">Detail Report Mentoring (MONTHLY)</h1>
            <h2 className="h-12" />
          </div>
        </DialogHeader>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6 mt-6 items-stretch">
          <div className="flex flex-col gap-6">
            <div className="border rounded-xl shadow-sm p-6 bg-white text-sm space-y-1">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">INFORMASI MENTOR & MENTEE</h2>
              <div className="space-y-3 px-2">
                <p><strong>Nama Mentor:</strong> {report.mentorName}</p>
                <p><strong>Periode:</strong> {report.period || "-"}</p>
                <p><strong>Nama Mentee:</strong> {report.menteeName}</p>
                <p><strong>Departemen:</strong> {report.department}</p>
                <p><strong>Program:</strong> {report.program}</p>
                <p><strong>Sesi ke:</strong> {report.sessionNumber}</p>
                <p><strong>Tanggal:</strong> {report.date}</p>
                <p><strong>Durasi:</strong> {report.duration}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="border rounded-xl shadow-sm p-6 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">TUJUAN/ISU YANG DIBAHAS</h2>
              <div className="whitespace-pre-line px-2 py-1">{report.goals || "-"}</div>
            </div>

            <div className="border rounded-xl shadow-sm p-6 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">OBSERVASI TERHADAP COACHEE</h2>
              <div className="whitespace-pre-line px-2 py-1">{report.observations || "-"}</div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="border rounded-xl shadow-sm p-6 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">REFLEKSI MENTOR</h2>
              <div className="whitespace-pre-line px-2 py-1">{report.reflections || "-"}</div>
            </div>

            <div className="border rounded-xl shadow-sm p-6 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">RENCANA AKSI (WAY FORWARD)</h2>
              <div className="whitespace-pre-line px-2 py-1">{report.actionPlan || "-"}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="border rounded-xl shadow-sm p-6 bg-white text-sm">
            <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">CATATAN TAMBAHAN</h2>
            <div className="whitespace-pre-line px-2 py-1">{report.additionalNotes || "-"}</div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <img src="/images/logo2.png" alt="Logo Perusahaan" className="h-10" />
        </div>
      </DialogContent>
    </Dialog>
  );
}