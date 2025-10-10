"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ValueAssessmentData } from "./page";

interface GreetingsProps {
  onNext: () => void;
  assessmentData: ValueAssessmentData;
  updateAssessmentData: (data: Partial<ValueAssessmentData>) => void;
}

export default function Greetings({ onNext, assessmentData, updateAssessmentData }: GreetingsProps) {
  const [consent, setConsent] = useState<string>(assessmentData.consent ? "ya" : "");
  const [email, setEmail] = useState<string>(assessmentData.email || "");

  const handleNext = () => {
    if (consent === "ya") {
      updateAssessmentData({ consent: true, email: email });
      onNext();
    }
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

        {/* Welcome Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">VALUE ASSESSMENT</h2>
          
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Value Assessment merupakan asesmen yang dikembangkan untuk memetakan kecenderungan sikap kerja karyawan, 
              khususnya yang berkaitan dengan nilai-nilai inti PT Salam Pacific Indonesia Lines.
            </p>
            
            <p>
              Asesmen ini terdiri dari tiga bagian. Bacalah dengan teliti setiap istilah yang ada dan isilah pernyataan 
              dalam kuesioner ini dengan jawaban yang paling sesuai dengan diri Anda. Tidak perlu khawatir, tidak ada 
              jawaban benar dan salah dalam asesmen ini. Seluruh data yang diperoleh dalam asesmen ini akan dijaga 
              kerahasiannya dan hanya akan digunakan untuk kepentingan pengembangan sumber daya manusia. 
              Jika ada pertanyaan dapat menghubungi kontak di bawah ini:
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
              <p className="font-medium text-blue-800">
                📧 recruitment.crewspil@gmail.com
              </p>
            </div>
            
            <p>
              Atas ketersediaan Anda dalam meluangkan waktu dan mengisi asesmen ini dengan sungguh-sungguh, 
              saya ucapkan terima kasih.
            </p>
            
            <div className="mt-6 pt-4 border-t">
              <p className="font-medium">Hormat Kami,</p>
              <p className="text-gray-600">Recruitment Crew - Fleet Division PT SPIL</p>
            </div>
          </div>
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-3">
          <h3 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
            Email <span className="text-red-500">*</span>
          </h3>
          
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Masukkan email Anda"
            />
          </div>
        </div>

        {/* Consent Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h3 className="font-bold text-xl mb-6 text-gray-800 border-b pb-3">
            Persetujuan Partisipasi <span className="text-red-500">*</span>
          </h3>
          
          <div className="space-y-6">
            <p className="text-gray-700">
              Setelah membaca informasi pada bagian sebelumnya, apakah Anda bersedia mengikuti asesmen ini 
              dan memberikan respon yang sesuai dengan kondisi Anda?
            </p>
            
            <RadioGroup value={consent} onValueChange={setConsent}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ya" id="consent-yes" />
                <Label htmlFor="consent-yes" className="cursor-pointer">
                  YA
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