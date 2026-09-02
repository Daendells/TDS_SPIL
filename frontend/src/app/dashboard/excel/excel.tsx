"use client";

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { api } from "@/app/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Excel() {
  const { isAdmin } = useAuth();
  const [files, setFile] = useState<File[] | undefined>();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [onUpload, setOnUpload] = useState<boolean>(true);

  const handleDrop = (files: File[]) => {
    console.log(files[0]);
    setOnUpload(false);
    setFile(files);
  };

  const upload = async () => {
    if (onUpload || !files?.length) return; // Kalau lagi proses upload
    setOpenModal(false);
    setOnUpload(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]); // only upload first file

      const res = await api.post(`/reports/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;

      setFile(undefined);
      toast.success("File uploaded successfully!");
      console.log("Upload response:", data);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Upload failed");
      console.error(err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border">
        <h2 className="text-xl font-semibold mb-2">Akses Terbatas</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Hanya pengguna dengan peran <strong>Admin</strong> yang memiliki hak akses untuk mengupload data Excel ke sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        Upload Excel
      </h1>

      {/* DropZone */}
      <Dropzone
        accept={{
          "application/vnd.ms-excel": [".xls"],
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          "application/octet-stream": [".xls", ".xlsx"], // penting untuk kasus MIME salah
        }}
        maxSize={1024 * 1024 * 10}
        minSize={1024}
        onDrop={handleDrop}
        onError={(e) => {
          toast.error(e.toString());
        }}
        src={files}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>

      {/* Upload */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogTrigger asChild>
          <Button className="transition duration-100 active:scale-95" disabled={onUpload}>
            Upload
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please make sure you have followed the rules below!
            </DialogDescription>
          </DialogHeader>

          {/* Rules */}
          <div className="flex items-center gap-2 mt-2">
            <div className="grid flex-1 gap-6">
              {/* Table */}
              <div className="grid gap-2">
                <h2 className="font-medium">1. Urutan Header dari Excel</h2>
                <div className="flex items-center space-x-4 text-sm overflow-auto">
                  <div>No</div>
                  <Separator orientation="vertical" />
                  <div>Vessel Name</div>
                  <Separator orientation="vertical" />
                  <div>Name</div>
                  <Separator orientation="vertical" />
                  <div>Position</div>
                  <Separator orientation="vertical" />
                  <div>Department</div>
                  <Separator orientation="vertical" />
                  <div>Seaman Code</div>
                  <Separator orientation="vertical" />
                  <div>Seafarer Code</div>
                  <Separator orientation="vertical" />
                  <div>Certificate</div>
                  <Separator orientation="vertical" />
                  <div>Age</div>
                  <Separator orientation="vertical" />
                  <div>Kondite Review</div>
                  <Separator orientation="vertical" />
                  <div>KPI Vessel</div>
                  <Separator orientation="vertical" />
                  <div>Performance Score</div>
                  <Separator orientation="vertical" />
                  <div>Value Assessment</div>
                  <Separator orientation="vertical" />
                  <div>Competency Gap Analysis</div>
                  <Separator orientation="vertical" />
                  <div>TOTAL GAP</div>
                  <Separator orientation="vertical" />
                  <div>Strength Analysis</div>
                  <Separator orientation="vertical" />
                  <div>IDP Program</div>
                  <Separator orientation="vertical" />
                  <div>HAV Quadran 2</div>
                  <Separator orientation="vertical" />
                  <div>Talent Classified 2</div>
                  <Separator orientation="vertical" />
                  <div>Readiness (Month)</div>
                  <Separator orientation="vertical" />
                  <div>Certificate Eligible</div>
                  <Separator orientation="vertical" />
                  <div>Durasi Pemenuhan Pendidikan (Month)</div>
                  <Separator orientation="vertical" />
                  <div>Total Readiness Update (Month)</div>
                </div>
              </div>

              {/* Nama Sheet */}
              <div className="grid gap-2">
                <h2 className="font-medium">2. Nama Sheet Excel</h2>
                <Image src="/images/sheet.png" alt="Sheet Name" width={240} height={240} />
                <p className="leading-7 not-first:mt-6">
                  <span className="font-medium">Sheet1</span> merupakan nama sheet dari file Excel
                  yang diupload. Pastikan nama sheetnya sesuai yaitu{" "}
                  <span className="font-medium">Sheet1</span>.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-start">
            <Button type="button" className="w-full" onClick={upload} disabled={onUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
