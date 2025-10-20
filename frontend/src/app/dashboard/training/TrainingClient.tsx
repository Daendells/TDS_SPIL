"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ITraining {
  no: number;
  kode_ai: string;
  kompetensi: string;
  lvl: number;
  tools_training: string;
  kode: string;
  topik_training: string;
  referensi?: string;
  attachment?: string;
}

export default function TrainingPage() {
  const [data, setData] = useState<ITraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<ITraining | null>(null);
  const [tempReferensi, setTempReferensi] = useState("");

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
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, [apiUrl]);

  const handleGenerate = async (item: ITraining) => {
    setGenerating(item.kode);
    try {
      const res = await fetch(`${apiUrl}/trainings/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: item.kode,
          topik_training: item.topik_training,
          kompetensi: item.kompetensi,
          referensi: item.referensi || "",
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Materi Berhasil Digenerate. Silakan unduh melalui attachment.");
        setData((prev) =>
          prev.map((row) =>
            row.kode === item.kode ? { ...row, attachment: result.link } : row
          )
        );
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
      setData((prev) =>
        prev.map((item) =>
          item.kode === selectedTraining.kode
            ? { ...item, referensi: tempReferensi }
            : item
        )
      );
      setSelectedTraining(null);
      setTempReferensi("");
    }
  };

  return (
    <div className="grid grid-cols-1 overflow-auto rounded-md border mt-6">
      {loading ? (
        <p className="p-4 text-gray-500 text-center">Memuat data training...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Kode</TableHead>
              <TableHead className="text-center">Topik</TableHead>
              <TableHead className="text-center">Tools</TableHead>
              <TableHead className="text-center">Referensi</TableHead>
              <TableHead className="text-center">Generate</TableHead>
              <TableHead className="text-center">Attachment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((item) => (
                <TableRow
                  key={item.kode}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <TableCell className="text-center font-medium">
                    {item.kode}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.topik_training}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.tools_training}
                  </TableCell>

                  {/* 🔹 Ganti input jadi tombol + popup */}
                  <TableCell className="text-center">
                    <Dialog
                      open={selectedTraining?.kode === item.kode}
                      onOpenChange={(open) =>
                        open
                          ? (setSelectedTraining(item),
                            setTempReferensi(item.referensi || ""))
                          : setSelectedTraining(null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                          {item.referensi
                            ? "Edit Referensi"
                            : "Tambah Referensi"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tambah Referensi</DialogTitle>
                          <DialogDescription>
                            Silakan tulis tambahan informasi atau referensi yang
                            relevan dengan topik:
                            <span className="font-semibold ml-1">
                              {item.topik_training}
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
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      onClick={() => handleGenerate(item)}
                      disabled={generating === item.kode}
                    >
                      {generating === item.kode ? "Generating..." : "Generate"}
                    </Button>
                  </TableCell>

                  <TableCell className="text-center">
                    {item.attachment ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="text-blue-600"
                      >
                        <a
                          href={item.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Unduh
                        </a>
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center font-bold text-gray-400"
                >
                  Tidak ada data training
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}