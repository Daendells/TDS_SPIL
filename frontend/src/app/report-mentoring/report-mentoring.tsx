"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useApi } from "@/hooks/use-api";
import { IReport } from "@/types/global-types";
import { parseReports, parsePaginationData } from "@/lib/utils";

const FormSchema = z.object({
  mentorName: z.string().min(1, { message: "Nama Mentor harus diisi" }),
  period: z.string().min(1, { message: "Periode harus diisi" }),
  menteeNames: z.array(z.string()).min(1, { message: "Minimal satu mentee harus dipilih" }),
  department: z.string().min(1, { message: "Departemen harus diisi" }),
  program: z.string().min(1, { message: "Program harus diisi" }),
  sessionNumber: z.string().min(1, { message: "Sesi ke harus diisi" }),
  date: z.string().min(1, { message: "Tanggal harus diisi" }),
  duration: z.string().min(1, { message: "Durasi harus diisi" }),
  purpose: z.string().min(1, { message: "Tujuan/Isu yang Dibahas harus diisi" }),
  observation: z.string().min(1, { message: "Observasi Terhadap Coachee harus diisi" }),
  reflection: z.string().min(1, { message: "Refleksi Mentor harus diisi" }),
  actionPlan: z.string().min(1, { message: "Rencana Aksi harus diisi" }),
  additionalNotes: z.string().optional(),
  reportIds: z.array(z.number()).min(1, { message: "Minimal satu report harus dipilih" }),
});

export default function ReportMentoring() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState<IReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<IReport[]>([]);
  const [selectedMentees, setSelectedMentees] = useState<string[]>([]);
  const [menteeSearchTerm, setMenteeSearchTerm] = useState<string>("");
  const api = useApi();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mentorName: "",
      period: "",
      menteeNames: [],
      department: "",
      program: "",
      sessionNumber: "",
      date: "",
      duration: "",
      purpose: "",
      observation: "",
      reflection: "",
      actionPlan: "",
      additionalNotes: "",
      reportIds: [],
    },
  });

  // Fetch reports on component mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Use pagination parameters like in dashboard to get all reports
        const params = new URLSearchParams({
          anchor_id: "0",
          page: "next",
          page_size: "1000", // Get a large number to fetch all reports
        });

        const response = await api.get(`/reports?${params.toString()}`);
        if (response.data && response.data.data) {
          // Parse the data using the same utility functions as dashboard
          const paginationData = parsePaginationData<IReport>(response.data.data, parseReports);
          setReports(paginationData.data);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        toast.error("Gagal memuat data reports");
      }
    };

    fetchReports();
  }, [api]);

  useEffect(() => {
    if (selectedMentees.length > 0) {
      const filtered = reports.filter(report => selectedMentees.includes(report.nama));
      setFilteredReports(filtered);
      const allFilteredReportIds = filtered.map(report => report.id);
      form.setValue("reportIds", allFilteredReportIds);
    } else {
      setFilteredReports([]);
      form.setValue("reportIds", []);
    }
  }, [selectedMentees, reports, form]);
  const uniqueMentees = Array.from(new Set(reports.map(report => report.nama)))
    .filter(menteeName => 
      menteeName.toLowerCase().includes(menteeSearchTerm.toLowerCase())
    );

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    try {
      console.log("Sending POST request to /mentoring-reports");
      const response = await api.post("/mentoring-reports", data);
      console.log("Response received:", response);
      
      if (response.status === 201) {
        toast.success("Laporan mentoring berhasil disimpan!");
        form.reset();
        setSelectedMentees([]);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.error || "Gagal menyimpan laporan mentoring");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenteeSelection = (menteeName: string, checked: boolean) => {
    let newSelectedMentees;
    if (checked) {
      newSelectedMentees = [...selectedMentees, menteeName];
    } else {
      newSelectedMentees = selectedMentees.filter(name => name !== menteeName);
    }
    setSelectedMentees(newSelectedMentees);
    form.setValue("menteeNames", newSelectedMentees);
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-16" />
            <div className="text-center">
              <h1 className="text-3xl font-bold uppercase text-gray-800 mb-2">
                Form Report Mentoring
              </h1>
              <p className="text-lg text-gray-600 font-medium">Monthly Mentoring Report</p>
            </div>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-16" />
          </div>

        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Informasi Mentor & Mentee */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Informasi Mentor & Mentee
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mentorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Nama Mentor</FormLabel>
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
                      <FormLabel className="font-medium text-gray-700">Periode</FormLabel>
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

                

                <FormField
                  control={form.control}
                  name="menteeNames"
                  render={() => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">Pilih Mentee</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {/* Search input */}
                          <Input
                            placeholder="Cari nama mentee..."
                            value={menteeSearchTerm}
                            onChange={(e) => setMenteeSearchTerm(e.target.value)}
                            className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          />
                          {/* Mentee grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                          {uniqueMentees.map((menteeName) => {
                            return (
                              <div key={menteeName} className="flex items-center space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50">
                                <Checkbox
                                  id={`mentee-${menteeName}`}
                                  onCheckedChange={(checked) => handleMenteeSelection(menteeName, checked as boolean)}
                                  checked={selectedMentees.includes(menteeName)}
                                />
                                <label
                                  htmlFor={`mentee-${menteeName}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="font-medium text-gray-900">{menteeName}</div>
                                </label>
                              </div>
                            );
                          })}
                          </div>

                          <div className="space-y-3">
                {filteredReports.length > 0 ? (
                   
                    <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4 bg-green-50">
                      {filteredReports.map((report) => (
                        <div key={report.id} className="flex items-center space-x-6 p-3 border rounded-lg bg-white">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{report.nama}</div>
                            <div className="text-sm text-gray-600">
                              {report.seamanCode} - {report.jabatan} - {report.idpProgram}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 border rounded-lg bg-gray-50">
                    {selectedMentees.length === 0 
                      ? "Tidak ada report yang tersedia"
                      : "Tidak ada report yang tersedia"
                    }
                  </div>
                )}
              
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">Tujuan/Isu yang Dibahas</FormLabel>
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
                  name="program"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Program</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                            <SelectValue placeholder="Pilih Program" />
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

                <FormField
                  control={form.control}
                  name="sessionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Sesi ke</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contoh: 1, 2, 3" 
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Tanggal</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
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
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Durasi (Menit)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contoh: 60" 
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Departemen</FormLabel>
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
                      <FormLabel className="font-medium text-gray-700">Observasi Terhadap Mentee</FormLabel>
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
                    <FormLabel className="font-medium text-gray-700">Refleksi Anda sebagai Mentor</FormLabel>
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
                    <FormLabel className="font-medium text-gray-700">Rencana Aksi Selanjutnya</FormLabel>
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
                    <FormLabel className="font-medium text-gray-700">Catatan Tambahan (Opsional)</FormLabel>
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
                  <img src="/images/logo1.png" alt="Logo Perusahaan" className="h-12" />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">Talent Development System</p>
                    <p className="text-xs text-gray-500">Monthly Mentoring Report</p>
                  </div>
                  <img src="/images/logo2.png" alt="Logo Perusahaan" className="h-12" />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}