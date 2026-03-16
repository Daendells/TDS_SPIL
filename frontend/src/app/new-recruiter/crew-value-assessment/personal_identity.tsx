"use client";

import { useEffect, useState } from "react";
import { useCheckSeafarerAssignment } from "./_hooks/useCheckSeafarerAssignment";
import { useIncrementAttempts } from "./_hooks/useIncrementAttempts";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CESAssessmentData } from "./types";
import HeaderSection from "./header_section";

const FormSchema = z.object({
  fullName: z.string().min(1),
  rank: z.string().min(1),
  vesselName: z.string().min(1),
  token: z.string().min(1),
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
  const [queryToken, setQueryToken] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [lastVerifiedToken, setLastVerifiedToken] = useState("");
  const assignmentQuery = useCheckSeafarerAssignment(queryToken, 2, role);
  const incrementAttemptsMutation = useIncrementAttempts();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: assessmentData.fullName,
      rank: assessmentData.rank,
      vesselName: assessmentData.vesselName,
      token: assessmentData.token,
    },
  });

  useEffect(() => {
    if (!assignmentQuery.data) {
      if (assignmentQuery.error) {
        setVerificationError(
          assignmentQuery.error instanceof Error
            ? assignmentQuery.error.message
            : "Terjadi kesalahan saat verifikasi token."
        );
        setIsVerified(false);
      }
      return;
    }

    const data = assignmentQuery.data;
    if (!data.personalData) {
      setVerificationError(data.message || "Data new recruiter tidak ditemukan.");
      setIsVerified(false);
      return;
    }

    form.setValue("fullName", data.personalData.nama || "");
    form.setValue("rank", data.personalData.rank || "");
    form.setValue("vesselName", data.personalData.academyName || "");
    updateAssessmentData({
      token: queryToken,
      seafarerCode: data.personalData.seafarerCode || "",
    });
    setLastVerifiedToken(queryToken);
    setVerificationError("");
    setIsVerified(true);
  }, [assignmentQuery.data, assignmentQuery.error, form, queryToken, updateAssessmentData]);

  const handleTokenChange = (value: string) => {
    form.setValue("token", value);
    updateAssessmentData({ token: value });
    if (value !== lastVerifiedToken) {
      setIsVerified(false);
      setVerificationError("");
      form.setValue("fullName", "");
      form.setValue("rank", "");
      form.setValue("vesselName", "");
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!isVerified) {
      setVerificationError("Silakan verifikasi token terlebih dahulu");
      return;
    }

    await incrementAttemptsMutation.mutateAsync({
      token: data.token,
      assessmentTypeId: 2,
    });

    updateAssessmentData({
      token: data.token,
      fullName: data.fullName,
      rank: data.rank,
      vesselName: data.vesselName,
    });
    onNext();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <HeaderSection
          title="Crew Evaluation System"
          subtitle={role.replace(/_/g, " ").toUpperCase()}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">Identitas Diri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Token</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} onChange={(e) => handleTokenChange(e.target.value)} />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={() => setQueryToken(field.value)}
                          disabled={!field.value.trim() || assignmentQuery.isLoading}
                        >
                          {assignmentQuery.isLoading ? "Verifikasi..." : "Verifikasi"}
                        </Button>
                      </div>
                      {verificationError && (
                        <p className="text-sm text-red-600 mt-1">{verificationError}</p>
                      )}
                      {isVerified && (
                        <p className="text-sm text-green-600 mt-1">Token berhasil diverifikasi</p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rank</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vesselName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Akademi Pelayaran</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-between pt-8">
                <Button type="button" onClick={onBack} variant="outline">
                  Kembali
                </Button>
                <Button type="submit" disabled={!isVerified || incrementAttemptsMutation.isPending}>
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
