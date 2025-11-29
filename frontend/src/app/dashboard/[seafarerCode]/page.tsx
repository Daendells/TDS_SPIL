"use client";

import { useState, use } from "react";
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
import CoachingListDialog from "@/components/coaching-list-dialog";
import AssessmentResultDialog from "@/components/assessment-result-dialog";
import { useGetReportBySeafarerCode } from "@/app/dashboard/_hooks/useReportData";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    seafarerCode: string;
  }>;
}

export default function TalentProfilePage({ params }: PageProps) {
  const { seafarerCode } = use(params);
  const [mentoringDialogOpen, setMentoringDialogOpen] = useState(false);
  const [coachingDialogOpen, setCoachingDialogOpen] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);

  // Fetch report data using React Query hook
  const { data: report, isLoading, error } = useGetReportBySeafarerCode(seafarerCode);

  // Show loading while waiting for seafarerCode to be set or while fetching
  if (!seafarerCode || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading talent profile...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">
            {error ? (error as Error).message : "Failed to load talent profile"}
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Prepare data for kinerja chart
  const dataKinerja = [
    { subject: "Values Assessment", value: report.valueAssessmentScore || 0 },
    { subject: "Assessment Center", value: report.assessmentCenter || 0 },
    { subject: "Kondite Review", value: report.konditeReview || 0 },
    { subject: "KPI Vessel", value: report.kpiVessel || 0 },
  ];

  return (
    <div className="min-h-screen  py-6 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center gap-4">
          <Image
            src="/images/logo1.png"
            alt="Logo Kiri"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
          <h1 className="text-2xl md:text-3xl font-bold uppercase text-center">Talent Profile</h1>
          <Image
            src="/images/logo2.png"
            alt="Logo Kanan"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </div>
      </div>

      {/* Main Content Grid - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Kolom kiri */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* DATA PRIBADI */}
          <div className="border rounded-lg shadow-sm p-4 bg-white">
            <h2 className="font-bold text-lg mb-4 pb-2 border-b">DATA PRIBADI</h2>
            <div className="flex flex-col md:flex-row lg:flex-col gap-4">
              {/* Informasi teks */}
              <div className="flex-1 space-y-2 text-sm">
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
                  <strong>Vessel:</strong> {report.vesselName}
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
                  <strong>Pendidikan:</strong> {report.certificate}
                </p>
              </div>

              {/* Foto */}
              <div className="flex-shrink-0 flex justify-center lg:justify-start">
                <Image
                  src="/images/default-photo.png"
                  alt="Foto Profil"
                  width={128}
                  height={160}
                  className="w-28 h-36 object-cover border rounded"
                />
              </div>
            </div>
          </div>

          {/* Catatan indisipliner */}
          <div className="border rounded-lg shadow-sm p-4 bg-white">
            <h2 className="font-bold text-lg mb-4 pb-2 border-b">CATATAN INDISIPLINER</h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Surat Peringatan:</strong> {report.warningLetter}
              </p>
              <p>
                <strong>Kasus yang Pernah Dilakukan:</strong> {report.caseHistory}
              </p>
              <p>
                <strong>Tahun SP/Kasus:</strong> {report.yearOfCase}
              </p>
            </div>
          </div>
        </div>

        {/* Kolom tengah */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Data history vessel */}
          <div className="border rounded-lg shadow-sm p-4 bg-white">
            <h2 className="font-bold text-lg mb-4 pb-2 border-b">DATA HISTORY VESSEL</h2>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-3 py-2 text-left">Vessel</th>
                    <th className="border px-3 py-2 text-left">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {report.vesselHistory?.split(";").map((entry: string, idx: number) => {
                    const [vessel, rank] = entry.split("|");
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{vessel?.trim() || "-"}</td>
                        <td className="border px-3 py-2">{rank?.trim() || "-"}</td>
                      </tr>
                    );
                  })}
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

          {/* Training Data Table */}
          <div className="border rounded-lg shadow-sm p-4 bg-white">
            <h2 className="font-bold text-lg mb-4 pb-2 border-b">DATA TRAINING</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left font-semibold">Category</th>
                    <th className="border px-3 py-2 text-center font-semibold">Completed</th>
                    <th className="border px-3 py-2 text-center font-semibold">Not Completed</th>
                    <th className="border px-3 py-2 text-center font-semibold">Percentage</th>
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
                    <td className="border px-3 py-2 text-center text-blue-600">72.7%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mentoring */}
          <div
            className="border rounded-lg shadow-sm p-4 bg-white cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setMentoringDialogOpen(true)}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">DATA MENTORING</h2>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                <strong>Sudah diikuti:</strong> {report.mentoringCompleted}
              </p>
              <p>
                <strong>Belum diikuti:</strong> {report.mentoringPlanned}
              </p>
            </div>
          </div>

          {/* Coaching */}
          <div
            className="border rounded-lg shadow-sm p-4 bg-white cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCoachingDialogOpen(true)}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">DATA COACHING</h2>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                <strong>Sudah diikuti:</strong> {report.coachingCompleted}
              </p>
              <p>
                <strong>Belum diikuti:</strong> {report.coachingPlanned}
              </p>
            </div>
          </div>
        </div>

        {/* Kolom kanan */}
        <div className="lg:col-span-1">
          {/* Informasi kinerja */}
          <div className="border rounded-lg shadow-sm p-4 bg-white h-full flex flex-col">
            <h2 className="font-bold text-lg mb-4 pb-2 border-b">INFORMASI KINERJA</h2>

            {/* Tabel scores */}
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm border">
                <tbody>
                  <tr
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setAssessmentDialogOpen(true)}
                  >
                    <td className="border px-3 py-2 flex items-center justify-between">
                      <span>Values Assessment</span>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {report.valueAssessmentScore || "-"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border px-3 py-2">Assessment Center</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {report.assessmentCenter || "-"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border px-3 py-2">Kondite Review</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {report.konditeReview || "-"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border px-3 py-2">KPI Vessel</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {report.kpiVessel || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Radar Chart */}
            <div className="flex-1 min-h-64">
              <ResponsiveContainer width="100%" height="100%">
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

            {/* Footer Logo */}
            <div className="mt-4 flex justify-center">
              <Image
                src="/images/logo2.png"
                alt="Logo Perusahaan"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Succession Plan */}
        <div className="border rounded-lg shadow-sm p-4 bg-white">
          <h2 className="font-bold text-lg mb-4 pb-2 border-b">SUCCESSION PLAN</h2>
          <div className="space-y-2 text-sm">
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
              <strong>Readiness:</strong> {report.totalReadinessUpdateMonths + " Months"}
            </p>
          </div>
        </div>

        {/* IDP */}
        <div className="border rounded-lg shadow-sm p-4 bg-white">
          <h2 className="font-bold text-lg mb-4 pb-2 border-b">
            INDIVIDUAL DEVELOPMENT PLAN (IDP)
          </h2>
          <div className="space-y-2 text-sm">
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
      </div>

      {/* Dialogs */}
      <MentoringListDialog
        open={mentoringDialogOpen}
        setOpen={setMentoringDialogOpen}
        reportId={report.id}
        reportName={report.nama || "Unknown"}
      />

      <CoachingListDialog
        open={coachingDialogOpen}
        setOpen={setCoachingDialogOpen}
        reportId={report.id}
        reportName={report.nama || "Unknown"}
      />

      <AssessmentResultDialog
        open={assessmentDialogOpen}
        setOpen={setAssessmentDialogOpen}
        seafarerCode={report.seafarerCode}
        seamanName={report.nama || "Unknown"}
      />
    </div>
  );
}
