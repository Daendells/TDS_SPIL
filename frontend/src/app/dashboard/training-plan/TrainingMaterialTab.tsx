"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, RefreshCw, Edit, Trash2, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  generated_pdf_url?: string | null;
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

export default function TrainingMaterialTab() {
  const [data, setData] = useState<ITraining[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<ITraining | null>(null);
  const [tempReferensi, setTempReferensi] = useState("");
  const [regenerateDialog, setRegenerateDialog] = useState<ITraining | null>(null);
  const [editingTraining, setEditingTraining] = useState<ITraining | null>(null);
  const [editForm, setEditForm] = useState({
    lvl: 0,
    kode: "",
    topik_training: "",
    deskripsi_perilaku: "",
    tools_training: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTraining, setDeletingTraining] = useState<ITraining | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      const competencyCode = training.competencyType?.code || "UNKNOWN";

      if (!grouped[competencyCode]) {
        grouped[competencyCode] = {
          competencyCode: competencyCode,
          competencyName: training.competencyType?.name || "Unknown Competency",
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
      // Combine keyword (deskripsi_perilaku) with optional referensi
      let combinedReferensi = item.deskripsi_perilaku || "";
      if (item.referensi) {
        combinedReferensi = combinedReferensi
          ? `${combinedReferensi}\n\nReferensi Tambahan:\n${item.referensi}`
          : item.referensi;
      }

      const res = await fetch(`${apiUrl}/trainings/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: item.kode,
          topik_training: item.topik_training,
          kompetensi: item.competencyType?.name || "",
          referensi: combinedReferensi,
          lvl: item.lvl,
          tools_training: item.tools_training,
          old_file_url: isRegenerate ? item.generated_file_url : "",
          old_pdf_url: isRegenerate ? item.generated_pdf_url : "",
        }),
      });

      const result = await res.json();
      if (res.ok) {
        const message = isRegenerate
          ? "Materi Berhasil Di-regenerate!"
          : "Materi Berhasil Digenerate!";
        toast.success(message + " PPTX dan PDF telah tersedia untuk diunduh.");

        // Reload data from server to get persisted URLs
        const refreshRes = await fetch(`${apiUrl}/trainings`);
        const refreshJson = await refreshRes.json();
        setData(refreshJson.data);
        groupTrainings(refreshJson.data);
      } else {
        toast.error(result.error || "Gagal generate materi.");
      }
    } catch (error) {
      console.error("Error saat generate:", error);
      toast.error("Terjadi kesalahan saat generate materi.");
    } finally {
      setGenerating(null);
    }
  };

  const handleSaveReferensi = () => {
    if (selectedTraining) {
      const updatedData = data.map((item) =>
        item.kode === selectedTraining.kode ? { ...item, referensi: tempReferensi } : item
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

  const openEditDialog = (item: ITraining) => {
    setEditingTraining(item);
    setEditForm({
      lvl: item.lvl,
      kode: item.kode,
      topik_training: item.topik_training,
      deskripsi_perilaku: item.deskripsi_perilaku || "",
      tools_training: item.tools_training,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTraining) return;

    setEditLoading(true);
    try {
      const res = await fetch(`${apiUrl}/trainings/${editingTraining.no}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Data training berhasil diupdate!");

        // Update local state
        const updatedData = data.map((row) =>
          row.no === editingTraining.no ? { ...row, ...editForm } : row
        );
        setData(updatedData);
        groupTrainings(updatedData);
        setEditingTraining(null);
      } else {
        toast.error(result.error || "Gagal update training.");
      }
    } catch (error) {
      console.error("Error saat update:", error);
      toast.error("Terjadi kesalahan saat update training.");
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteDialog = (item: ITraining) => {
    setDeletingTraining(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTraining) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`${apiUrl}/trainings/${deletingTraining.no}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Training berhasil dihapus!");

        // Update local state
        const updatedData = data.filter((row) => row.no !== deletingTraining.no);
        setData(updatedData);
        groupTrainings(updatedData);
        setDeleteDialogOpen(false);
        setDeletingTraining(null);
      } else {
        toast.error(result.error || "Gagal delete training.");
      }
    } catch (error) {
      console.error("Error saat delete:", error);
      toast.error("Terjadi kesalahan saat delete training.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
                      <h3 className="font-semibold text-lg">{group.competencyName}</h3>
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
                        <th className="py-3 px-4 text-left font-semibold">Level</th>
                        <th className="py-3 px-4 text-left font-semibold">Kode</th>
                        <th className="py-3 px-4 text-left font-semibold">Topik Training</th>
                        <th className="py-3 px-4 text-left font-semibold">Tools/Framework</th>
                        <th className="py-3 px-4 text-center font-semibold">Referensi</th>
                        <th className="py-3 px-4 text-center font-semibold">Action</th>
                        <th className="py-3 px-4 text-center font-semibold">Files</th>
                        <th className="py-3 px-4 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.trainings.map((item) => (
                        <tr key={item.kode} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full font-semibold text-sm">
                              {item.lvl}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">{item.kode}</td>
                          <td className="py-3 px-4">{item.topik_training}</td>
                          <td className="py-3 px-4 text-gray-600">{item.tools_training}</td>
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
                            {item.generated_file_url || item.generated_pdf_url ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRegenerateDialog(item)}
                                disabled={generating === item.kode}
                                className="gap-2"
                              >
                                <RefreshCw className="w-4 h-4" />
                                {generating === item.kode ? "Regenerating..." : "Regenerate"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleGenerate(item, false)}
                                disabled={generating === item.kode}
                              >
                                {generating === item.kode ? "Generating..." : "Generate"}
                              </Button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              {item.generated_file_url ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="default"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <a
                                    href={item.generated_file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                  >
                                    <FileText className="w-4 h-4" />
                                    PPT
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-sm">No PPT</span>
                              )}
                              {item.generated_pdf_url ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <a
                                    href={item.generated_pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                  >
                                    <FileText className="w-4 h-4" />
                                    PDF
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-sm">No PDF</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(item)}
                                  className="cursor-pointer"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(item)}
                                  className="cursor-pointer text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Dialog untuk Edit Training Data */}
      <Dialog
        open={editingTraining !== null}
        onOpenChange={(open) => !open && setEditingTraining(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training</DialogTitle>
            <DialogDescription>
              Kode: <span className="font-semibold">{editingTraining?.kode}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Level</label>
              <Input
                type="number"
                value={editForm.lvl}
                onChange={(e) => setEditForm({ ...editForm, lvl: parseInt(e.target.value) || 0 })}
                placeholder="Masukkan level"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Kode</label>
              <Input
                type="text"
                value={editForm.kode}
                onChange={(e) => setEditForm({ ...editForm, kode: e.target.value })}
                placeholder="Masukkan kode"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Topik Training</label>
              <Input
                type="text"
                value={editForm.topik_training}
                onChange={(e) => setEditForm({ ...editForm, topik_training: e.target.value })}
                placeholder="Masukkan topik training"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Deskripsi Perilaku</label>
              <Textarea
                value={editForm.deskripsi_perilaku}
                onChange={(e) => setEditForm({ ...editForm, deskripsi_perilaku: e.target.value })}
                placeholder="Masukkan deskripsi perilaku"
                className="h-24 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Tools/Framework</label>
              <Input
                type="text"
                value={editForm.tools_training}
                onChange={(e) => setEditForm({ ...editForm, tools_training: e.target.value })}
                placeholder="Masukkan tools/framework"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingTraining(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog untuk Referensi */}
      <Dialog
        open={selectedTraining !== null}
        onOpenChange={(open) => !open && setSelectedTraining(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Referensi</DialogTitle>
            <DialogDescription>
              Topik: <span className="font-semibold">{selectedTraining?.topik_training}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Bagian 1: Keyword (Fixed - dari deskripsi_perilaku) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Keyword</h3>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedTraining?.deskripsi_perilaku || "Tidak ada keyword"}
                </p>
              </div>
            </div>

            <div className="border-t"></div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Referensi Tambahan</h3>
                <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                  Opsional
                </span>
              </div>

              <Textarea
                placeholder="Tulis referensi tambahan di sini..."
                value={tempReferensi}
                onChange={(e) => setTempReferensi(e.target.value)}
                className="mt-2 h-32 resize-none"
              />
              <p className="text-xs text-gray-500">{tempReferensi.length} karakter</p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setSelectedTraining(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveReferensi}>Simpan Referensi</Button>
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
              <span className="font-semibold">{regenerateDialog?.topik_training}</span> sudah pernah
              digenerate sebelumnya. Apakah Anda ingin me-regenerate dengan referensi yang baru?
              File lama (PPTX & PDF) akan dihapus dan diganti dengan yang baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => regenerateDialog && handleGenerate(regenerateDialog, true)}
            >
              Ya, Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Konfirmasi Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Training?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus training{" "}
              <span className="font-semibold">{deletingTraining?.topik_training}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
