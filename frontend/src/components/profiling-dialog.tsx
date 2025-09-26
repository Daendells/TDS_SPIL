import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface ProfilingDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  report: any;
}

export default function ProfilingDialog({
  open,
  setOpen,
  report,
}: ProfilingDialogProps) {
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
          <div className="flex justify-between items-center">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-12" />
            <h1 className="text-2xl font-bold uppercase">Talent Profile</h1>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-12" />
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
                  <p><strong>Nama:</strong> {report.nama}</p>
                  <p><strong>Tanggal Lahir:</strong> {report.tanggalLahir}</p>
                  <p><strong>Usia:</strong> {report.age}</p>
                  <p><strong>Jabatan:</strong> {report.jabatan}</p>
                  <p><strong>Vessel Name:</strong> {report.vesselName}</p>
                  <p><strong>Seaman Code:</strong> {report.seamanCode}</p>
                  <p><strong>Seafarer Code:</strong> {report.seafarerCode}</p>
                  <p><strong>Start Date:</strong> {report.startDate}</p>
                  <p><strong>Pendidikan Terakhir:</strong> {report.certificate}</p>
                </div>

                {/* Foto di samping, rata tengah */}
                <div className="flex-shrink-0 flex items-center">
                  <img
                    src={report.photoUrl || "/images/default-photo.png"}
                    alt="Foto Profil"
                    className="w-32 h-40 object-cover border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Catatan indisipliner */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">CATATAN TERKAIT DENGAN INDISIPLINER</h2>
              <p><strong>Surat Peringatan:</strong> {report.warningLetter}</p>
              <p><strong>Kasus yang Pernah Dilakukan:</strong> {report.caseHistory}</p>
              <p><strong>Tahun SP/Kasus:</strong> {report.yearOfCase}</p>
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
                          <td className="border px-2 py-1">{vessel?.trim() || "-"}</td>
                          <td className="border px-2 py-1">{rank?.trim() || "-"}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Training */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">DATA TRAINING</h2>
              <p><strong>Sudah diikuti:</strong> {report.trainingCompleted}</p>
              <p><strong>Belum diikuti:</strong> {report.trainingPlanned}</p>
            </div>

            {/* Mentoring */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">DATA MENTORING</h2>
              <p><strong>Sudah diikuti:</strong> {report.mentoringCompleted}</p>
              <p><strong>Belum diikuti:</strong> {report.mentoringPlanned}</p>
            </div>

            {/* Coaching */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm h-full">
              <h2 className="font-bold text-lg mb-2">DATA COACHING</h2>
              <p><strong>Sudah diikuti:</strong> {report.coachingCompleted}</p>
              <p><strong>Belum diikuti:</strong> {report.coachingPlanned}</p>
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-6">
            {/* Informasi kinerja */}
            <div className="border rounded-xl shadow-sm p-4 bg-white text-sm flex flex-col h-full">
              <h2 className="font-bold text-lg mb-2">INFORMASI KINERJA</h2>
              <table className="w-full text-sm mb-4 border">
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">Values Assessment</td>
                    <td className="border px-2 py-1">{report.valueAssessment}</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Assessment Center</td>
                    <td className="border px-2 py-1">{report.assessmentCenter}</td>
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
              <img
                src="/images/logo2.png"
                alt="Logo Perusahaan"
                className="h-10 mx-auto mt-4"
              />
            </div>
          </div>
        </div>

        {/* Baris bawah */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="border rounded-xl shadow-sm p-4 bg-white text-sm">
            <h2 className="font-bold text-lg mb-2">SUCCESSION PLAN</h2>
            <p><strong>Data Incumbent:</strong> {report.dataIncumbent}</p>
            <p><strong>Suksesi ke Kapal:</strong> {report.successionVessel}</p>
            <p><strong>Rank:</strong> {report.successionRank}</p>
            <p><strong>Readiness:</strong> {report.readiness}</p>
          </div>

          <div className="border rounded-xl shadow-sm p-4 bg-white text-sm">
            <h2 className="font-bold text-lg mb-2">INDIVIDUAL DEVELOPMENT PLAN (IDP)</h2>
            <p><strong>Program (Kategori):</strong> {report.idpProgram}</p>
            <p><strong>Nama Program:</strong> {report.idp}</p>
            <p><strong>Mulai Program:</strong> {report.idpStart}</p>
            <p><strong>Mentor:</strong> {report.idpMentor}</p>
            <p><strong>Coach:</strong> {report.idpCoach}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}