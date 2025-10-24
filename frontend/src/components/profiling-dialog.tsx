import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ChevronRightIcon } from "lucide-react";
import MentoringListDialog from "@/components/mentoring-list-dialog";
import AssessmentResultDialog from "@/components/assessment-result-dialog";
import { useApi } from "@/hooks/use-api";
import Image from "next/image";
import { IReport } from "@/types/global-types";

interface ProfilingDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  report: IReport;
}

export default function ProfilingDialog({
  open,
  setOpen,
  report,
}: ProfilingDialogProps) {
  const [mentoringDialogOpen, setMentoringDialogOpen] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const { get } = useApi();

  useEffect(() => {
    if (report?.seafarerCode) {
      get(`/assessment-results/seafarer/${report.seafarerCode}`)
        .then((response) => {
          // Check if response is successful and has data
          if (response.data && response.data.code === 200) {
            if (response.data.data && response.data.data.totalFinalScore) {
              setAssessmentScore(
                Math.round(response.data.data.totalFinalScore * 10) / 10
              );
            } else {
              // Backend returned success but with null data (seafarer hasn't completed assessment)
              setAssessmentScore(null);
            }
          } else {
            setAssessmentScore(null);
          }
        })
        .catch(() => {
          // Handle any network or other errors
          setAssessmentScore(null);
        });
    }
  }, [report?.seafarerCode, get]);

  if (!report) return null;

  const dataKinerja = [
    { subject: "Values Assessment", value: report.valueAssessment },
    { subject: "Assessment Center", value: report.assessmentCenter },
    { subject: "Kondite Review", value: report.konditeReview },
    { subject: "KPI Vessel", value: report.kpiVessel },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[95vw] !max-w-[1600px] !h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="sr-only">Talent Profile</DialogTitle>
          <div className="flex justify-between items-center">
            <Image
              src="/images/logo1.png"
              alt="Logo Kiri"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold uppercase">Talent Profile</h1>
            <Image
              src="/images/logo2.png"
              alt="Logo Kanan"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
          </div>
        </DialogHeader>

        {/* Grid utama */}
        <div className="grid grid-cols-3 gap-6 mt-6 items-stretch">
          {/* Kolom kiri */}
          <div className="flex flex-col gap-6">
            {/* DATA PRIBADI */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm space-y-1">
              <h2 className="font-bold text-lg mb-2">DATA PRIBADI</h2>
              <div className="flex items-center gap-4">
                {/* Informasi teks */}
                <div className="flex-1 space-y-1">
                  <p>
                    <strong>Nama:</strong> {report.nama}
                  </p>
                  <p>
                    <strong>Tanggal Lahir:</strong> {report.tanggalLahir}
                  </p>
                  <p>
                    <strong>Usia:</strong> {report.age}
                  </p>
                  <p>
                    <strong>Jabatan:</strong> {report.jabatan}
                  </p>
                  <p>
                    <strong>Vessel Name:</strong> {report.vesselName}
                  </p>
                  <p>
                    <strong>Seaman Code:</strong> {report.seamanCode}
                  </p>
                  <p>
                    <strong>Seafarer Code:</strong> {report.seafarerCode}
                  </p>
                  <p>
                    <strong>Start Date:</strong> {report.startDate}
                  </p>
                  <p>
                    <strong>Pendidikan Terakhir:</strong> {report.certificate}
                  </p>
                </div>

                {/* Foto di samping, rata tengah */}
                <div className="flex-shrink-0 flex items-center">
                  <Image
                    src={"/images/default-photo.png"}
                    alt="Foto Profil"
                    width={128}
                    height={160}
                    className="w-32 h-40 object-cover border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Catatan indisipliner */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">
                CATATAN TERKAIT DENGAN INDISIPLINER
              </h2>
              <p>
                <strong>Surat Peringatan:</strong> {report.warningLetter}
              </p>
              <p>
                <strong>Kasus yang Pernah Dilakukan:</strong>{" "}
                {report.caseHistory}
              </p>
              <p>
                <strong>Tahun SP/Kasus:</strong> {report.yearOfCase}
              </p>
            </div>
          </div>

          {/* Kolom tengah */}
          <div className="flex flex-col gap-6">
            {/* Data history vessel */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">DATA HISTORY VESSEL</h2>
              <table className="w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Vessel</th>
                    <th className="border px-2 py-1">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {report.vesselHistory
                    ?.split(";")
                    .map((entry: string, idx: number) => {
                      const [vessel, rank] = entry.split("|");
                      return (
                        <tr key={idx}>
                          <td className="border px-2 py-1">
                            {vessel?.trim() || "-"}
                          </td>
                          <td className="border px-2 py-1">
                            {rank?.trim() || "-"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Training */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full flex flex-col">
              <h2 className="font-bold text-lg mb-4">DATA TRAINING</h2>
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left font-semibold">
                        Category
                      </th>
                      <th className="border px-3 py-2 text-center font-semibold">
                        Completed
                      </th>
                      <th className="border px-3 py-2 text-center font-semibold">
                        Not Completed
                      </th>
                      <th className="border px-3 py-2 text-center font-semibold">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-3 py-2">Mandatory</td>
                      <td className="border px-3 py-2 text-center">5</td>
                      <td className="border px-3 py-2 text-center">2</td>
                      <td className="border px-3 py-2 text-center font-semibold text-blue-600">
                        71.4%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-3 py-2">Non Mandatory</td>
                      <td className="border px-3 py-2 text-center">3</td>
                      <td className="border px-3 py-2 text-center">1</td>
                      <td className="border px-3 py-2 text-center font-semibold text-blue-600">
                        75.0%
                      </td>
                    </tr>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border px-3 py-2">Total</td>
                      <td className="border px-3 py-2 text-center">8</td>
                      <td className="border px-3 py-2 text-center">3</td>
                      <td className="border px-3 py-2 text-center text-blue-600">
                        72.7%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Training */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">DATA TRAINING</h2>
              <p>
                <strong>Sudah diikuti:</strong> {report.trainingCompleted}
              </p>
              <p>
                <strong>Belum diikuti:</strong> {report.trainingPlanned}
              </p>
            </div>

            {/* Mentoring */}
            <div
              className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setMentoringDialogOpen(true)}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">DATA MENTORING</h2>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Coaching */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">DATA COACHING</h2>
              <p>
                <strong>Sudah diikuti:</strong> {report.coachingCompleted}
              </p>
              <p>
                <strong>Belum diikuti:</strong> {report.coachingPlanned}
              </p>
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-6">
            {/* Informasi kinerja */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm flex flex-col h-full">
              <h2 className="font-bold text-lg mb-2">INFORMASI KINERJA</h2>
              <table className="w-full text-sm mb-4 border">
                <tbody>
                  <tr
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setAssessmentDialogOpen(true)}
                  >
                    <td className="border px-2 py-1 flex items-center justify-between">
                      Values Assessment
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </td>
                    <td className="border px-2 py-1">
                      {assessmentScore !== null
                        ? assessmentScore
                        : report.valueAssessment}
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Assessment Center</td>
                    <td className="border px-2 py-1">
                      {report.assessmentCenter}
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Kondite Review</td>
                    <td className="border px-2 py-1">{report.konditeReview}</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">KPI Vessel</td>
                    <td className="border px-2 py-1">{report.kpiVessel}</td>
                  </tr>
                </tbody>
              </table>
              <div className="h-56">
                <ResponsiveContainer>
                  <RadarChart data={dataKinerja}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                    <Radar
                      name="Kinerja"
                      dataKey="value"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <Image
                src="/images/logo2.png"
                alt="Logo Perusahaan"
                width={40}
                height={40}
                className="h-10 mx-auto mt-4"
              />
            </div>
          </div>
        </div>

        {/* Baris bawah */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="border rounded-xl shadow-sm p-4 bg-white text-sm">
            <h2 className="font-bold text-lg mb-2">SUCCESSION PLAN</h2>
            <p>
              <strong>Data Incumbent:</strong> {report.dataIncumbent}
            </p>
            <p>
              <strong>Suksesi ke Kapal:</strong> {report.successionVessel}
            </p>
            <p>
              <strong>Rank:</strong> {report.successionRank}
            </p>
            <p>
              <strong>Readiness:</strong> {report.readiness}
            </p>
          </div>

          <div className="border rounded-xl shadow-sm p-4 bg-white text-sm">
            <h2 className="font-bold text-lg mb-2">
              INDIVIDUAL DEVELOPMENT PLAN (IDP)
            </h2>
            <p>
              <strong>Program (Kategori):</strong> {report.idpProgram}
            </p>
            <p>
              <strong>Nama Program:</strong> {report.idp}
            </p>
            <p>
              <strong>Mulai Program:</strong> {report.idpStart}
            </p>
            <p>
              <strong>Mentor:</strong> {report.idpMentor}
            </p>
            <p>
              <strong>Coach:</strong> {report.idpCoach}
            </p>
          </div>
        </div>
      </DialogContent>

      {/* Mentoring List Dialog */}
      <MentoringListDialog
        open={mentoringDialogOpen}
        setOpen={setMentoringDialogOpen}
        reportId={report.id}
        reportName={report.nama || "Unknown"}
      />

      {/* Assessment Result Dialog */}
      <AssessmentResultDialog
        open={assessmentDialogOpen}
        setOpen={setAssessmentDialogOpen}
        seafarerCode={report.seafarerCode}
        seamanName={report.nama || "Unknown"}
      />
    </Dialog>
  );
}
