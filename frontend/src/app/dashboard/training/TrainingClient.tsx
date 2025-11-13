"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, RefreshCw } from "lucide-react";

interface ITraining {
  no: number;
  competencyTypeId: number;
  lvl: number;
  deskripsi_perilaku?: string;
  tools_training: string;
  kode: string;
  topik_training: string;
  referensi?: string;
  generated_file_url?: string | null;
  generated_at?: string | null;
  competencyType?: {
    id: number;
    code: string;
    name: string;
    description?: string;
    category: string;
  };
}

interface GroupedTraining {
  competencyCode: string;
  competencyName: string;
  deskripsi_perilaku?: string;
  trainings: ITraining[];
}

export default function TrainingPage() {
  const [data, setData] = useState<ITraining[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<ITraining | null>(
    null
  );
  const [tempReferensi, setTempReferensi] = useState("");
  const [regenerateDialog, setRegenerateDialog] = useState<ITraining | null>(
    null
  );

  const apiUrl =
    typeof window === "undefined"
      ? process.env.INTERNAL_API_ENDPOINT
      : process.env.NEXT_PUBLIC_API_ENDPOINT;

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await fetch(`${apiUrl}/trainings`);
        const json = await res.json();
        setData(json.data);
        groupTrainings(json.data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, [apiUrl]);

  const groupTrainings = (trainings: ITraining[]) => {
    const grouped: { [key: string]: GroupedTraining } = {};

    trainings.forEach((training) => {
      const competencyCode = training.competencyType?.code || 'UNKNOWN';
      
      if (!grouped[competencyCode]) {
        grouped[competencyCode] = {
          competencyCode: competencyCode,
          competencyName: training.competencyType?.name || 'Unknown Competency',
          deskripsi_perilaku: training.deskripsi_perilaku,
          trainings: [],
        };
      }
      grouped[competencyCode].trainings.push(training);
    });

    // Sort by competencyCode
    const sortedGroups = Object.values(grouped).sort((a, b) =>
      a.competencyCode.localeCompare(b.competencyCode)
    );

    setGroupedData(sortedGroups);
  };

  const handleGenerate = async (item: ITraining, isRegenerate = false) => {
    setGenerating(item.kode);
    setRegenerateDialog(null);
    
    try {
      const res = await fetch(`${apiUrl}/trainings/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: item.kode,
          topik_training: item.topik_training,
          kompetensi: item.competencyType?.name || '',
          referensi: item.referensi || "",
          lvl: item.lvl,
          tools_training: item.tools_training,
          old_file_url: isRegenerate ? item.generated_file_url : "",
        }),
      });

      const result = await res.json();
      if (res.ok) {
        const message = isRegenerate
          ? "Materi Berhasil Di-regenerate!"
          : "Materi Berhasil Digenerate!";
        alert(message + " Silakan unduh melalui tombol download.");
        
        // Update local state
        const updatedData = data.map((row) =>
          row.kode === item.kode
            ? { ...row, generated_file_url: result.link }
            : row
        );
        setData(updatedData);
        groupTrainings(updatedData);
      } else {
        alert(result.error || "Gagal generate materi.");
      }
    } catch (error) {
      console.error("Error saat generate:", error);
      alert("Terjadi kesalahan saat generate materi.");
    } finally {
      setGenerating(null);
    }
  };

  const handleSaveReferensi = () => {
    if (selectedTraining) {
      const updatedData = data.map((item) =>
        item.kode === selectedTraining.kode
          ? { ...item, referensi: tempReferensi }
          : item
      );
      setData(updatedData);
      groupTrainings(updatedData);
      
      setSelectedTraining(null);
      setTempReferensi("");
    }
  };

  const openRegenerateDialog = (item: ITraining) => {
    setRegenerateDialog(item);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Training Materials</h1>
        <p className="text-gray-600 mt-2">
          Generate dan kelola materi training berdasarkan kompetensi
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Memuat data training...</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {groupedData.map((group) => (
            <AccordionItem
              key={group.competencyCode}
              value={group.competencyCode}
              className="border rounded-lg bg-white shadow-sm"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-bold text-sm">
                      {group.competencyCode}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">
                        {group.competencyName}
                      </h3>                      
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>{group.trainings.length} trainings</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-3 px-4 text-left font-semibold">
                          Level
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Kode
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Topik Training
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">
                          Tools/Framework
                        </th>
                        <th className="py-3 px-4 text-center font-semibold">
                          Referensi
                        </th>
                        <th className="py-3 px-4 text-center font-semibold">
                          Action
                        </th>
                        <th className="py-3 px-4 text-center font-semibold">
                          File
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.trainings.map((item) => (
                        <tr
                          key={item.kode}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full font-semibold text-sm">
                              {item.lvl}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {item.kode}
                          </td>
                          <td className="py-3 px-4">{item.topik_training}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {item.tools_training}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedTraining(item);
                                setTempReferensi(item.referensi || "");
                              }}
                            >
                              {item.referensi ? "Edit" : "Tambah"}
                            </Button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.generated_file_url ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRegenerateDialog(item)}
                                disabled={generating === item.kode}
                                className="gap-2"
                              >
                                <RefreshCw className="w-4 h-4" />
                                {generating === item.kode
                                  ? "Regenerating..."
                                  : "Regenerate"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleGenerate(item, false)}
                                disabled={generating === item.kode}
                              >
                                {generating === item.kode
                                  ? "Generating..."
                                  : "Generate"}
                              </Button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.generated_file_url ? (
                              <Button
                                asChild
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <a
                                  href={item.generated_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="gap-2"
                                >
                                  <FileText className="w-4 h-4" />
                                  Download
                                </a>
                              </Button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Dialog untuk Referensi */}
      <Dialog
        open={selectedTraining !== null}
        onOpenChange={(open) => !open && setSelectedTraining(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah/Edit Referensi</DialogTitle>
            <DialogDescription>
              Silakan tulis tambahan informasi atau referensi yang relevan
              dengan topik:
              <span className="font-semibold ml-1">
                {selectedTraining?.topik_training}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Tulis referensi di sini..."
            value={tempReferensi}
            onChange={(e) => setTempReferensi(e.target.value)}
            className="mt-2 h-32"
          />
          <DialogFooter className="mt-4">
            <Button onClick={handleSaveReferensi}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Regenerate */}
      <AlertDialog
        open={regenerateDialog !== null}
        onOpenChange={(open: boolean) => !open && setRegenerateDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Materi Training?</AlertDialogTitle>
            <AlertDialogDescription>
              Materi training untuk{" "}
              <span className="font-semibold">
                {regenerateDialog?.topik_training}
              </span>{" "}
              sudah pernah digenerate sebelumnya. Apakah Anda ingin
              me-regenerate dengan referensi yang baru? File lama akan
              dihapus dan diganti dengan yang baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                regenerateDialog && handleGenerate(regenerateDialog, true)
              }
            >
              Ya, Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}