"use client";

import { useState, useEffect, useRef } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useApi } from "@/hooks/use-api";
import { IReport } from "@/types/global-types";
import { parseReports, parsePaginationData } from "@/lib/utils";
import Image from "next/image";
import { Calendar } from "lucide-react";

const FormSchema = z.object({
  mentorName: z.string().min(1, { message: "Nama Mentor harus diisi" }),
  period: z.string().min(1, { message: "Periode harus diisi" }),
  program: z.string().min(1, { message: "Program harus diisi" }),
  programTitle: z.string().min(1, { message: "Judul Program harus diisi" }),
  menteeNames: z
    .array(z.string())
    .min(1, { message: "Minimal satu mentee harus dipilih" }),
  department: z.string().min(1, { message: "Departemen harus diisi" }),
  sessionNumber: z.number().min(1, { message: "Sesi ke harus diisi" }),
  date: z.string().min(1, { message: "Tanggal harus diisi" }),
  duration: z.number().min(1, { message: "Durasi harus diisi" }),
  purpose: z
    .string()
    .min(1, { message: "Tujuan/Isu yang Dibahas harus diisi" }),
  observation: z
    .string()
    .min(1, { message: "Observasi Terhadap Coachee harus diisi" }),
  reflection: z.string().min(1, { message: "Refleksi Mentor harus diisi" }),
  actionPlan: z.string().min(1, { message: "Rencana Aksi harus diisi" }),
  additionalNotes: z.string().optional(),
  reportIds: z
    .array(z.number())
    .min(1, { message: "Minimal satu report harus dipilih" }),
});

export default function ReportMentoring() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState<IReport[]>([]);
  const [selectedMentees, setSelectedMentees] = useState<string[]>([]);
  const [menteeSearchTerm, setMenteeSearchTerm] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [loadingReports, setLoadingReports] = useState(false);
  const [availableMentees, setAvailableMentees] = useState<string[]>([]);
  const ref = useRef<HTMLInputElement>(null);
  const api = useApi();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      mentorName: "",
      period: "",
      program: "",
      programTitle: "",
      menteeNames: [],
      department: "",
      sessionNumber: 0,
      date: "",
      duration: 0,
      purpose: "",
      observation: "",
      reflection: "",
      actionPlan: "",
      additionalNotes: "",
      reportIds: [],
    },
  });

  // Fetch reports only when program is selected
  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedProgram) {
        setReports([]);
        setAvailableMentees([]);
        return;
      }

      setLoadingReports(true);
      try {
        const params = new URLSearchParams({
          anchor_id: "0",
          page: "next",
          page_size: "1000",
          filter: selectedProgram, // Using filter parameter as per backend implementation
        });

        const response = await api.get(`/reports?${params.toString()}`);
        if (response.data && response.data.data) {
          const paginationData = parsePaginationData<IReport>(
            response.data.data,
            parseReports
          );
          const fetchedReports = paginationData.results;
          setReports(fetchedReports);

          // Extract unique mentee names from fetched reports
          const uniqueMentees = Array.from(
            new Set(fetchedReports.map((report) => report.nama))
          ).sort();
          setAvailableMentees(uniqueMentees);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        toast.error("Gagal memuat data reports");
        setReports([]);
        setAvailableMentees([]);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [api, selectedProgram]);

  // Filter reports based on selected mentees
  useEffect(() => {
    if (selectedMentees.length > 0) {
      const filtered = reports.filter((report) =>
        selectedMentees.includes(report.nama)
      );
      const reportIds = filtered.map((report) => report.id);
      form.setValue("reportIds", reportIds);
    } else {
      form.setValue("reportIds", []);
    }
  }, [selectedMentees, reports, form]);

  // Get filtered mentees based on search term
  const getFilteredMentees = () => {
    if (!selectedProgram) return [];

    return availableMentees.filter((menteeName) =>
      menteeName.toLowerCase().includes(menteeSearchTerm.toLowerCase())
    );
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    try {
      console.log("Sending POST request to /mentoring-reports");
      const response = await api.post("/mentoring-reports", {
        ...data,
        sessionNumber: data.sessionNumber.toString(),
        duration: data.duration.toString(),
      });
      console.log("Response received:", response);

      if (response.status === 201) {
        toast.success("Laporan mentoring berhasil disimpan!");
        form.reset();
        setSelectedMentees([]);
        setSelectedProgram("");
        setReports([]);
        setAvailableMentees([]);
        setMenteeSearchTerm("");
      }
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : "Gagal menyimpan laporan mentoring";
      toast.error(errorMessage || "Gagal menyimpan laporan mentoring");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgramChange = (program: string) => {
    setSelectedProgram(program);
    form.setValue("program", program);
    // Reset mentee selection and data when program changes
    setSelectedMentees([]);
    form.setValue("menteeNames", []);
    form.setValue("reportIds", []);
    setMenteeSearchTerm("");
    setReports([]);
    setAvailableMentees([]);
    // Note: programTitle is not reset here, let user fill it manually
  };

  const handleMenteeSelection = (menteeName: string, checked: boolean) => {
    let newSelectedMentees;
    if (checked) {
      newSelectedMentees = [...selectedMentees, menteeName];
    } else {
      newSelectedMentees = selectedMentees.filter(
        (name) => name !== menteeName
      );
    }
    setSelectedMentees(newSelectedMentees);
    form.setValue("menteeNames", newSelectedMentees);
  };

  const uniqueMentees = getFilteredMentees();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <Image
              width={64}
              height={64}
              src="/images/logo1.png"
              alt="Logo Kiri"
              className="h-16 w-auto"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold uppercase text-gray-800 mb-2">
                Form Report Mentoring
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Monthly Mentoring Report
              </p>
            </div>
            <Image
              width={64}
              height={64}
              src="/images/logo2.png"
              alt="Logo Kanan"
              className="h-16 w-auto"
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Informasi Mentor & Mentee */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Informasi Mentor & Mentee
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField
                  control={form.control}
                  name="mentorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Nama Mentor <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan nama mentor"
                          {...field}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Periode <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Oktober 2023"
                          {...field}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Program Selection - Moved here */}
                <FormField
                  control={form.control}
                  name="program"
                  render={() => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Pilih Program <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={handleProgramChange}
                        value={selectedProgram}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                            <SelectValue placeholder="Pilih Program Terlebih Dahulu" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FDP">FDP</SelectItem>
                          <SelectItem value="MDP">MDP</SelectItem>
                          <SelectItem value="SDP">SDP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mentee Selection - Now depends on program */}
                <FormField
                  control={form.control}
                  name="menteeNames"
                  render={() => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Pilih Mentee <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {selectedProgram ? (
                            <>
                              {/* Search input */}
                              <Input
                                placeholder="Cari nama mentee..."
                                value={menteeSearchTerm}
                                onChange={(e) =>
                                  setMenteeSearchTerm(e.target.value)
                                }
                                className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                                disabled={loadingReports}
                              />

                              {loadingReports ? (
                                <div className="p-8 text-center text-gray-500">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                  Memuat data mentees...
                                </div>
                              ) : (
                                <>
                                  {/* Mentee grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                                    {uniqueMentees.length > 0 ? (
                                      uniqueMentees.map((menteeName) => (
                                        <div
                                          key={menteeName}
                                          className="flex items-center space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50"
                                        >
                                          <Checkbox
                                            id={`mentee-${menteeName}`}
                                            onCheckedChange={(checked) =>
                                              handleMenteeSelection(
                                                menteeName,
                                                checked as boolean
                                              )
                                            }
                                            checked={selectedMentees.includes(
                                              menteeName
                                            )}
                                          />
                                          <label
                                            htmlFor={`mentee-${menteeName}`}
                                            className="flex-1 cursor-pointer"
                                          >
                                            <div className="font-medium text-gray-900">
                                              {menteeName}
                                            </div>
                                          </label>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="col-span-full text-center text-gray-500 py-4">
                                        {menteeSearchTerm
                                          ? `Tidak ditemukan mentee dengan nama "${menteeSearchTerm}"`
                                          : `Tidak ada mentee untuk program ${selectedProgram}`}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}

                              {/* Selected reports display */}
                              {selectedMentees.length > 0 && (
                                <div className="space-y-3">
                                  <div className="text-sm font-medium text-gray-700">
                                    Reports Terpilih (
                                    {
                                      reports.filter((report) =>
                                        selectedMentees.includes(report.nama)
                                      ).length
                                    }
                                    )
                                  </div>
                                  <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4 bg-green-50">
                                    {reports
                                      .filter((report) =>
                                        selectedMentees.includes(report.nama)
                                      )
                                      .map((report) => (
                                        <div
                                          key={report.id}
                                          className="flex items-center space-x-6 p-3 border rounded-lg bg-white"
                                        >
                                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg
                                              className="w-2 h-2 text-white"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                              {report.nama}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              {report.seamanCode} -{" "}
                                              {report.jabatan} -{" "}
                                              {report.idpProgram}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                              <div className="text-lg font-medium mb-2">
                                Pilih Program Terlebih Dahulu
                              </div>
                              <div className="text-sm">
                                Silakan pilih program di atas untuk melihat
                                daftar mentee yang tersedia
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Informasi Program */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Informasi Program
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField
                  control={form.control}
                  name="programTitle"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Judul Program <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan judul lengkap program"
                          {...field}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Tujuan/Isu yang Dibahas <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsikan tujuan atau isu yang dibahas dalam sesi mentoring"
                          className="min-h-[80px] border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Sesi ke <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: 1, 2, 3"
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          value={field.value || ""}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => {
                    const { ref: fieldRef, ...rest } = field;

                    return (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-700">
                          Tanggal <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...rest}
                              type="date"
                              ref={(node) => {
                                fieldRef(node); // ref dari RHF
                                ref.current = node; // ref lokal untuk showPicker
                              }}
                              className="
                border-gray-300 focus:border-gray-500 focus:ring-gray-500
                pr-10
                [appearance:textfield]
                [&::-webkit-calendar-picker-indicator]:opacity-0
                [&::-webkit-calendar-picker-indicator]:pointer-events-none
              "
                            />
                            <button
                              type="button"
                              aria-label="Open date picker"
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                              onMouseDown={(e) => {
                                // jaga fokus tetap di input agar gesture dianggap valid
                                e.preventDefault();
                                const el = ref.current;
                                if (!el) return;
                                try {
                                  // Chromium (Chrome/Edge)
                                  const anyEl = el as any;
                                  if (typeof anyEl.showPicker === "function") {
                                    anyEl.showPicker();
                                  } else {
                                    // Fallback (Firefox/Safari): fokus lalu klik biasa
                                    el.focus();
                                    el.click();
                                  }
                                } catch {
                                  el.focus();
                                }
                              }}
                            >
                              <Calendar className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Durasi (Menit) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: 60"
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          value={field.value || ""}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Departemen <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan departemen"
                          {...field}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Observasi */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Observasi
              </h2>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Observasi Terhadap Mentee <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tuliskan observasi anda terhadap mentee selama sesi mentoring"
                          className="min-h-[120px] border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Refleksi Mentor */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Refleksi Mentor
              </h2>
              <FormField
                control={form.control}
                name="reflection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Refleksi Anda sebagai Mentor <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan refleksi anda sebagai mentor mengenai sesi mentoring yang telah dilakukan"
                        className="min-h-[150px] border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rencana Aksi */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Rencana Aksi (Way Forward)
              </h2>
              <FormField
                control={form.control}
                name="actionPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Rencana Aksi Selanjutnya <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan rencana aksi yang akan dilakukan selanjutnya untuk pengembangan mentee"
                        className="min-h-[150px] border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Catatan Tambahan */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Catatan Tambahan
              </h2>
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Catatan Tambahan (Opsional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan catatan tambahan jika ada hal lain yang perlu dicatat"
                        className="min-h-[120px] border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Section */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex flex-col items-center gap-6">
                <Button
                  type="submit"
                  className="w-full md:w-1/2 py-4 text-lg font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-all duration-300 hover:scale-105"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Laporan Mentoring"}
                </Button>

                <div className="flex justify-center items-center gap-8 pt-4 border-t w-full">
                  <Image
                    width={48}
                    height={48}
                    src="/images/logo1.png"
                    alt="Logo Perusahaan"
                    className="h-12 w-auto"
                  />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      Talent Development System
                    </p>
                    <p className="text-xs text-gray-500">
                      Monthly Mentoring Report
                    </p>
                  </div>
                  <Image
                    width={48}
                    height={48}
                    src="/images/logo2.png"
                    alt="Logo Perusahaan"
                    className="h-12 w-auto"
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
