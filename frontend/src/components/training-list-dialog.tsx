"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { api } from "@/app/lib/api";
import Image from "next/image";

interface TrainingRecord {
  courseName: string;
  startDate: string;
  finishDate: string;
  pointPre: number;
  pointPost: number;
  minimumPoint: number;
  coursesHours: number;
  competencyCode: string;
}

interface TrainingListDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  seafarerCode: string;
  reportName?: string;
}

export default function TrainingListDialog({
  open,
  setOpen,
  seafarerCode,
  reportName = "Unknown",
}: TrainingListDialogProps) {
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([]);
  const [expandedTraining, setExpandedTraining] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTrainingData = async () => {
    if (!seafarerCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/reports/seafarer-code/${seafarerCode}/training-data`);

      if (response.data.code === 200 && response.data.data) {
        setTrainingData(response.data.data);
      } else {
        setTrainingData([]);
      }
    } catch {
      setError("Gagal memuat data training. Silakan coba lagi.");
      setTrainingData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && seafarerCode) {
      fetchTrainingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seafarerCode]);

  const toggleExpanded = (courseName: string) => {
    setExpandedTraining(expandedTraining === courseName ? null : courseName);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "-") return "-";
    try {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${day}/${month}/${year}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const filteredTrainingData = useMemo(() => {
    if (!searchTerm.trim()) return trainingData;
    const searchLower = searchTerm.toLowerCase();
    return trainingData.filter(
      (training) =>
        training.courseName.toLowerCase().includes(searchLower) ||
        training.competencyCode.toLowerCase().includes(searchLower)
    );
  }, [trainingData, searchTerm]);

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setExpandedTraining(null);
    }
  }, [open]);

  const isCompleted = (finishDate: string) => {
    return finishDate && finishDate !== "-";
  };

  const isPassed = (pointPost: number, minimumPoint: number) => {
    return pointPost >= minimumPoint;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[1200px] !h-[80vh] top-[5vh] translate-y-0 flex flex-col">
        <DialogHeader>
          <DialogTitle className="sr-only">Data Training</DialogTitle>
          <div className="flex justify-between items-center border-b pb-4">
            <Image
              width={48}
              height={48}
              src="/images/logo1.png"
              alt="Logo Kiri"
              className="h-12"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase">Data Training</h1>
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
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama training atau competency code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data training...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                  onClick={fetchTrainingData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : filteredTrainingData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">Tidak ada data training</p>
                <p className="text-gray-400 text-sm">
                  {searchTerm
                    ? "Tidak ada training yang sesuai dengan pencarian"
                    : "Belum ada data training yang tersedia"}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTrainingData.map((training, index) => {
                const uniqueId = `${training.courseName}-${index}`;
                const expanded = expandedTraining === uniqueId;
                const completed = isCompleted(training.finishDate);
                const passed = isPassed(training.pointPost, training.minimumPoint);

                return (
                  <div key={uniqueId} className="bg-white">
                    <div
                      className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => toggleExpanded(uniqueId)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {training.courseName}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                            {training.competencyCode}
                          </span>
                          {completed && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {passed ? "LULUS" : "TIDAK LULUS"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>
                            Start:{" "}
                            <span className="font-medium">{formatDate(training.startDate)}</span>
                          </span>
                          <span>
                            Finish:{" "}
                            <span className="font-medium">{formatDate(training.finishDate)}</span>
                          </span>
                          <span>
                            Durasi: <span className="font-medium">{training.coursesHours} Jam</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div className="px-4 pb-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">
                              Nilai Pre-Test
                            </h4>
                            <p className="text-gray-900 text-lg font-bold">{training.pointPre}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">
                              Nilai Post-Test
                            </h4>
                            <p className="text-gray-900 text-lg font-bold">{training.pointPost}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">
                              Nilai Minimum
                            </h4>
                            <p className="text-gray-900 text-lg font-bold">
                              {training.minimumPoint}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Status</h4>
                            <p className="text-gray-900 text-base font-medium">
                              {completed ? (
                                passed ? (
                                  <span className="text-green-600">✓ Training Selesai - LULUS</span>
                                ) : (
                                  <span className="text-red-600">
                                    ✓ Training Selesai - TIDAK LULUS
                                  </span>
                                )
                              ) : (
                                <span className="text-orange-600">⏳ Dalam Progress</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t text-center text-sm text-gray-500">
          Total Training: <span className="font-semibold">{filteredTrainingData.length}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
