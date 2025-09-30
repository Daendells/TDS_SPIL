"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useApi } from "@/hooks/use-api";

const FormSchema = z.object({
  mentorName: z.string().min(1, { message: "Nama Mentor harus diisi" }),
  period: z.string().min(1, { message: "Periode harus diisi" }),
  menteeName: z.string().min(1, { message: "Nama Mentee harus diisi" }),
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
});

export default function ReportMentoring() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api = useApi();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mentorName: "",
      period: "",
      menteeName: "",
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
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      console.log("Form data:", data);
      toast.success("Laporan mentoring berhasil disimpan!");
      form.reset();
    } catch (err) {
      toast.error("Gagal menyimpan laporan mentoring");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* <img src="/images/logo1.png" alt="Logo Kiri" className="h-12" /> */}
        <h1 className="text-2xl font-bold uppercase">Form Report Mentoring</h1>
        <img src="/images/logo2.png" alt="Logo Kanan" className="h-12" />
      </div>

      <div className="border-b pb-2 mb-4">
        <p className="text-gray-500">Silakan isi form laporan mentoring bulanan berikut</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="border rounded-xl shadow-sm p-6 bg-white">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Informasi Mentor & Mentee</h2>
              <div className="space-y-8 px-2">
                <FormField
                  control={form.control}
                  name="mentorName"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Nama Mentor</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Periode */}
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Periode</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nama Mentee */}
                <FormField
                  control={form.control}
                  name="menteeName"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Nama Mentee</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Departemen */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Departemen</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-6 bg-white">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Informasi Program</h2>
              <div className="space-y-8 px-2">
                {/* Program */}
                <FormField
                  control={form.control}
                  name="program"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Program</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: MDP, FDP, SDP" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sesi ke */}
                <FormField
                  control={form.control}
                  name="sessionNumber"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Sesi ke</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tanggal */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Tanggal</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Durasi */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Durasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 60 menit" {...field} className="border-gray-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border rounded-xl shadow-sm p-6 bg-white">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Tujuan & Observasi</h2>
              <div className="space-y-8 px-2">
                {/* Tujuan/Isu yang Dibahas */}
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Tujuan/Isu yang Dibahas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsikan tujuan atau isu yang dibahas dalam sesi mentoring"
                          className="min-h-[100px] border-gray-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Observasi Terhadap Coachee */}
                <FormField
                  control={form.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-medium mb-2 block">Observasi Terhadap Coachee</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tuliskan observasi anda terhadap coachee"
                          className="min-h-[100px] border-gray-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Refleksi Mentor */}
            <div className="border rounded-xl shadow-sm p-6 bg-white">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Refleksi Mentor</h2>
              <FormField
                control={form.control}
                name="reflection"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan refleksi anda sebagai mentor"
                        className="min-h-[150px] border-gray-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rencana Aksi */}
            <div className="border rounded-xl shadow-sm p-6 bg-white">
              <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Rencana Aksi (Way Forward)</h2>
              <FormField
                control={form.control}
                name="actionPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan rencana aksi yang akan dilakukan selanjutnya"
                        className="min-h-[150px] border-gray-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div className="border rounded-xl shadow-sm p-6 bg-white">
            <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Catatan Tambahan</h2>
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Tuliskan catatan tambahan (opsional)"
                      className="min-h-[100px] border-gray-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-4 mt-6">
            <Button 
              type="submit" 
              className="w-full md:w-1/3 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Laporan"}
            </Button>
            <div className="flex justify-center items-center gap-8 mt-4">
              <img src="/images/logo1.png" alt="Logo Perusahaan" className="h-10" />
              <img src="/images/logo2.png" alt="Logo Perusahaan" className="h-10" />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}