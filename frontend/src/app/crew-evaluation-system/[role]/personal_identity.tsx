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
import { CESAssessmentData } from "../types";
import HeaderSection from "./header_section";

const FormSchema = z.object({
  fullName: z.string().min(1, { message: "Nama lengkap harus diisi" }),
  rank: z.string().min(1, { message: "Rank harus dipilih" }),
  vesselName: z.string().min(1, { message: "Nama vessel/akademi harus diisi" }),
  seafarerCode: z.string().min(1, { message: "Seafarer code harus diisi" }),
});

interface PersonalIdentityProps {
  onNext: () => void;
  onBack: () => void;
  assessmentData: CESAssessmentData;
  updateAssessmentData: (data: Partial<CESAssessmentData>) => void;
  role: string;
}

export default function PersonalIdentity({
  onNext,
  onBack,
  assessmentData,
  updateAssessmentData,
  role,
}: PersonalIdentityProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [lastVerifiedSeafarerCode, setLastVerifiedSeafarerCode] =
    useState<string>("");

  const formatRoleName = (roleSlug: string) => {
    return roleSlug
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
  const [queryRole, setQueryRole] = useState<string>("");

  const assignmentQuery = useCheckSeafarerAssignment(
    querySeafarerCode,
    queryAssessmentTypeId,
    queryRole
  );

  const verifySeafarerCode = async (seafarerCode: string) => {
    if (!seafarerCode.trim()) {
      setVerificationError("Seafarer code harus diisi");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    // Trigger the query by setting the seafarer code and assessment type (using ID 2 for CES)
    setQuerySeafarerCode(seafarerCode);
    setQueryAssessmentTypeId(2);
    setQueryRole(role);
  };

  // Effect to handle query results
  useEffect(() => {
    if (assignmentQuery.data) {
      const data = assignmentQuery.data;

      if (!data.isAssigned) {
        setVerificationError(
          data.message ||
            "Anda tidak diassign untuk assessment ini. Silakan hubungi administrator."
        );
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
      // Increment attempts count (using ID 2 for CES)
      await incrementAttemptsMutation.mutateAsync({
        seafarerCode: data.seafarerCode,
        assessmentTypeId: 2,
      });

      // Update assessment data and move to next step
      updateAssessmentData(data);
      onNext();
    } catch (error) {
      console.error("Error incrementing attempts:", error);
      setVerificationError(
        "Terjadi kesalahan saat memulai test. Silakan coba lagi."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Section */}
        <HeaderSection
          title="Crew Evaluation System"
          subtitle={formatRoleName(role)}
        />

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
                            onChange={(e) =>
                              handleSeafarerCodeChange(e.target.value)
                            }
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
                          Seafarer code berhasil diverifikasi
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
                          placeholder="Nama akan terisi otomatis setelah verifikasi seafarer code"
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
                          placeholder="Rank akan terisi otomatis setelah verifikasi seafarer code"
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
                        Nama Vessel / Nama Akademi Pelayaran{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama vessel akan terisi otomatis setelah verifikasi seafarer code"
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
