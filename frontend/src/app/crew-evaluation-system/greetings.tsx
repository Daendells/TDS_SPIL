"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AssessmentData } from "./page";
import Image from "next/image";

interface GreetingsProps {
  onNext: () => void;
  assessmentData: AssessmentData;
  updateAssessmentData: (data: Partial<AssessmentData>) => void;
}

export default function Greetings({
  onNext,
  assessmentData,
  updateAssessmentData,
}: GreetingsProps) {
  const [consent, setConsent] = useState<string>(
    assessmentData.consent ? "ya" : ""
  );

  const handleNext = () => {
    if (consent === "ya") {
      updateAssessmentData({ consent: true });
      onNext();
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

        {/* Welcome Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Salam Hangat!
          </h2>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Asesmen ini merupakan bagian dari{" "}
              <strong>CES (Competency Evaluation System)</strong> yang bertujuan
              untuk memetakan kompetensi awak kapal secara objektif. Hasil dari
              asesmen ini akan digunakan sebagai dasar dalam mendukung program
              pengembangan karier dan peningkatan kualitas sumber daya manusia
              di perusahaan.
            </p>

            <p>
              Dalam asesmen ini, bacalah setiap instruksi dan soal dengan
              teliti, kemudian pilihlah jawaban yang menurut Anda paling sesuai.
              Tidak ada jawaban benar atau salah, sehingga jawablah seluruh
              pertanyaan dengan jujur agar hasilnya dapat mencerminkan gambaran
              diri Anda yang sebenarnya.
            </p>

            <p>
              Seluruh data akan dijaga kerahasiaannya dan hanya digunakan untuk
              kepentingan internal perusahaan. Jika terdapat pertanyaan terkait
              asesmen ini, Anda dapat menghubungi:
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
              <p className="font-medium text-blue-800">
                📧 shiplearningdevelopment.spil@gmail.com
              </p>
            </div>

            <p>
              Atas waktu dan kesediaan Anda dalam mengikuti asesmen ini, kami
              ucapkan terima kasih.
            </p>

            <div className="mt-6 pt-4 border-t">
              <p className="font-medium">Hormat kami,</p>
              <p className="text-gray-600">Recruitment Crew – Fleet Division</p>
              <p className="text-gray-600">PT Salam Pacific Indonesia Lines</p>
            </div>
          </div>
        </div>

        {/* Consent Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h3 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
            Persetujuan Partisipasi
          </h3>

          <div className="space-y-6">
            <p className="text-gray-700">
              Setelah membaca informasi pada bagian sebelumnya, apakah Anda
              bersedia mengikuti asesmen ini dan memberikan respon yang sesuai
              dengan kondisi Anda?
            </p>

            <RadioGroup value={consent} onValueChange={setConsent}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ya" id="consent-yes" />
                <Label htmlFor="consent-yes" className="cursor-pointer">
                  Ya, saya bersedia mengikuti asesmen ini
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-end pt-6">
              <Button
                onClick={handleNext}
                disabled={consent !== "ya"}
                className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
