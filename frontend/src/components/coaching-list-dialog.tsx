"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDownIcon, ChevronRightIcon, SearchIcon, FilterIcon } from "lucide-react";
import { api } from "@/app/lib/api";
import Image from "next/image";

interface CoachingSession {
  id: number;
  coachName: string;
  period: string;
  coacheeNames: string[];
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
  reportIds: number[];
  createdAt: string;
  updatedAt: string;
}

interface CoachingListDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  reportId: number;
  reportName?: string;
}

export default function CoachingListDialog({
  open,
  setOpen,
  reportId,
  reportName = "Unknown",
}: CoachingListDialogProps) {
  const [coachingData, setCoachingData] = useState<CoachingSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  const fetchCoachingReports = useCallback(async () => {
    if (!reportId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/coaching-reports/reports/${reportId}`);

      if (response.data.code === 200 && response.data.data && response.data.data.data) {
        setCoachingData(response.data.data.data);
      } else {
        setCoachingData([]);
      }
    } catch {
      setError("Gagal memuat data coaching. Silakan coba lagi.");
      setCoachingData([]);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (open && reportId) {
      fetchCoachingReports();
    }
  }, [open, reportId, fetchCoachingReports]);

  const toggleExpanded = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID");
    } catch {
      return dateString;
    }
  };

  const filteredCoachingData = useMemo(() => {
    let filtered = coachingData;
    if (selectedProgram !== "all") {
      filtered = filtered.filter(
        (session) => session.program.toLowerCase() === selectedProgram.toLowerCase()
      );
    }
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.coachName.toLowerCase().includes(searchLower) ||
          session.purpose.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [coachingData, selectedProgram, searchTerm]);

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setSelectedProgram("all");
      setExpandedSession(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[1200px] !h-[80vh] top-[5vh] translate-y-0 flex flex-col">
        <DialogHeader>
          <DialogTitle className="sr-only">Data Coaching</DialogTitle>
          <div className="flex justify-between items-center border-b pb-4">
            <Image
              width={48}
              height={48}
              src="/images/logo1.png"
              alt="Logo Kiri"
              className="h-12"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase">Data Coaching</h1>
              <p className="text-sm text-gray-600">{reportName}</p>
            </div>
            <Image
              width={48}
              height={48}
              src="/images/logo2.png"
              alt="Logo Kanan"
              className="h-12"
            />
          </div>
        </DialogHeader>

        <div className="pt-4 pb-2">
          <div className="flex flex-col sm:flex-row gap-4 mb-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama coach atau tujuan/isu yang dibahas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="relative">
              <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white min-w-[150px]"
              >
                <option value="all">Semua Program</option>
                <option value="mdp">MDP</option>
                <option value="fdp">FDP</option>
                <option value="sdp">SDP</option>
              </select>
            </div>
          </div>
          {!loading && !error && (
            <div className="text-sm text-gray-600">
              {searchTerm || selectedProgram !== "all" ? (
                <p>
                  Menampilkan {filteredCoachingData.length} dari {coachingData.length} data coaching
                  {searchTerm && ` untuk pencarian "${searchTerm}"`}
                  {selectedProgram !== "all" && ` dengan program ${selectedProgram.toUpperCase()}`}
                </p>
              ) : (
                <p>Menampilkan {coachingData.length} data coaching</p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-2 pr-2">
          {loading && (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Memuat data coaching...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchCoachingReports}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!loading && !error && filteredCoachingData.length > 0 && (
            <div className="flex flex-col gap-3">
              {filteredCoachingData.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpanded(session.id.toString())}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2 leading-tight">
                          {session.purpose}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Coach:</span> {session.coachName} |
                            <span className="font-medium"> Sesi:</span> {session.sessionNumber} |
                            <span className="font-medium"> Tanggal:</span>{" "}
                            {formatDate(session.date)}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Coachee:</span>{" "}
                            {session.coacheeNames.join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 mt-1">
                        {expandedSession === session.id.toString() ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedSession === session.id.toString() && (
                    <div className="bg-gray-50 p-5 border-t">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">
                              Informasi Dasar
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p>
                                <span className="font-medium text-gray-700">Nama Coach:</span>{" "}
                                <span className="text-gray-600">{session.coachName}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">Periode:</span>{" "}
                                <span className="text-gray-600">{session.period}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">Nama Coachee:</span>{" "}
                                <span className="text-gray-600">
                                  {session.coacheeNames.join(", ")}
                                </span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">Departemen:</span>{" "}
                                <span className="text-gray-600">{session.department}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">Program:</span>{" "}
                                <span className="text-gray-600">{session.program}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">Sesi ke:</span>{" "}
                                <span className="text-gray-600">{session.sessionNumber}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">Tanggal:</span>{" "}
                                <span className="text-gray-600">{formatDate(session.date)}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">Durasi:</span>{" "}
                                <span className="text-gray-600">{session.duration}</span>
                              </p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">
                              Tujuan/Isu yang Dibahas
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {session.purpose}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">
                              Observasi Terhadap Coachee
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {session.observation}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">
                              Refleksi Coach
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {session.reflection}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 text-base">
                              Rencana Aksi
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {session.actionPlan}
                            </p>
                          </div>
                          {session.additionalNotes && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-semibold text-gray-800 mb-3 text-base">
                                Catatan Tambahan
                              </h4>
                              <p className="text-sm text-gray-700 leading-relaxed">
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
            </div>
          )}

          {!loading && !error && coachingData.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Belum ada data coaching</p>
            </div>
          )}

          {!loading && !error && coachingData.length > 0 && filteredCoachingData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <p className="text-gray-500 text-center">
                Tidak ada data yang cocok dengan kriteria Anda
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedProgram("all");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
