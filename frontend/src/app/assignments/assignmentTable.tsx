"use client";
import { useState } from "react";
import { useAssignments } from "./_hooks/useAssignments";
import { useCatalogs } from "./_hooks/useCatalogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { PlusIcon, EditIcon, TrashIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { IAssignment } from "@/types/global-types";

export default function AssignmentTable() {
  const {
    loading,
    assignments,
    allAssignments,
    fetchAll,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    searchQuery,
    setSearchQuery,
  } = useAssignments();

  const { assessments, users } = useCatalogs();

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<IAssignment | null>(null);

  const [form, setForm] = useState({
    user_ids: [] as string[],
    assessment_id: "",
    start_date: "",
    end_date: "",
    note: "",
    status: "ASSIGNED",
  });

  // 🟢 buka modal edit
  const handleEdit = (a: IAssignment) => {
    setEditing(a);
    setForm({
      user_ids: [(a.user_id || a.UserID || "").toString()],
      assessment_id: (a.assessment_id || a.AssessmentID || "").toString(),
      start_date: (a.start_date || a.StartDate || "").split("T")[0] || "",
      end_date: (a.end_date || a.EndDate || "").split("T")[0] || "",
      note: a.note || a.Note || "",
      status: a.status || a.Status || "ASSIGNED",
    });
    setOpenDialog(true);
  };

  // 🟢 simpan (create/update)
  const handleSubmit = async () => {
    if (!form.assessment_id || !form.start_date || !form.end_date) {
      toast.error("Lengkapi assessment, start date, dan end date!");
      return;
    }

    const payload = {
      assessment_id: Number(form.assessment_id),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      note: form.note || undefined,
      status: form.status || "ASSIGNED",
    };

    try {
      if (editing) {
        const id = editing.id || editing.ID || 0;
        await updateAssignment(id, {
          ...payload,
          user_id: Number(form.user_ids[0]),
        });
        toast.success("Assignment berhasil diperbarui!");
      } else {
        if (form.user_ids.length === 0) {
          toast.error("Pilih minimal satu user!");
          return;
        }

        // bisa langsung call bulk API atau looping
        for (const uid of form.user_ids) {
          await createAssignment({
            ...payload,
            user_id: Number(uid),
          });
        }

        toast.success("Assignments berhasil dibuat!");
      }

      await fetchAll();
      setEditing(null);
      setOpenDialog(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan assignment");
    }
  };

  // 🟢 hapus
  const handleDelete = async (id: number) => {
    if (window.confirm("Yakin ingin menghapus assignment ini?")) {
      await deleteAssignment(id);
      toast.success("Assignment berhasil dihapus!");
      await fetchAll();
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assignments</h2>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              user_ids: [],
              assessment_id: "",
              start_date: "",
              end_date: "",
              note: "",
              status: "ASSIGNED",
            });
            setOpenDialog(true);
          }}
        >
          <PlusIcon className="w-4 h-4 mr-2" /> New Assignment
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative w-[350px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari nama, seaman code, assessment, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <span className="text-sm text-gray-500">
            Ditemukan {assignments.length} dari {allAssignments.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div
        className={`overflow-auto border rounded-lg ${
          loading ? "opacity-70" : "opacity-100"
        }`}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Seaman Code</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400">
                  Tidak ada data assignment.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((a) => (
                <TableRow key={a.id || a.ID}>
                  <TableCell>{a.id || a.ID}</TableCell>
                  <TableCell>{a.User?.Nama || "-"}</TableCell>
                  <TableCell>{a.User?.SeamanCode || "-"}</TableCell>
                  <TableCell>
                    {a.assessment?.name ||
                      a.assessment?.assessmentName ||
                      a.Assessment?.assessmentName ||
                      "-"}
                  </TableCell>
                  <TableCell>
                    {a.start_date?.split("T")[0] || a.StartDate?.split("T")[0] || "-"}
                  </TableCell>
                  <TableCell>
                    {a.end_date?.split("T")[0] || a.EndDate?.split("T")[0] || "-"}
                  </TableCell>
                  <TableCell>{a.status || a.Status}</TableCell>
                  <TableCell>{a.note || a.Note || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(a)}>
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(a.id || a.ID || 0)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {/* Assessment by name */}
            <div>
              <label className="text-sm font-medium mb-1 block">Assessment *</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={form.assessment_id}
                onChange={(e) => setForm({ ...form, assessment_id: e.target.value })}
              >
                <option value="">Pilih Assessment</option>
                {assessments.map((a) => (
                  <option key={a.assessmentId || a.id} value={a.assessmentId || a.id}>
                    {a.assessmentName || a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-user (only create mode) */}
            {!editing && (
              <div>
                <label className="text-sm font-medium mb-1 block">Users *</label>
                <select
                  multiple
                  className="w-full px-3 py-2 border rounded-md h-40"
                  value={form.user_ids}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      user_ids: Array.from(e.target.selectedOptions, (opt) => opt.value),
                    })
                  }
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.nama} ({u.seamanCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Gunakan Ctrl / Cmd untuk memilih beberapa user.
                </p>
              </div>
            )}

            {/* Start & End Date */}
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date *</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date *</label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium mb-1 block">Note</label>
              <Input
                placeholder="Tambahkan catatan..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : editing ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
