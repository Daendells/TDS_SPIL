"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type UIEvent,
} from "react";
import { api } from "@/app/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBatches, type Batch } from "@/app/master-report/_hooks/useBatch";
import { Copy, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";

type Recruiter = {
  id: number;
  nama: string;
  seafarerCode: string;
  rank: string;
  academyName: string;
  batchId?: number | null;
  batchName?: string;
  reportScores?: Array<{
    score?: number;
    assessmentType?: { assessmentTypeName?: string };
  }>;
  phone?: string | null;
  email?: string | null;
};

type Assignment = {
  id: number;
  newRecruiterId: number;
  assessmentTypeId: number;
  assessmentType: string;
  batchId?: number | null;
  batchName?: string;
  token: string;
  status: string;
  attemptsCount: number;
  reportScore?: number | null;
  newRecruiter?: Recruiter;
};

type AssessmentType = {
  id: number;
  assessmentTypeName: string;
};

type PageDirection = "next" | "prev";

type PaginatedResponse<T> = {
  data: T[];
  firstId?: number | null;
  lastId?: number | null;
  pageSize: number;
  hasMore: boolean;
  firstPage: boolean;
  total: number;
};

type PaginationRequestState = {
  anchorId: number | null;
  page: PageDirection;
  pageSize: number;
};

type RecruiterSearchResponse = {
  data: Recruiter[];
  lastId?: number | null;
  hasMore: boolean;
};

type RecruiterPickerState = {
  items: Recruiter[];
  query: string;
  cursorId: number | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
};

const rankOptions = [
  "Nahkoda",
  "Mualim I",
  "Mualim II",
  "Mualim III",
  "KKM",
  "Masinis II",
  "Masinis III",
  "Masinis IV",
] as const;

const emptyRecruiter = {
  nama: "",
  seafarerCode: "",
  rank: "",
  academyName: "",
  batchId: "",
  phone: "",
  email: "",
};

const emptyPickerState: RecruiterPickerState = {
  items: [],
  query: "",
  cursorId: null,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
};

const PICKER_PAGE_SIZE = 20;
const DEFAULT_TABLE_PAGE_SIZE = 10;

const emptyPaginatedResponse = <T,>(): PaginatedResponse<T> => ({
  data: [],
  firstId: null,
  lastId: null,
  pageSize: DEFAULT_TABLE_PAGE_SIZE,
  hasMore: false,
  firstPage: true,
  total: 0,
});

export default function NewRecruiterReportPage() {
  const { isAdmin } = useAuth();
  const [recruiterData, setRecruiterData] =
    useState<PaginatedResponse<Recruiter>>(emptyPaginatedResponse<Recruiter>());
  const [assignmentData, setAssignmentData] =
    useState<PaginatedResponse<Assignment>>(emptyPaginatedResponse<Assignment>());
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [form, setForm] = useState(emptyRecruiter);
  const [isRecruiterLoading, setIsRecruiterLoading] = useState(true);
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(true);
  const [isSubmittingRecruiter, setIsSubmittingRecruiter] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [isRecruiterModalOpen, setIsRecruiterModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedAssessmentTypeId, setSelectedAssessmentTypeId] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [recruiterPagination, setRecruiterPagination] = useState<PaginationRequestState>({
    anchorId: 0,
    page: "next",
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [assignmentPagination, setAssignmentPagination] = useState<PaginationRequestState>({
    anchorId: 0,
    page: "next",
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [recruiterCurrentPage, setRecruiterCurrentPage] = useState(1);
  const [assignmentCurrentPage, setAssignmentCurrentPage] = useState(1);
  const [selectedAssignmentRecruiterIds, setSelectedAssignmentRecruiterIds] = useState<number[]>(
    []
  );
  const [selectedBatchRecruiterIds, setSelectedBatchRecruiterIds] = useState<number[]>([]);
  const [selectedBulkBatchId, setSelectedBulkBatchId] = useState("");
  const [assignmentPicker, setAssignmentPicker] = useState<RecruiterPickerState>(emptyPickerState);
  const [batchPicker, setBatchPicker] = useState<RecruiterPickerState>(emptyPickerState);
  const { batches } = useBatches("new_recruiter");
  const assignmentPickerQueryRef = useRef("");
  const batchPickerQueryRef = useRef("");

  const getBatchIdParam = useCallback(() => {
    if (selectedBatchFilter === "all") return undefined;
    return Number(selectedBatchFilter);
  }, [selectedBatchFilter]);

  const loadRecruiters = useCallback(async () => {
    setIsRecruiterLoading(true);
    try {
      const response = await api.get<{ data: PaginatedResponse<Recruiter> }>(
        "/api/new-recruiters",
        {
          params: {
            page: recruiterPagination.page,
            pageSize: recruiterPagination.pageSize,
            anchorId: recruiterPagination.anchorId ?? 0,
            batchId: getBatchIdParam(),
          },
        }
      );
      setRecruiterData(response.data.data ?? emptyPaginatedResponse<Recruiter>());
    } finally {
      setIsRecruiterLoading(false);
    }
  }, [
    getBatchIdParam,
    recruiterPagination.anchorId,
    recruiterPagination.page,
    recruiterPagination.pageSize,
  ]);

  const loadAssignments = useCallback(async () => {
    setIsAssignmentLoading(true);
    try {
      const response = await api.get<{ data: PaginatedResponse<Assignment> }>(
        "/api/new-recruiters/assignments",
        {
          params: {
            page: assignmentPagination.page,
            pageSize: assignmentPagination.pageSize,
            anchorId: assignmentPagination.anchorId ?? 0,
            batchId: getBatchIdParam(),
          },
        }
      );
      setAssignmentData(response.data.data ?? emptyPaginatedResponse<Assignment>());
    } finally {
      setIsAssignmentLoading(false);
    }
  }, [
    assignmentPagination.anchorId,
    assignmentPagination.page,
    assignmentPagination.pageSize,
    getBatchIdParam,
  ]);

  const loadAssessmentTypes = useCallback(async () => {
    const response = await api.get("/api/assessment-types");
    setAssessmentTypes(response.data.data ?? []);
  }, []);

  useEffect(() => {
    loadRecruiters().catch(() => toast.error("Gagal memuat data new recruiter"));
  }, [loadRecruiters]);

  useEffect(() => {
    loadAssignments().catch(() => toast.error("Gagal memuat assignment new recruiter"));
  }, [loadAssignments]);

  useEffect(() => {
    loadAssessmentTypes().catch(() => toast.error("Gagal memuat assessment type"));
  }, [loadAssessmentTypes]);

  useEffect(() => {
    setRecruiterCurrentPage(1);
    setAssignmentCurrentPage(1);
    setRecruiterPagination((prev) => ({ ...prev, anchorId: 0, page: "next" }));
    setAssignmentPagination((prev) => ({ ...prev, anchorId: 0, page: "next" }));
  }, [selectedBatchFilter]);

  const fetchRecruiterPicker = useCallback(
    async (
      mode: "assignment" | "batch",
      options?: { reset?: boolean; query?: string; cursorId?: number | null }
    ) => {
      const reset = options?.reset ?? false;
      const query = options?.query ?? "";
      const cursorId = reset ? null : (options?.cursorId ?? null);
      const setter = mode === "assignment" ? setAssignmentPicker : setBatchPicker;

      setter((prev) => ({
        ...prev,
        ...(reset ? { items: [], cursorId: null, hasMore: true } : {}),
        ...(reset ? { isLoading: true } : { isLoadingMore: true }),
      }));

      try {
        const params: Record<string, string | number> = {
          pageSize: PICKER_PAGE_SIZE,
        };
        if (query.trim()) params.query = query.trim();
        if (cursorId) params.cursorId = cursorId;
        if (selectedBatchFilter !== "all") params.batchId = selectedBatchFilter;

        const response = await api.get<RecruiterSearchResponse>("/api/new-recruiters/search", {
          params,
        });
        const payload = response.data;

        setter((prev) => ({
          ...prev,
          items: reset ? payload.data : [...prev.items, ...payload.data],
          cursorId: payload.lastId ?? null,
          hasMore: payload.hasMore,
          isLoading: false,
          isLoadingMore: false,
        }));
      } catch {
        setter((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
        }));
        toast.error("Gagal memuat recruiter");
      }
    },
    [selectedBatchFilter]
  );

  useEffect(() => {
    assignmentPickerQueryRef.current = assignmentPicker.query;
  }, [assignmentPicker.query]);

  useEffect(() => {
    batchPickerQueryRef.current = batchPicker.query;
  }, [batchPicker.query]);

  useEffect(() => {
    if (isAssignmentModalOpen) {
      fetchRecruiterPicker("assignment", { reset: true, query: assignmentPickerQueryRef.current });
    }
  }, [isAssignmentModalOpen, selectedBatchFilter, fetchRecruiterPicker]);

  useEffect(() => {
    if (isBulkAssignModalOpen) {
      fetchRecruiterPicker("batch", { reset: true, query: batchPickerQueryRef.current });
    }
  }, [isBulkAssignModalOpen, selectedBatchFilter, fetchRecruiterPicker]);

  useEffect(() => {
    if (!isAssignmentModalOpen) return;
    const timeout = setTimeout(() => {
      fetchRecruiterPicker("assignment", {
        reset: true,
        query: assignmentPicker.query,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [assignmentPicker.query, isAssignmentModalOpen, fetchRecruiterPicker]);

  useEffect(() => {
    if (!isBulkAssignModalOpen) return;
    const timeout = setTimeout(() => {
      fetchRecruiterPicker("batch", {
        reset: true,
        query: batchPicker.query,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [batchPicker.query, isBulkAssignModalOpen, fetchRecruiterPicker]);

  const createRecruiter = async () => {
    if (!form.nama || !form.seafarerCode || !form.rank || !form.academyName || !form.batchId) {
      toast.error("Nama, seafarer code, rank, akademi, dan batch wajib diisi");
      return;
    }

    setIsSubmittingRecruiter(true);
    try {
      await api.post("/api/new-recruiters", {
        ...form,
        batchId: Number(form.batchId),
        phone: form.phone || null,
        email: form.email || null,
      });
      setForm(emptyRecruiter);
      setIsRecruiterModalOpen(false);
      setRecruiterCurrentPage(1);
      setRecruiterPagination((prev) => ({ ...prev, anchorId: 0, page: "next" }));
      toast.success("New recruiter berhasil ditambahkan");
    } finally {
      setIsSubmittingRecruiter(false);
    }
  };

  const createAssignment = async () => {
    if (selectedAssignmentRecruiterIds.length === 0 || !selectedAssessmentTypeId) {
      toast.error("Pilih recruiter dan assessment terlebih dahulu");
      return;
    }

    setIsSubmittingAssignment(true);
    try {
      for (const recruiterId of selectedAssignmentRecruiterIds) {
        const recruiter = assignmentPicker.items.find((item) => item.id === recruiterId);
        if (!recruiter?.batchId) {
          toast.error(`Recruiter ${recruiter?.nama || recruiterId} belum memiliki batch`);
          return;
        }

        await api.post("/api/new-recruiters/assignments", {
          newRecruiterId: recruiterId,
          assessmentTypeId: Number(selectedAssessmentTypeId),
          batchId: recruiter.batchId,
        });
      }
      setSelectedAssignmentRecruiterIds([]);
      setSelectedAssessmentTypeId("");
      setIsAssignmentModalOpen(false);
      setAssignmentCurrentPage(1);
      setAssignmentPagination((prev) => ({ ...prev, anchorId: 0, page: "next" }));
      setRecruiterPagination((prev) => ({ ...prev, anchorId: 0, page: "next" }));
      toast.success("Assignment dan token berhasil dibuat");
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const bulkAssignBatch = async () => {
    if (selectedBatchRecruiterIds.length === 0) {
      toast.error("Pilih recruiter terlebih dahulu");
      return;
    }
    if (!selectedBulkBatchId) {
      toast.error("Pilih batch tujuan terlebih dahulu");
      return;
    }

    setIsSubmittingRecruiter(true);
    try {
      await api.post("/api/new-recruiters/bulk-assign-batch", {
        newRecruiterIds: selectedBatchRecruiterIds,
        batchId: Number(selectedBulkBatchId),
      });
      setIsBulkAssignModalOpen(false);
      setSelectedBulkBatchId("");
      setSelectedBatchRecruiterIds([]);
      setRecruiterCurrentPage(1);
      setAssignmentCurrentPage(1);
      setRecruiterPagination((prev) => ({ ...prev, anchorId: 0, page: "next" }));
      setAssignmentPagination((prev) => ({ ...prev, anchorId: 0, page: "next" }));
      toast.success("Batch recruiter berhasil diperbarui");
    } finally {
      setIsSubmittingRecruiter(false);
    }
  };

  const getStatusTone = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "assigned":
      case "active":
        return "bg-sky-50 text-sky-700 border-sky-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const recruiters = recruiterData.data;
  const assignments = assignmentData.data;

  const handlePickerScroll = (event: UIEvent<HTMLDivElement>, mode: "assignment" | "batch") => {
    const state = mode === "assignment" ? assignmentPicker : batchPicker;
    if (!state.hasMore || state.isLoading || state.isLoadingMore) return;

    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 48;

    if (nearBottom) {
      fetchRecruiterPicker(mode, { cursorId: state.cursorId });
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token berhasil disalin");
    } catch {
      toast.error("Gagal menyalin token");
    }
  };

  const toggleRecruiterSelection = (
    recruiterId: number,
    setter: Dispatch<SetStateAction<number[]>>
  ) => {
    setter((prev) =>
      prev.includes(recruiterId) ? prev.filter((id) => id !== recruiterId) : [...prev, recruiterId]
    );
  };

  const toggleSelectAllRecruiters = (
    currentSelection: number[],
    setter: Dispatch<SetStateAction<number[]>>,
    items: Recruiter[]
  ) => {
    const allSelected =
      items.length > 0 && items.every((recruiter) => currentSelection.includes(recruiter.id));

    if (allSelected) {
      const filteredIds = new Set(items.map((recruiter) => recruiter.id));
      setter((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }

    setter(Array.from(new Set([...currentSelection, ...items.map((r) => r.id)])));
  };

  const getScoreForAssessmentType = (
    recruiter: Recruiter,
    assessmentTypeName: string
  ): number | null => {
    if (!recruiter.reportScores || !Array.isArray(recruiter.reportScores)) {
      return null;
    }

    const scoreEntry = recruiter.reportScores.find(
      (item) => item.assessmentType?.assessmentTypeName === assessmentTypeName
    );

    if (!scoreEntry || typeof scoreEntry.score !== "number") {
      return null;
    }

    return scoreEntry.score;
  };

  const navigateRecruiterPage = (direction: PageDirection) => {
    if (direction === "prev" && (!recruiterData.firstId || recruiterCurrentPage <= 1)) return;
    if (direction === "next" && !recruiterData.hasMore) return;

    setRecruiterCurrentPage((prev) => (direction === "prev" ? Math.max(1, prev - 1) : prev + 1));
    setRecruiterPagination((prev) => ({
      ...prev,
      page: direction,
      anchorId: direction === "prev" ? (recruiterData.firstId ?? 0) : (recruiterData.lastId ?? 0),
    }));
  };

  const navigateAssignmentPage = (direction: PageDirection) => {
    if (direction === "prev" && (!assignmentData.firstId || assignmentCurrentPage <= 1)) return;
    if (direction === "next" && !assignmentData.hasMore) return;

    setAssignmentCurrentPage((prev) => (direction === "prev" ? Math.max(1, prev - 1) : prev + 1));
    setAssignmentPagination((prev) => ({
      ...prev,
      page: direction,
      anchorId: direction === "prev" ? (assignmentData.firstId ?? 0) : (assignmentData.lastId ?? 0),
    }));
  };

  return (
    <main className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-background px-5 py-5 shadow-sm md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            New Recruiter Report
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Kelola data recruiter external, assignment token, dan monitoring attempts dalam satu
            halaman yang terpisah dari master report crew.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="min-w-[220px]">
            <Select value={selectedBatchFilter} onValueChange={setSelectedBatchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Batch</SelectItem>
                {batches.map((batch: Batch) => (
                  <SelectItem key={batch.id} value={String(batch.id)}>
                    {batch.batchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="bg-white">
            {recruiterData.total} recruiter
          </Badge>
          <Badge variant="outline" className="bg-white">
            {assignmentData.total} assignment
          </Badge>

          {isAdmin && (
            <Dialog open={isBulkAssignModalOpen} onOpenChange={setIsBulkAssignModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Assign Batch</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Bulk Assign Batch Recruiter</DialogTitle>
                  <DialogDescription>
                    Pilih recruiter dan batch tujuan untuk memperbarui batch secara massal.
                  </DialogDescription>
                </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Pilih Recruiter</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleSelectAllRecruiters(
                          selectedBatchRecruiterIds,
                          setSelectedBatchRecruiterIds,
                          batchPicker.items
                        )
                      }
                    >
                      Pilih Semua
                    </Button>
                  </div>
                  <Input
                    value={batchPicker.query}
                    onChange={(e) => setBatchPicker((prev) => ({ ...prev, query: e.target.value }))}
                    placeholder="Cari nama, seafarer code, rank, atau akademi"
                  />
                  <div
                    className="max-h-60 space-y-2 overflow-auto rounded-lg border p-3"
                    onScroll={(event) => handlePickerScroll(event, "batch")}
                  >
                    {batchPicker.items.map((recruiter) => (
                      <label
                        key={recruiter.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-2 py-2 hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={selectedBatchRecruiterIds.includes(recruiter.id)}
                          onCheckedChange={() =>
                            toggleRecruiterSelection(recruiter.id, setSelectedBatchRecruiterIds)
                          }
                        />
                        <div className="space-y-0.5 text-sm">
                          <div className="font-medium text-slate-900">{recruiter.nama}</div>
                          <div className="text-slate-500">
                            {recruiter.rank} • {recruiter.batchName || "Tanpa batch"}
                          </div>
                        </div>
                      </label>
                    ))}
                    {batchPicker.isLoading && (
                      <div className="py-3 text-center text-sm text-muted-foreground">
                        Memuat recruiter...
                      </div>
                    )}
                    {batchPicker.isLoadingMore && (
                      <div className="py-3 text-center text-sm text-muted-foreground">
                        Memuat lebih banyak...
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Batch Tujuan</Label>
                  <Select value={selectedBulkBatchId} onValueChange={setSelectedBulkBatchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch: Batch) => (
                        <SelectItem key={batch.id} value={String(batch.id)}>
                          {batch.batchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                  {selectedBatchRecruiterIds.length} recruiter dipilih
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBulkAssignModalOpen(false);
                    setSelectedBulkBatchId("");
                    setSelectedBatchRecruiterIds([]);
                    setBatchPicker(emptyPickerState);
                  }}
                >
                  Batal
                </Button>
                <Button onClick={bulkAssignBatch} disabled={isSubmittingRecruiter}>
                  {isSubmittingRecruiter ? "Menyimpan..." : "Simpan Batch"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}

          {isAdmin && (
            <Dialog open={isAssignmentModalOpen} onOpenChange={setIsAssignmentModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Buat Assignment</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Buat Assignment Token</DialogTitle>
                  <DialogDescription>
                    Token akan dibuat per recruiter dan per assessment saat assignment disimpan.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Pilih Recruiter</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleSelectAllRecruiters(
                            selectedAssignmentRecruiterIds,
                            setSelectedAssignmentRecruiterIds,
                            assignmentPicker.items
                          )
                        }
                      >
                        Pilih Semua
                      </Button>
                    </div>
                    <Input
                      value={assignmentPicker.query}
                      onChange={(e) =>
                        setAssignmentPicker((prev) => ({ ...prev, query: e.target.value }))
                      }
                      placeholder="Cari nama, seafarer code, rank, atau akademi"
                    />
                    <div
                      className="max-h-60 space-y-2 overflow-auto rounded-lg border p-3"
                      onScroll={(event) => handlePickerScroll(event, "assignment")}
                    >
                      {assignmentPicker.items.map((recruiter) => (
                        <label
                          key={recruiter.id}
                          className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-2 py-2 hover:bg-slate-50"
                        >
                          <Checkbox
                            checked={selectedAssignmentRecruiterIds.includes(recruiter.id)}
                            onCheckedChange={() =>
                              toggleRecruiterSelection(
                                recruiter.id,
                                setSelectedAssignmentRecruiterIds
                              )
                            }
                          />
                          <div className="space-y-0.5 text-sm">
                            <div className="font-medium text-slate-900">{recruiter.nama}</div>
                            <div className="text-slate-500">
                              {recruiter.rank} • {recruiter.batchName || "Tanpa batch"}
                            </div>
                          </div>
                        </label>
                      ))}
                      {assignmentPicker.isLoading && (
                        <div className="py-3 text-center text-sm text-muted-foreground">
                          Memuat recruiter...
                        </div>
                      )}
                      {assignmentPicker.isLoadingMore && (
                        <div className="py-3 text-center text-sm text-muted-foreground">
                          Memuat lebih banyak...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assessment Type</Label>
                    <Select
                      value={selectedAssessmentTypeId}
                      onValueChange={setSelectedAssessmentTypeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih assessment" />
                      </SelectTrigger>
                      <SelectContent>
                        {assessmentTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.assessmentTypeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAssignmentModalOpen(false);
                        setSelectedAssignmentRecruiterIds([]);
                        setSelectedAssessmentTypeId("");
                        setAssignmentPicker(emptyPickerState);
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={() =>
                        createAssignment().catch(() => toast.error("Gagal membuat assignment"))
                      }
                      disabled={isSubmittingAssignment}
                    >
                      {isSubmittingAssignment ? "Membuat token..." : "Generate Token"}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <Dialog open={isRecruiterModalOpen} onOpenChange={setIsRecruiterModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Recruiter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah New Recruiter</DialogTitle>
                  <DialogDescription>
                    Isi data recruiter terlebih dahulu sebelum membuat assignment token.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-nama">Nama</Label>
                    <Input
                      id="recruiter-nama"
                      value={form.nama}
                      placeholder="Masukkan nama lengkap"
                      onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-seafarer-code">Seafarer Code</Label>
                    <Input
                      id="recruiter-seafarer-code"
                      value={form.seafarerCode}
                      placeholder="Masukkan seafarer code"
                      onChange={(e) => setForm((prev) => ({ ...prev, seafarerCode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-rank">Rank</Label>
                    <Select
                      value={form.rank}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, rank: value }))}
                    >
                      <SelectTrigger id="recruiter-rank">
                        <SelectValue placeholder="Pilih rank" />
                      </SelectTrigger>
                      <SelectContent>
                        {rankOptions.map((rank) => (
                          <SelectItem key={rank} value={rank}>
                            {rank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-academy">Akademi Pelayaran</Label>
                    <Input
                      id="recruiter-academy"
                      value={form.academyName}
                      placeholder="Masukkan nama akademi"
                      onChange={(e) => setForm((prev) => ({ ...prev, academyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-batch">Batch</Label>
                    <Select
                      value={form.batchId || ""}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, batchId: value }))}
                    >
                      <SelectTrigger id="recruiter-batch">
                        <SelectValue placeholder="Pilih batch recruiter" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch: Batch) => (
                          <SelectItem key={batch.id} value={String(batch.id)}>
                            {batch.batchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-phone">Nomor Telepon</Label>
                    <Input
                      id="recruiter-phone"
                      value={form.phone}
                      placeholder="Opsional"
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recruiter-email">Email</Label>
                    <Input
                      id="recruiter-email"
                      value={form.email}
                      placeholder="Opsional"
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRecruiterModalOpen(false);
                      setForm(emptyRecruiter);
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() =>
                      createRecruiter().catch(() => toast.error("Gagal menambah new recruiter"))
                    }
                    disabled={isSubmittingRecruiter}
                  >
                    {isSubmittingRecruiter ? "Menyimpan..." : "Simpan Recruiter"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </section>

      <section className="grid gap-6">
        <Card className="gap-0 overflow-hidden">
          <CardHeader className="border-b bg-slate-50/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-slate-900">Master Data New Recruiter</CardTitle>
                <CardDescription>
                  Data peserta external yang terdaftar di modul new recruiter.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-white">
                {recruiterData.total} data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[460px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="px-6">Nama</TableHead>
                    <TableHead>Seafarer Code</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Akademi</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead className="pr-6">Email</TableHead>
                    {assessmentTypes.map((assessmentType) => (
                      <TableHead key={assessmentType.id} className="text-center">
                        {assessmentType.assessmentTypeName}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruiters.length > 0 ? (
                    recruiters.map((recruiter) => (
                      <TableRow key={recruiter.id}>
                        <TableCell className="px-6 font-medium text-slate-900">
                          {recruiter.nama}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {recruiter.seafarerCode}
                        </TableCell>
                        <TableCell>{recruiter.rank}</TableCell>
                        <TableCell>{recruiter.academyName}</TableCell>
                        <TableCell>{recruiter.batchName || "-"}</TableCell>
                        <TableCell>{recruiter.phone || "-"}</TableCell>
                        <TableCell className="pr-6">{recruiter.email || "-"}</TableCell>
                        {assessmentTypes.map((assessmentType) => {
                          const score = getScoreForAssessmentType(
                            recruiter,
                            assessmentType.assessmentTypeName
                          );

                          return (
                            <TableCell key={assessmentType.id} className="text-center">
                              {score !== null ? (
                                <span className="inline-flex min-w-9 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  {score}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7 + assessmentTypes.length}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {isRecruiterLoading ? "Memuat data..." : "Belum ada data new recruiter"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {recruiters.length} dari {recruiterData.total} recruiter
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateRecruiterPage("prev")}
                  disabled={recruiterCurrentPage <= 1 || isRecruiterLoading}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-slate-600">Halaman {recruiterCurrentPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateRecruiterPage("next")}
                  disabled={!recruiterData.hasMore || isRecruiterLoading}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden">
          <CardHeader className="border-b bg-slate-50/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-slate-900">Assignment New Recruiter</CardTitle>
                <CardDescription>
                  Monitoring token assignment, status pengerjaan, dan jumlah attempts.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-white">
                {assignmentData.total} assignment
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[460px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="px-6">Nama</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="px-6 font-medium text-slate-900">
                          {assignment.newRecruiter?.nama || "-"}
                        </TableCell>
                        <TableCell>{assignment.assessmentType}</TableCell>
                        <TableCell>{assignment.batchName || "-"}</TableCell>
                        <TableCell className="text-center">
                          {typeof assignment.reportScore === "number" ? (
                            <span className="inline-flex min-w-9 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {assignment.reportScore}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[320px]">
                          <div className="rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 break-all">
                            {assignment.token}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusTone(assignment.status)}>
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {assignment.attemptsCount}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleCopyToken(assignment.token)}
                          >
                            <Copy className="h-4 w-4" />
                            Copy Token
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        {isAssignmentLoading
                          ? "Memuat data..."
                          : "Belum ada assignment new recruiter"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {assignments.length} dari {assignmentData.total} assignment
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateAssignmentPage("prev")}
                  disabled={assignmentCurrentPage <= 1 || isAssignmentLoading}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-slate-600">Halaman {assignmentCurrentPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateAssignmentPage("next")}
                  disabled={!assignmentData.hasMore || isAssignmentLoading}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
