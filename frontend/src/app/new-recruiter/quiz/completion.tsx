"use client";

import { CheckCircle } from "lucide-react";

interface CompletionProps {
  assessmentTypeName: string;
  seamanCode: string;
  email: string;
}

export default function Completion({ assessmentTypeName, seamanCode, email }: CompletionProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Quiz Selesai</h1>
            <p className="text-gray-700">{assessmentTypeName} berhasil dikirim.</p>
            <p className="text-sm text-gray-500 mt-4">Seafarer Code: {seamanCode || "-"}</p>
            <p className="text-sm text-gray-500">Email: {email || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
