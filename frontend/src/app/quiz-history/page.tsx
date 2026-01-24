"use client";

import { useState } from "react";
import { useGetQuizHistory } from "@/app/quiz/_hooks/useQuiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function QuizHistoryPage() {
  const [seafarerCode, setSeafarerCode] = useState("");
  const [debouncedCode, setDebouncedCode] = useState("");

  const { data: attempts, isLoading, error } = useGetQuizHistory(debouncedCode);

  const handleSearch = () => {
    setDebouncedCode(seafarerCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Assessment</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Cari berdasarkan Seafarer Code..."
            value={seafarerCode}
            onChange={(e) => setSeafarerCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-[300px]"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Cari
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Percobaan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Gagal memuat riwayat. Silakan coba lagi.
            </div>
          ) : !attempts || attempts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {debouncedCode
                ? "Tidak ada riwayat ditemukan untuk kode tersebut."
                : "Masukkan Seaman Code untuk melihat riwayat atau lihat semua (jika admin)."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seafarer Code</TableHead>
                  <TableHead>Tipe Assessment</TableHead>
                  <TableHead>Waktu Selesai</TableHead>
                  <TableHead>Skor</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">{attempt.seamanCode}</TableCell>
                    <TableCell>{attempt.assessmentTypeName}</TableCell>
                    <TableCell>{attempt.completedAtFormatted}</TableCell>
                    <TableCell>
                      <Badge
                        variant={attempt.percentageScore >= 70 ? "default" : "secondary"}
                        className={
                          attempt.percentageScore >= 70
                            ? "bg-green-600"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }
                      >
                        {attempt.percentageScore.toFixed(1)}% ({attempt.totalScore}/
                        {attempt.maxScore})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/quiz-history/${attempt.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
