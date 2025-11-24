"use client";

import { useState, useEffect } from "react";
import { useCheckSeafarerAssignment } from "./_hooks/useCheckSeafarerAssignment";
import { useIncrementAttempts } from "./_hooks/useIncrementAttempts";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ValueAssessmentData } from "./page";
import Image from "next/image";

const FormSchema = z.object({
  fullName: z.string().min(1, { message: "Nama lengkap harus diisi" }),
  rank: z.string().min(1, { message: "Rank harus dipilih" }),
  vesselName: z.string().min(1, { message: "Nama vessel/akademi harus diisi" }),
  seafarerCode: z.string().min(1, { message: "Seafarer code harus diisi" }),
});

interface PersonalIdentityProps {
  onNext: () => void;
  onBack: () => void;
  assessmentData: ValueAssessmentData;
  updateAssessmentData: (data: Partial<ValueAssessmentData>) => void;
}

export default function PersonalIdentity({
  onNext,
  onBack,
  assessmentData,
  updateAssessmentData,
}: PersonalIdentityProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [lastVerifiedSeafarerCode, setLastVerifiedSeafarerCode] = useState<string>("");

  // Mutation for incrementing attempts
  const incrementAttemptsMutation = useIncrementAttempts();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: assessmentData.fullName,
      rank: assessmentData.rank,
      vesselName: assessmentData.vesselName,
      seafarerCode: assessmentData.seafarerCode,
    },
  });

  // State for checking assignment
  const [querySeafarerCode, setQuerySeafarerCode] = useState<string>("");
  const [queryAssessmentTypeId, setQueryAssessmentTypeId] = useState<number>(0);

  const assignmentQuery = useCheckSeafarerAssignment(querySeafarerCode, queryAssessmentTypeId);

  const verifySeafarerCode = async (seafarerCode: string) => {
    if (!seafarerCode.trim()) {
      setVerificationError("Seafarer code harus diisi");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    // Trigger the query by setting the seafarer code and assessment type (hardcoded to 1)
    setQuerySeafarerCode(seafarerCode);
    setQueryAssessmentTypeId(1);
  };

  // Effect to handle query results
  useEffect(() => {
    if (assignmentQuery.data) {
      const data = assignmentQuery.data;

      if (!data.isAssigned) {
        setVerificationError(
          data.message || "Anda tidak diassign untuk assessment ini. Silakan hubungi administrator."
        );
        // Clear the auto-populated fields
        form.setValue("fullName", "");
        form.setValue("rank", "");
        form.setValue("vesselName", "");
        setIsVerified(false);
        setIsVerifying(false);
        return;
      }

      // If assigned but no personal data found
      if (!data.personalData) {
        setVerificationError(
          "Data pribadi tidak ditemukan. Silakan hubungi administrator untuk memperbarui data Anda."
        );
        // Clear the auto-populated fields
        form.setValue("fullName", "");
        form.setValue("rank", "");
        form.setValue("vesselName", "");
        setIsVerified(false);
        setIsVerifying(false);
        return;
      }

      // Check if attempts have been exceeded
      if (data.maxAttempts !== null && data.attemptsCount >= data.maxAttempts) {
        setVerificationError(
          `Anda sudah melebihi batas maksimal attempts (${data.attemptsCount}/${data.maxAttempts}). Hubungi administrator untuk bantuan lebih lanjut.`
        );
        // Clear the auto-populated fields
        form.setValue("fullName", "");
        form.setValue("rank", "");
        form.setValue("vesselName", "");
        setIsVerified(false);
        setIsVerifying(false);
        return;
      }

      // If assigned and personal data exists, populate fields
      form.setValue("fullName", data.personalData.nama || "");
      form.setValue("rank", data.personalData.jabatan || "");
      form.setValue("vesselName", data.personalData.vesselName || "");

      setIsVerified(true);
      setLastVerifiedSeafarerCode(querySeafarerCode);
      setVerificationError("");
      setIsVerifying(false);
    } else if (assignmentQuery.error) {
      const errorMessage =
        assignmentQuery.error instanceof Error
          ? assignmentQuery.error.message
          : "Terjadi kesalahan koneksi";

      setVerificationError(errorMessage);
      setIsVerified(false);
      setIsVerifying(false);
    }

    if (assignmentQuery.isLoading) {
      setIsVerifying(true);
    }
  }, [
    assignmentQuery.data,
    assignmentQuery.error,
    assignmentQuery.isLoading,
    form,
    querySeafarerCode,
  ]);

  const handleSeafarerCodeChange = (value: string) => {
    form.setValue("seafarerCode", value);

    // If seafarer code changed from the last verified one, reset verification
    if (value !== lastVerifiedSeafarerCode) {
      setIsVerified(false);
      setVerificationError("");
      // Clear auto-populated fields when seafarer code changes
      form.setValue("fullName", "");
      form.setValue("rank", "");
      form.setValue("vesselName", "");
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!isVerified) {
      setVerificationError("Silakan verifikasi seafarer code terlebih dahulu");
      return;
    }

    try {
      // Increment attempts count
      await incrementAttemptsMutation.mutateAsync({
        seafarerCode: data.seafarerCode,
        assessmentTypeId: 1,
      });

      // Update assessment data and move to next step
      updateAssessmentData(data);
      onNext();
    } catch (error) {
      console.error("Error incrementing attempts:", error);
      setVerificationError("Terjadi kesalahan saat memulai test. Silakan coba lagi.");
    }
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
              className="h-10 w-auto md:h-16"
            />
            <div className="text-center">
              <h1 className="text-lg md:text-3xl font-bold uppercase text-gray-800 mb-2">
                Value Assessment
              </h1>
            </div>
            <Image
              width={64}
              height={64}
              src="/images/logo2.png"
              alt="Logo Kanan"
              className="h-10 w-auto md:h-16"
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">Identitas Diri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="seafarerCode"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Seafarer Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Masukkan seafarer code"
                            {...field}
                            onChange={(e) => handleSeafarerCodeChange(e.target.value)}
                            className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={() => verifySeafarerCode(field.value)}
                          disabled={isVerifying || !field.value.trim()}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium disabled:bg-gray-400"
                        >
                          {isVerifying ? "Verifikasi..." : "Verifikasi"}
                        </Button>
                      </div>
                      {verificationError && (
                        <p className="text-sm text-red-600 mt-1">
                          User tidak ditemukan atau tidak diassign
                        </p>
                      )}
                      {isVerified && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Seafarer code berhasil diverifikasi
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
                        Nama Lengkap <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama akan terisi otomatis setelah verifikasi seaman code"
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
                      <FormControl>
                        <Input
                          placeholder="Rank akan terisi otomatis setelah verifikasi seaman code"
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
                  name="vesselName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Nama Vessel / Nama Akademi Pelayaran <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama vessel akan terisi otomatis setelah verifikasi seaman code"
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
                  className={`px-8 py-2 text-white font-medium ${
                    isVerified
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Mulai Test
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
