"use client";

import { useState, useEffect } from "react";
import { useGetReportByIdentityNumber } from "./_hooks/useReportData";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AssessmentData } from "./page";
import Image from "next/image";

const FormSchema = z.object({
  fullName: z.string().min(1, { message: "Nama lengkap harus diisi" }),
  identityNumber: z.string().min(1, { message: "Nomor identitas harus diisi" }),
  rank: z.string().min(1, { message: "Rank harus dipilih" }),
  vesselName: z.string().min(1, { message: "Nama vessel harus diisi" }),
});

interface PersonalIdentityProps {
  onNext: () => void;
  onBack: () => void;
  assessmentData: AssessmentData;
  updateAssessmentData: (data: Partial<AssessmentData>) => void;
}

const rankOptions = [
  { value: "nahkoda", label: "Nakhoda" },
  { value: "mualim_1", label: "Mualim I" },
  { value: "mualim_2", label: "Mualim II" },
  { value: "mualim_3", label: "Mualim III" },
  { value: "kkm", label: "KKM" },
  { value: "masinis_2", label: "Masinis II" },
  { value: "masinis_3", label: "Masinis III" },
  { value: "masinis_4", label: "Masinis IV" },
];

export default function PersonalIdentity({
  onNext,
  onBack,
  assessmentData,
  updateAssessmentData,
}: PersonalIdentityProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: assessmentData.fullName,
      identityNumber: assessmentData.identityNumber,
      rank: assessmentData.rank,
      vesselName: assessmentData.vesselName,
    },
  });

  // Use React Query hook at component level
  const [queryIdentityNumber, setQueryIdentityNumber] = useState<string>("");
  const reportQuery = useGetReportByIdentityNumber(queryIdentityNumber);

  const verifyIdentityNumber = async (identityNumber: string) => {
    if (!identityNumber.trim()) {
      setVerificationError("Nomor identitas harus diisi");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    // Trigger the query by setting the identity number
    setQueryIdentityNumber(identityNumber);
  };

  // Effect to handle query results
  useEffect(() => {
    if (reportQuery.data) {
      const reportData = reportQuery.data;

      // Auto-populate the fields with data from the report
      form.setValue("fullName", reportData.nama || "");
      form.setValue("rank", reportData.jabatan || "");
      form.setValue("vesselName", reportData.vesselName || "");

      setIsVerified(true);
      setVerificationError("");
      setIsVerifying(false);
    } else if (reportQuery.error) {
      const errorMessage =
        reportQuery.error instanceof Error
          ? reportQuery.error.message
          : "Terjadi kesalahan koneksi";

      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setVerificationError("Nomor identitas tidak ditemukan dalam database");
        // Clear the auto-populated fields
        form.setValue("fullName", "");
        form.setValue("rank", "");
        form.setValue("vesselName", "");
      } else {
        setVerificationError(errorMessage);
      }

      setIsVerified(false);
      setIsVerifying(false);
    }

    if (reportQuery.isLoading) {
      setIsVerifying(true);
    }
  }, [reportQuery.data, reportQuery.error, reportQuery.isLoading, form]);

  const handleIdentityNumberChange = (value: string) => {
    form.setValue("identityNumber", value);
    setIsVerified(false);
    setVerificationError("");

    // Clear auto-populated fields when identity number changes
    if (value !== assessmentData.identityNumber) {
      form.setValue("fullName", "");
      form.setValue("rank", "");
      form.setValue("vesselName", "");
    }
  };

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!isVerified) {
      setVerificationError(
        "Silakan verifikasi nomor identitas terlebih dahulu"
      );
      return;
    }
    updateAssessmentData(data);
    onNext();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <div className="flex justify-between items-center mb-6">
            <Image
              width={64}
              height={64}
              src="/images/logo1.png"
              alt="Logo Kiri"
              className="h-16"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold uppercase text-gray-800 mb-2">
                Crew Evaluation System
              </h1>
            </div>
            <Image
              width={64}
              height={64}
              src="/images/logo2.png"
              alt="Logo Kanan"
              className="h-16"
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
                Identitas Diri
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="identityNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Nomor Identitas (NIK Karyawan / KTP / Paspor){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Masukkan nomor identitas"
                            {...field}
                            onChange={(e) =>
                              handleIdentityNumberChange(e.target.value)
                            }
                            className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={() => verifyIdentityNumber(field.value)}
                          disabled={isVerifying || !field.value.trim()}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium disabled:bg-gray-400"
                        >
                          {isVerifying ? "Verifikasi..." : "Verifikasi"}
                        </Button>
                      </div>
                      {verificationError && (
                        <p className="text-sm text-red-600 mt-1">
                          {verificationError}
                        </p>
                      )}
                      {isVerified && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Nomor identitas berhasil diverifikasi
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Nama Lengkap (Sesuai KTP){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama akan terisi otomatis setelah verifikasi nomor identitas"
                          {...field}
                          readOnly={true}
                          className="border-gray-300 bg-gray-50 text-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Rank <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                            <SelectValue placeholder="Rank akan terisi otomatis setelah verifikasi nomor identitas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rankOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vesselName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Nama Vessel / KM <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama vessel akan terisi otomatis setelah verifikasi nomor identitas"
                          {...field}
                          readOnly={true}
                          className="border-gray-300 bg-gray-50 text-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-8">
                <Button
                  type="button"
                  onClick={onBack}
                  variant="outline"
                  className="px-8 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  disabled={!isVerified}
                  className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium disabled:bg-gray-400"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
