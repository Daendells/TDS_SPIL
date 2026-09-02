"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload,
  Link2,
  FileText,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface DataSourceToolbarProps {
  onLoadCSV: (csvText: string, sourceName: string) => void;
  onResetDemo: () => void;
  isLoading: boolean;
}

export function DataSourceToolbar({ onLoadCSV, onResetDemo, isLoading }: DataSourceToolbarProps) {
  const [activeTab, setActiveTab] = useState<string>("demo");
  const [urlInput, setUrlInput] = useState<string>(
    "https://docs.google.com/spreadsheets/d/1Jf9IhudkzSg0HNuB7t4dBgWpGuiQvNbe2Xtu_nbJCqc/export?format=csv&gid=1701811227"
  );
  const [rawTextInput, setRawTextInput] = useState<string>("");
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // File Upload Handler (reads file as text or parses)
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        onLoadCSV(content, file.name);
        toast.success(`Berhasil memuat file: ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error("Gagal membaca file.");
    };

    reader.readAsText(file);
  };

  // URL Fetch Handler
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      toast.error("Silakan masukkan URL spreadsheet.");
      return;
    }

    setIsFetchingUrl(true);
    try {
      // Direct client-side fetch or fallback
      const res = await axios.get(urlInput, {
        headers: { Accept: "text/csv, text/plain, */*" },
        timeout: 10000,
      });

      if (typeof res.data === "string" && res.data.length > 0) {
        // Verify if it is HTML login page from Google
        if (res.data.includes("<html") || res.data.includes("<!DOCTYPE") || res.data.includes("Sign in")) {
          throw new Error(
            "Spreadsheet memerlukan autentikasi Google. Silakan download file CSV dari Google Sheet secara manual lalu gunakan tab 'Upload File Excel/CSV'."
          );
        }

        onLoadCSV(res.data, `Live GSheet (${new URL(urlInput).searchParams.get("gid") || "Sheet"})`);
        toast.success("Berhasil mengimpor data langsung dari URL!");
      } else {
        throw new Error("Format respons tidak valid.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil data dari URL Google Sheets.", {
        duration: 5000,
      });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Raw Text Handler
  const handleProcessRawText = () => {
    if (!rawTextInput.trim()) {
      toast.error("Silakan tempel data CSV terlebih dahulu.");
      return;
    }
    onLoadCSV(rawTextInput, "Raw CSV Text Input");
    toast.success("Berhasil memproses teks CSV!");
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Sumber Data Spreadsheet (Multi-Source Ingestion)
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetDemo}
          className="text-xs h-7 gap-1 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 self-start sm:self-auto"
        >
          <RotateCcw className="w-3 h-3" />
          Reset ke Dataset Standar SPIL
        </Button>
      </div>

      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 h-auto">
            <TabsTrigger value="demo" className="text-xs py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 shadow-none font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              1. Benchmark Demo
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 shadow-none font-medium">
              <Upload className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
              2. Upload File (.xlsx/.csv)
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 shadow-none font-medium">
              <Link2 className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
              3. Live Google Sheets URL
            </TabsTrigger>
            <TabsTrigger value="paste" className="text-xs py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 shadow-none font-medium">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
              4. Paste Raw CSV
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Demo */}
          <TabsContent value="demo" className="m-0 space-y-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Dataset Benchmark Maritim SPIL Aktif</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan 20 data perwira dan rating kapal kontainer PT SPIL dengan metrik lengkap (Deck, Engine, Catering, Trainee).
                </p>
              </div>
              <Button size="sm" onClick={onResetDemo} className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8">
                Tampilkan Demo
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: Upload File */}
          <TabsContent value="upload" className="m-0">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging ? "border-slate-900 bg-slate-100/70" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
              }`}
              onClick={() => {
                document.getElementById("file-upload-input")?.click();
              }}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">
                Klik untuk memilih file atau drag & drop file spreadsheet di sini
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Mendukung format <strong>.CSV</strong> atau hasil ekspor Google Sheets
              </p>
            </div>
          </TabsContent>

          {/* Tab 3: Live URL */}
          <TabsContent value="url" className="m-0 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-xs border-slate-200 h-9"
              />
              <Button
                size="sm"
                onClick={handleFetchUrl}
                disabled={isFetchingUrl}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 px-4 shrink-0"
              >
                {isFetchingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Link2 className="w-3.5 h-3.5 mr-1.5" />}
                Ambil Data URL
              </Button>
            </div>

            {/* Quick GID Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Preset GID Spreadsheet Mentor:</span>
              <button
                type="button"
                onClick={() =>
                  setUrlInput(
                    "https://docs.google.com/spreadsheets/d/1Jf9IhudkzSg0HNuB7t4dBgWpGuiQvNbe2Xtu_nbJCqc/export?format=csv&gid=1701811227"
                  )
                }
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono border border-slate-200"
              >
                Sheet GID: 1701811227
              </button>
              <button
                type="button"
                onClick={() =>
                  setUrlInput(
                    "https://docs.google.com/spreadsheets/d/1Jf9IhudkzSg0HNuB7t4dBgWpGuiQvNbe2Xtu_nbJCqc/export?format=csv&gid=645603469"
                  )
                }
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono border border-slate-200"
              >
                Sheet GID: 645603469
              </button>
            </div>
          </TabsContent>

          {/* Tab 4: Paste Raw Text */}
          <TabsContent value="paste" className="m-0 space-y-2">
            <Textarea
              placeholder="Tempel baris data CSV di sini... Contoh:
ID,Nama,Rank,Departemen,Kapal,Nilai,Status
SPIL-101,Bambang Hidayat,NAKHODA,DECK,KM SPIL CITRA,90,Sangat Baik"
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              className="text-xs font-mono h-24 border-slate-200"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleProcessRawText}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
              >
                Proses Data CSV
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
