"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Eye, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useBatches, useSnapshots, type Batch } from "./_hooks/useBatch";

// ─── Date Input helper ────────────────────────────────────────────────────────

function DateInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  min?: Date;
  max?: Date;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="date"
        value={value ? format(value, "yyyy-MM-dd") : ""}
        min={min ? format(min, "yyyy-MM-dd") : undefined}
        max={max ? format(max, "yyyy-MM-dd") : undefined}
        onChange={(e) => {
          if (!e.target.value) {
            onChange(undefined);
            return;
          }
          onChange(new Date(e.target.value + "T00:00:00"));
        }}
      />
    </div>
  );
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

function CreateDialog({
  open,
  onClose,
  batches,
}: {
  open: boolean;
  onClose: () => void;
  batches: Batch[];
}) {
  const { createBatch, isCreating } = useBatches();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Prevent overlap: start must be after the latest batch's endDate
  const latestEnd = batches.length
    ? new Date(batches[0].endDate) // sorted desc, so [0] is latest
    : undefined;

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;
    const ok = await createBatch(startDate, endDate);
    if (ok) {
      setStartDate(undefined);
      setEndDate(undefined);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Batch Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <DateInput
            label="Tanggal Mulai"
            value={startDate}
            onChange={setStartDate}
            min={latestEnd ? new Date(latestEnd.getTime() + 86400000) : undefined}
            max={endDate ? new Date(endDate.getTime() - 86400000) : undefined}
          />
          <DateInput
            label="Tanggal Selesai"
            value={endDate}
            onChange={setEndDate}
            min={startDate ? new Date(startDate.getTime() + 86400000) : undefined}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!startDate || !endDate || isCreating}>
            {isCreating ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditDialog({
  batch,
  prevBatch,
  nextBatch,
  onClose,
}: {
  batch: Batch | null;
  prevBatch?: Batch;
  nextBatch?: Batch;
  onClose: () => void;
}) {
  const { updateBatch, isUpdating } = useBatches();
  const [startDate, setStartDate] = useState<Date | undefined>(
    batch ? parseISO(batch.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    batch ? parseISO(batch.endDate) : undefined
  );

  if (!batch) return null;

  // Smart constraints
  const minStart = prevBatch
    ? new Date(new Date(prevBatch.endDate).getTime() + 86400000)
    : undefined;
  const maxEnd = nextBatch
    ? new Date(new Date(nextBatch.startDate).getTime() - 86400000)
    : undefined;

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;
    const ok = await updateBatch(batch.id, startDate, endDate);
    if (ok) onClose();
  };

  return (
    <Dialog open={!!batch} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Batch {batch.batchNo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {prevBatch && (
            <p className="text-xs text-muted-foreground">
              ⚠️ Batch {prevBatch.batchNo} berakhir pada{" "}
              <strong>{format(parseISO(prevBatch.endDate), "dd MMM yyyy")}</strong>. Tanggal mulai
              harus setelah tanggal tersebut.
            </p>
          )}
          {nextBatch && (
            <p className="text-xs text-muted-foreground">
              ⚠️ Batch {nextBatch.batchNo} dimulai pada{" "}
              <strong>{format(parseISO(nextBatch.startDate), "dd MMM yyyy")}</strong>. Tanggal
              selesai harus sebelum tanggal tersebut.
            </p>
          )}

          <DateInput
            label="Tanggal Mulai"
            value={startDate}
            onChange={setStartDate}
            min={minStart}
            max={endDate ? new Date(endDate.getTime() - 86400000) : maxEnd}
          />
          <DateInput
            label="Tanggal Selesai"
            value={endDate}
            onChange={setEndDate}
            min={startDate ? new Date(startDate.getTime() + 86400000) : undefined}
            max={maxEnd}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!startDate || !endDate || isUpdating}>
            {isUpdating ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Snapshot Dialog ──────────────────────────────────────────────────────────

function SnapshotDialog({
  batchId,
  batchNo,
  onClose,
}: {
  batchId: number | null;
  batchNo: number;
  onClose: () => void;
}) {
  const { snapshots, loading } = useSnapshots(batchId);

  return (
    <Dialog open={!!batchId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Snapshot Batch {batchNo}</span>
            {!loading && snapshots.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground bg-slate-100 px-2.5 py-0.5 rounded-full">
                {snapshots.length} seafarer
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[420px] rounded-md border">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Tidak ada data snapshot.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-10 text-center text-xs">No</TableHead>
                  <TableHead className="text-xs">Seafarer</TableHead>
                  <TableHead className="text-xs">Jabatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((s, i) => (
                  <TableRow key={s.id} className="align-middle">
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm leading-tight">{s.nama}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.seafarerCode || s.seamanCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.jabatan || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BatchControlPage() {
  const { batches, loading } = useBatches();

  const [createOpen, setCreateOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [snapshotBatch, setSnapshotBatch] = useState<Batch | null>(null);

  // Sorted ascending by batchNo for adjacent-batch lookup
  const sorted = [...batches].sort((a, b) => a.batchNo - b.batchNo);

  const findAdjacent = (batch: Batch) => {
    const idx = sorted.findIndex((b) => b.id === batch.id);
    return {
      prev: idx > 0 ? sorted[idx - 1] : undefined,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : undefined,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batch Control</h1>
          <p className="text-muted-foreground text-sm">
            Kelola periode batch Talent Development System
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat Batch
        </Button>
      </div>

      {/* Batch Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Batch No</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Tanggal Selesai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Jumlah Report</TableHead>
              <TableHead className="text-right">Dipindai</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Belum ada batch. Klik &quot;Buat Batch&quot; untuk memulai.
                </TableCell>
              </TableRow>
            ) : (
              // Display descending (newest first)
              [...batches]
                .sort((a, b) => b.batchNo - a.batchNo)
                .map((batch) => {
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-bold">#{batch.batchNo}</TableCell>
                      <TableCell>{format(parseISO(batch.startDate), "dd MMM yyyy")}</TableCell>
                      <TableCell>{format(parseISO(batch.endDate), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={batch.status === "active" ? "default" : "secondary"}>
                          {batch.status === "active" ? "Aktif" : "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{batch.reportCount}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {batch.snapshotAt
                          ? format(parseISO(batch.snapshotAt), "dd MMM yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {batch.status === "active" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Edit batch"
                              onClick={() => setEditBatch(batch)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {batch.status === "completed" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Lihat snapshot"
                              onClick={() => setSnapshotBatch(batch)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateDialog open={createOpen} onClose={() => setCreateOpen(false)} batches={batches} />

      {editBatch &&
        (() => {
          const { prev, next } = findAdjacent(editBatch);
          return (
            <EditDialog
              batch={editBatch}
              prevBatch={prev}
              nextBatch={next}
              onClose={() => setEditBatch(null)}
            />
          );
        })()}

      {snapshotBatch && (
        <SnapshotDialog
          batchId={snapshotBatch.id}
          batchNo={snapshotBatch.batchNo}
          onClose={() => setSnapshotBatch(null)}
        />
      )}
    </div>
  );
}
