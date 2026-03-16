"use client";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ValueAssessmentData } from "./page";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { GreetingsData, GreetingsSchema } from "@/schemas/value-assesment";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import HeaderSection from "./header_section";

interface GreetingsProps {
  onNext: () => void;
  assessmentData: ValueAssessmentData;
  updateAssessmentData: (data: Partial<ValueAssessmentData>) => void;
  isAssessmentClosed?: boolean;
  closedMessage?: string;
  startTime?: string;
  endTime?: string;
}

export default function Greetings({
  onNext,
  updateAssessmentData,
  isAssessmentClosed = false,
  closedMessage = "",
  startTime = "",
  endTime = "",
}: GreetingsProps) {
  const onSubmit = () => {
    if (watchedValues.consent === "ya") {
      updateAssessmentData({ consent: true, email: watchedValues.email });
      onNext();
    }
  };

  const form = useForm<GreetingsData>({
    resolver: zodResolver(GreetingsSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      consent: "",
    },
  });

  const { handleSubmit, watch } = form;
  const watchedValues = watch();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Section */}
        <HeaderSection title="Value Assessment" />

        {/* Assessment Closed Content */}
        {isAssessmentClosed ? (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="space-y-6">
              {/* Lock Icon */}
              <div className="flex justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500 animate-pulse"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>

              {/* Closed Status */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Assessment Sedang Ditutup</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{closedMessage}</p>
              </div>

              {/* Timeline Info */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
                <h3 className="font-semibold text-gray-800 mb-4">Jadwal Assessment:</h3>
                <div className="space-y-3">
                  {startTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Waktu Mulai:</span>
                      <span className="text-gray-900 font-semibold">{startTime}</span>
                    </div>
                  )}
                  {endTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Waktu Selesai:</span>
                      <span className="text-gray-900 font-semibold">{endTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded">
                <p className="text-amber-900 text-sm leading-relaxed">
                  Silakan kembali lagi pada waktu yang telah ditentukan untuk mengikuti assessment.
                  Jika Anda memiliki pertanyaan atau mengalami kendala, hubungi tim recruitment kami
                  di{" "}
                  <Link
                    href="mailto:recruitment.crewspil@gmail.com"
                    className="font-semibold text-amber-700 hover:text-amber-900 underline"
                  >
                    recruitment.crewspil@gmail.com
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Content */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">VALUE ASSESSMENT</h2>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Value Assessment merupakan asesmen yang dikembangkan untuk memetakan kecenderungan
                  sikap kerja karyawan, khususnya yang berkaitan dengan nilai-nilai inti PT Salam
                  Pacific Indonesia Lines.
                </p>

                <p>
                  Asesmen ini terdiri dari tiga bagian. Bacalah dengan teliti setiap istilah yang
                  ada dan isilah pernyataan dalam kuesioner ini dengan jawaban yang paling sesuai
                  dengan diri Anda. Tidak perlu khawatir, tidak ada jawaban benar dan salah dalam
                  asesmen ini. Seluruh data yang diperoleh dalam asesmen ini akan dijaga
                  kerahasiannya dan hanya akan digunakan untuk kepentingan pengembangan sumber daya
                  manusia. Jika ada pertanyaan dapat menghubungi kontak di bawah ini:
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
                  <Link
                    href={"mailto:recruitment.crewspil@gmail.com"}
                    className="font-medium text-blue-800 flex gap-2 items-center"
                  >
                    <Mail size={16} /> recruitment.crewspil@gmail.com
                  </Link>
                </div>

                <p>
                  Atas ketersediaan Anda dalam meluangkan waktu dan mengisi asesmen ini dengan
                  sungguh-sungguh, saya ucapkan terima kasih.
                </p>

                <div className="mt-6 pt-4 border-t">
                  <p className="font-medium">Hormat Kami,</p>
                  <p className="text-gray-600">Recruitment Crew - Fleet Division PT SPIL</p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Email Section */}
                <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-bold text-xl  text-gray-800 border-b pb-3">
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan email anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Consent Section */}
                <div className="bg-white rounded-lg shadow-sm border p-8">
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-bold text-xl  text-gray-800 border-b pb-3">
                          Persetujuan Partisipasi <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <p className="text-gray-700">
                              Setelah membaca informasi pada bagian sebelumnya, apakah Anda bersedia
                              mengikuti asesmen ini dan memberikan respon yang sesuai dengan kondisi
                              Anda?
                            </p>
                            <RadioGroup value={field.value} onValueChange={field.onChange}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ya" id="consent-yes" />
                                <Label htmlFor="consent-yes" className="cursor-pointer">
                                  YA
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-6">
                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={!form.formState.isValid}
                        className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium"
                      >
                        Berikutnya
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
