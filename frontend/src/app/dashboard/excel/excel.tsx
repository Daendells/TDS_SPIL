"use client";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import {
  Dialog,
  DialogClose,
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

export default function Excel() {
  const [files, setFile] = useState<File[] | undefined>();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [onUpload, setOnUpload] = useState<boolean>(false);

  const handleDrop = (files: File[]) => {
    console.log(files[0]);
    setFile(files);
  };
  return (
    <div className="flex flex-col gap-4">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        Upload Excel
      </h1>

      {/* DropZone */}
      <Dropzone
        accept={{
          "application/vnd.ms-excel": [], // .xls
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            [], // .xlsx
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
          <Button
            className="transition duration-100 active:scale-95"
            disabled={onUpload}
          >
            Upload
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please Make sure your have followed
              the rules below!
            </DialogDescription>
          </DialogHeader>
          {/* Rules */}
          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit, qui!
              Neque deleniti voluptates culpa exercitationem quis voluptas nobis
              eum libero dolorem similique in optio corporis, consequatur
              voluptatem, magni officiis? Aspernatur!
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              className="w-full"
              onClick={() => setOpenModal(false)}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
