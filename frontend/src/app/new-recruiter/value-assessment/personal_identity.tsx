"use client";

import { useEffect, useState } from "react";
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
  fullName: z.string().min(1),
  rank: z.string().min(1),
  vesselName: z.string().min(1),
  token: z.string().min(1),
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
  const [queryToken, setQueryToken] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [lastVerifiedToken, setLastVerifiedToken] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const incrementAttemptsMutation = useIncrementAttempts();
  const assignmentQuery = useCheckSeafarerAssignment(queryToken, 1);

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
    setVerificationError("");
    setLastVerifiedToken(queryToken);
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
      assessmentTypeId: 1,
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
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">Identitas Diri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Token <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Masukkan token assessment"
                            {...field}
                            onChange={(e) => handleTokenChange(e.target.value)}
                            className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={() => setQueryToken(field.value)}
                          disabled={assignmentQuery.isLoading || !field.value.trim()}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium disabled:bg-gray-400"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="border-gray-300 bg-gray-50 text-gray-700"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Rank</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="border-gray-300 bg-gray-50 text-gray-700"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vesselName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Akademi Pelayaran</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="border-gray-300 bg-gray-50 text-gray-700"
                        />
                      </FormControl>
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
                  disabled={!isVerified || incrementAttemptsMutation.isPending}
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
