"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

interface MentoringSession {
  id: string;
  mentorName: string;
  period: string;
  menteeName: string;
  department: string;
  program: string;
  sessionNumber: string;
  date: string;
  duration: string;
  purpose: string;
  observation: string;
  reflection: string;
  actionPlan: string;
  additionalNotes: string;
}

interface MentoringListDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  menteeName: string;
}

// Dummy data untuk testing
const dummyMentoringData: MentoringSession[] = [
  {
    id: "1",
    mentorName: "Dr. Ahmad Wijaya",
    period: "Oktober 2023",
    menteeName: "John Doe",
    department: "Engineering",
    program: "MDP",
    sessionNumber: "1",
    date: "2023-10-15",
    duration: "60 menit",
    purpose: "Diskusi tentang pengembangan leadership skills dan komunikasi efektif dalam tim",
    observation: "Mentee menunjukkan antusiasme tinggi dalam belajar, namun masih perlu meningkatkan confidence dalam presentasi",
    reflection: "Sesi berjalan dengan baik, mentee sangat responsif terhadap feedback yang diberikan",
    actionPlan: "Mentee akan berlatih presentasi di depan tim kecil dan mengikuti workshop public speaking",
    additionalNotes: "Mentee meminta sesi tambahan untuk role-playing scenarios"
  },
  {
    id: "2",
    mentorName: "Ir. Siti Nurhaliza",
    period: "November 2023",
    menteeName: "John Doe",
    department: "Engineering",
    program: "MDP",
    sessionNumber: "2",
    date: "2023-11-20",
    duration: "90 menit",
    purpose: "Review progress dari action plan sebelumnya dan diskusi tentang project management",
    observation: "Mentee sudah menunjukkan improvement dalam confidence, mulai aktif dalam meeting tim",
    reflection: "Progress yang sangat baik, mentee mulai menunjukkan potensi leadership",
    actionPlan: "Mentee akan memimpin project kecil dan melakukan monthly review dengan tim",
    additionalNotes: "Mentee siap untuk tantangan yang lebih besar"
  },
  {
    id: "3",
    mentorName: "Prof. Budi Santoso",
    period: "Desember 2023",
    menteeName: "John Doe",
    department: "Engineering",
    program: "MDP",
    sessionNumber: "3",
    date: "2023-12-18",
    duration: "75 menit",
    purpose: "Evaluasi kemampuan strategic thinking dan planning untuk quarter berikutnya",
    observation: "Mentee sudah mampu berpikir strategis dan memberikan solusi inovatif untuk masalah kompleks",
    reflection: "Mentee sudah ready untuk role yang lebih senior, menunjukkan growth yang signifikan",
    actionPlan: "Persiapan untuk promosi ke senior position dan mentoring junior staff",
    additionalNotes: "Excellent progress, recommended for leadership track"
  }
];

export default function MentoringListDialog({
  open,
  setOpen,
  menteeName,
}: MentoringListDialogProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const toggleExpanded = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[1200px] !h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Data Mentoring</DialogTitle>
          <div className="flex justify-between items-center">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-12" />
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase">Data Mentoring</h1>
              <p className="text-sm text-gray-600">{menteeName}</p>
            </div>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-12" />
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {dummyMentoringData.map((session) => (
            <div key={session.id} className="border rounded-lg shadow-sm bg-white">
              {/* Header - Always visible */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">
                          {session.purpose.length > 80 
                            ? `${session.purpose.substring(0, 80)}...` 
                            : session.purpose
                          }
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Mentor:</span> {session.mentorName} | 
                          <span className="font-medium"> Sesi:</span> {session.sessionNumber} | 
                          <span className="font-medium"> Tanggal:</span> {new Date(session.date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {expandedSession === session.id ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSession === session.id && (
                <div className="border-t bg-gray-50 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Informasi Dasar</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Nama Mentor:</span> {session.mentorName}</p>
                          <p><span className="font-medium">Periode:</span> {session.period}</p>
                          <p><span className="font-medium">Nama Mentee:</span> {session.menteeName}</p>
                          <p><span className="font-medium">Departemen:</span> {session.department}</p>
                          <p><span className="font-medium">Program:</span> {session.program}</p>
                          <p><span className="font-medium">Sesi ke:</span> {session.sessionNumber}</p>
                          <p><span className="font-medium">Tanggal:</span> {new Date(session.date).toLocaleDateString('id-ID')}</p>
                          <p><span className="font-medium">Durasi:</span> {session.duration}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Tujuan/Isu yang Dibahas</h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {session.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Observasi Terhadap Mentee</h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {session.observation}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Refleksi Mentor</h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {session.reflection}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Rencana Aksi</h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {session.actionPlan}
                        </p>
                      </div>

                      {session.additionalNotes && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Catatan Tambahan</h4>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                            {session.additionalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {dummyMentoringData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada data mentoring untuk {menteeName}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}