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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ValueAssessmentData } from "./page";

const FormSchema = z.object({
  fullName: z.string().min(1, { message: "Nama lengkap harus diisi" }),
  identityNumber: z.string().min(1, { message: "Nomor identitas harus diisi" }),
  rank: z.string().min(1, { message: "Rank harus dipilih" }),
  vesselName: z.string().min(1, { message: "Nama vessel/akademi harus diisi" }),
});

interface PersonalIdentityProps {
  onNext: () => void;
  onBack: () => void;
  assessmentData: ValueAssessmentData;
  updateAssessmentData: (data: Partial<ValueAssessmentData>) => void;
}

const rankOptions = [
  { value: "nakhoda", label: "Nakhoda" },
  { value: "mualim_1", label: "Mualim I" },
  { value: "mualim_2", label: "Mualim II" },
  { value: "mualim_3", label: "Mualim III" },
  { value: "kkm", label: "KKM" },
  { value: "masinis_2", label: "Masinis II" },
  { value: "masinis_3", label: "Masinis III" },
  { value: "masinis_4", label: "Masinis IV" },
  { value: "rating", label: "Rating" },
  { value: "kadet_deck", label: "Kadet Deck" },
  { value: "kadet_engine", label: "Kadet Engine" },
];

export default function PersonalIdentity({ onNext, onBack, assessmentData, updateAssessmentData }: PersonalIdentityProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: assessmentData.fullName,
      identityNumber: assessmentData.identityNumber,
      rank: assessmentData.rank,
      vesselName: assessmentData.vesselName,
    },
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    updateAssessmentData(data);
    onNext();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <div className="flex justify-between items-center mb-6">
            <img src="/images/logo1.png" alt="Logo Kiri" className="h-16" />
            <div className="text-center">
              <h1 className="text-3xl font-bold uppercase text-gray-800 mb-2">
                Value Assessment
              </h1>
            </div>
            <img src="/images/logo2.png" alt="Logo Kanan" className="h-16" />
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
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Nama Lengkap (Sesuai KTP) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan nama lengkap sesuai KTP" 
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
                  name="identityNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-medium text-gray-700">
                        Nomor Identitas (KTP / Passport / NIK Karyawan) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan nomor identitas" 
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
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">
                        Rank <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                            <SelectValue placeholder="Pilih rank" />
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
                        Nama Vessel / Nama Akademi Pelayaran <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan nama vessel atau akademi pelayaran" 
                          {...field} 
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500" 
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
                  className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium"
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