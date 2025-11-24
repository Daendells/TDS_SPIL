"use client";
import { useState, useMemo } from "react";
import { useAssignments } from "./_hooks/useAssigments";
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
import { IAssignmentFlat } from "@/types/global-types";

export default function AssignmentTable() {
  const {
    loading,
    assignments,
    fetchAll,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    searchQuery,
    setSearchQuery,
    pageSize,
    setPageSize,
    filterAssessment,
    setFilterAssessment,
    filterStatus,
    setFilterStatus,
  } = useAssignments();

  const { assessments, users } = useCatalogs();

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<IAssignmentFlat | null>(null);
  const [form, setForm] = useState({
    seafarer_codes: [] as string[],
    assessment_type_id: "",
    status: "ASSIGNED",
    userSearch: "",
  });

  // Filter user di dialog berdasarkan search
  const filteredUsers = useMemo(() => {
    const q = form.userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.nama?.toLowerCase().includes(q) ||
        u.seafarerCode?.toLowerCase().includes(q)
    );
  }, [form.userSearch, users]);

  const handleEdit = (a: IAssignmentFlat) => {
    setEditing(a);
    setForm({
      seafarer_codes: [a.seafarerCode],
      assessment_type_id: a.assessmentTypeId.toString(),
      status: a.status || "ASSIGNED",
      userSearch: "",
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.assessment_type_id || form.seafarer_codes.length === 0) {
      toast.error("Pilih minimal satu seafarer dan assessment!");
      return;
    }

    try {
      if (editing) {
await updateAssignment(editing.id || 0, {
  id: editing.id || 0, //  add this line
  assessmentTypeId: Number(form.assessment_type_id),
  status: form.status,
});
        toast.success("Assignment berhasil diperbarui!");
      } else {
        // bulk add
        for (const code of form.seafarer_codes) {
          await createAssignment({
            seafarerCode: code,
            assessmentTypeId: Number(form.assessment_type_id),
            status: form.status,
            createdBy: "SYSTEM",
          });
        }
        toast.success(`${form.seafarer_codes.length} assignment berhasil dibuat!`);
      }

      await fetchAll();
      setEditing(null);
      setOpenDialog(false);
      setForm({
        seafarer_codes: [],
        assessment_type_id: "",
        status: "ASSIGNED",
        userSearch: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan assignment");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Yakin ingin menghapus assignment ini?")) {
      await deleteAssignment(id);
    }
  };
  

  return (
    <div className="mt-8 p-4 m-6 space-y-6 ">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assignments</h2>
      </div>

      {/* Search bar */}
{/* Search + Filters */}
<div className="flex justify-between items-center mb-6">
  {/* Search */}
  <div className="flex gap-4 items-center">
    <div className="relative w-[350px]">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder="Cari nama, seafarer code, assessment..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>

  {/* FILTERS */}
  <div className="flex items-center gap-3">

    {/* Filter Assessment */}
    <select
      className="border px-3 py-2 rounded-md"
      value={filterAssessment}
      onChange={(e) => setFilterAssessment(e.target.value)}
    >
      <option value="ALL">All Assessments</option>
      {assessments.map((a) => (
        <option key={a.assessmentId} value={a.assessmentId}>
          {a.assessmentName}
        </option>
      ))}
    </select>

    {/* Filter Status */}
    <select
      className="border px-3 py-2 rounded-md"
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
    >
      <option value="ALL">All Status</option>
      <option value="ASSIGNED">Assigned</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="COMPLETED">Completed</option>
    </select>

    {/* Page Size Popover */}
    <select
      className="border px-3 py-2 rounded-md"
      value={pageSize}
      onChange={(e) => setPageSize(Number(e.target.value))}
    >
      <option value="10">10 rows</option>
      <option value="20">20 rows</option>
      <option value="50">50 rows</option>
      <option value="100">100 rows</option>
      <option value="-1">Show All</option>
    </select>

    {/* New Assignment */}
    <Button
      onClick={() => {
        setEditing(null);
        setForm({
          seafarer_codes: [],
          assessment_type_id: "",
          status: "ASSIGNED",
          userSearch: "",
        });
        setOpenDialog(true);
      }}
    >
      <PlusIcon className="w-4 h-4 mr-2" /> New Assignment
    </Button>

  </div>
</div>



      {/* Table */}
      <div className="overflow-auto border rounded-lg ">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow>
          <TableHead className="text-center">No</TableHead>
          <TableHead className="text-center">Nama</TableHead>
          <TableHead className="text-center">Seafarer Code</TableHead>
          <TableHead className="text-center">Assessment</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-center">Attempts</TableHead>
          <TableHead className="text-center">Action</TableHead>
        </TableRow>
          </TableHeader>
          <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">
          Loading...
            </TableCell>
          </TableRow>
        ) : assignments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-gray-400">
          Tidak ada data assignment.
            </TableCell>
          </TableRow>
        ) : (
          assignments.map((a, no) => (
            <TableRow key={a.id}>
          <TableCell className="text-center">{no + 1}</TableCell>
          <TableCell className="text-center">{a.nama}</TableCell>
          <TableCell className="text-center">{a.seafarerCode}</TableCell>
          <TableCell className="text-center">{a.assessmentType}</TableCell>
          <TableCell className="text-center">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                a.status === "ASSIGNED"
                  ? "bg-blue-200 text-blue-800"
                  : a.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {a.status}
            </span>
          </TableCell>
          <TableCell className="text-center">{a.attempts}</TableCell>
          <TableCell className="text-center">
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(a)}>
            <EditIcon className="w-4 h-4" />
              </Button>
              <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(a.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Assignment" : "Tambah Assignment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assessment */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Assessment Type *
              </label>
              <select
                className="w-full border px-2 py-2 rounded-md"
                value={form.assessment_type_id}
                onChange={(e) =>
                  setForm({ ...form, assessment_type_id: e.target.value })
                }
              >
                <option value="">Pilih Assessment</option>
                {assessments.map((a) => (
                  <option key={a.assessmentId} value={a.assessmentId}>
                    {a.assessmentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Seafarers (multi-select) */}
            {!editing && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Pilih Seafarers *
                </label>
                <Input
                  placeholder="Cari seafarer..."
                  value={form.userSearch}
                  onChange={(e) =>
                    setForm({ ...form, userSearch: e.target.value })
                  }
                  className="mb-2"
                />
                <div className="max-h-48 overflow-auto border rounded-md">
                  {filteredUsers.map((u) => (
                    <label
                      key={u.seafarerCode}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.seafarer_codes.includes(u.seafarerCode!)}
                        onChange={() => {
                          const selected = form.seafarer_codes.includes(
                            u.seafarerCode!
                          );
                          setForm({
                            ...form,
                            seafarer_codes: selected
                              ? form.seafarer_codes.filter(
                                  (c) => c !== u.seafarerCode
                                )
                              : [...form.seafarer_codes, u.seafarerCode!],
                          });
                        }}
                      />
                      <span>
                        {u.nama}{" "}
                        <span className="text-gray-500 text-xs">
                          ({u.seafarerCode})
                        </span>
                      </span>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-gray-400 py-3">
                      Tidak ada seafarer ditemukan
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select
                className="w-full border px-2 py-2 rounded-md"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
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
