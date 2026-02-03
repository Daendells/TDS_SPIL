"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, AlertCircle, Plus, ExternalLink, Calculator } from "lucide-react";
import { useGetAllAssessmentTypes, AssessmentType } from "./_hooks/useAssessmentType";
import AssessmentTypeEditDialog from "./assessment-type-edit-dialog";
import AssessmentAssignmentDialog from "./assessment-assignment-dialog";
import ScoringConfigDialog from "./scoring-config-dialog";
import Image from "next/image";
import Link from "next/link";

export default function AssessmentTypeAdmin() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [scoringConfigDialogOpen, setScoringConfigDialogOpen] = useState(false);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentType | null>(null);

  const { data: assessmentTypes, isLoading, error } = useGetAllAssessmentTypes();

  const handleEditClick = (assessmentType: AssessmentType) => {
    setSelectedAssessmentType(assessmentType);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedAssessmentType(null);
  };

  const handleAssignmentClick = (assessmentType: AssessmentType) => {
    setSelectedAssessmentType(assessmentType);
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentDialogClose = () => {
    setAssignmentDialogOpen(false);
    setSelectedAssessmentType(null);
  };

  const handleScoringConfigClick = (assessmentType: AssessmentType) => {
    setSelectedAssessmentType(assessmentType);
    setScoringConfigDialogOpen(true);
  };

  const handleScoringConfigDialogClose = () => {
    setScoringConfigDialogOpen(false);
    setSelectedAssessmentType(null);
  };

  const handleCreateClick = () => {
    setSelectedAssessmentType(null);
    setEditDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isAssessmentActive = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return false;
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };

  const getAssessmentLink = (name: string, id: number) => {
    const lowerName = name.trim().toLowerCase();
    if (lowerName === "value assessment") {
      return "/value-assessment";
    }
    if (lowerName === "ces") {
      return "/crew-evaluation-system";
    }
    return `/quiz/${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Image
            width={64}
            height={64}
            src="/images/logo1.png"
            alt="Logo Kiri"
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment Activation</h1>
            <p className="text-gray-500 mt-1">
              Kelola tanggal, durasi, dan maksimal attempts untuk setiap assessment
            </p>
          </div>
          <Image
            width={64}
            height={64}
            src="/images/logo2.png"
            alt="Logo Kanan"
            className="h-12 w-auto ml-auto"
          />
        </div>
        <div className="flex justify-end mb-4">
          <Button onClick={handleCreateClick} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Buat Assessment Type Baru
          </Button>
        </div>
        <Separator />
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Assessment Types</CardTitle>
          <CardDescription>Kelola pengaturan untuk setiap jenis assessment</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">Gagal memuat assessment types</p>
                <p className="text-sm text-red-700">Silakan coba lagi nanti</p>
              </div>
            </div>
          ) : !assessmentTypes || assessmentTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada assessment types ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Assessment</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Tanggal Berakhir</TableHead>
                    <TableHead>Max Attempts</TableHead>
                    <TableHead>Assigned Assessments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentTypes.map((assessmentType) => {
                    const isActive = isAssessmentActive(
                      assessmentType.startTime,
                      assessmentType.endTime
                    );
                    const hasNotStarted =
                      assessmentType.startTime && new Date(assessmentType.startTime) > new Date();
                    const hasEnded =
                      assessmentType.endTime && new Date(assessmentType.endTime) < new Date();

                    return (
                      <TableRow key={assessmentType.id}>
                        <TableCell className="font-medium">
                          {assessmentType.assessmentTypeName}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                            <Link
                              href={getAssessmentLink(
                                assessmentType.assessmentTypeName,
                                assessmentType.id
                              )}
                              target="_blank"
                            >
                              Buka
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell>{formatDate(assessmentType.startTime)}</TableCell>
                        <TableCell>{formatDate(assessmentType.endTime)}</TableCell>
                        <TableCell>{assessmentType.maxAttempts || "-"}</TableCell>
                        <TableCell>
                          {assessmentType.assignedAssessments &&
                          assessmentType.assignedAssessments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assessmentType.assignedAssessments.map((assessmentName, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-slate-50"
                                >
                                  {assessmentName}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Tidak ada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isActive && <Badge className="bg-green-100 text-green-800">Aktif</Badge>}
                          {hasNotStarted && (
                            <Badge className="bg-blue-100 text-blue-800">Belum Dimulai</Badge>
                          )}
                          {hasEnded && (
                            <Badge className="bg-gray-100 text-gray-800">Sudah Berakhir</Badge>
                          )}
                          {!assessmentType.startTime && !assessmentType.endTime && (
                            <Badge className="bg-gray-100 text-gray-800">Tidak Ada Jadwal</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScoringConfigClick(assessmentType)}
                              className="hover:bg-purple-50 text-purple-600"
                              title="Configure Scoring"
                            >
                              <Calculator className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignmentClick(assessmentType)}
                              className="hover:bg-blue-50 text-blue-600"
                              title="Kelola Assessment"
                            >
                              Kelola
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(assessmentType)}
                              className="hover:bg-gray-100"
                              title="Edit Assessment Type"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            • <span className="font-medium">Status Aktif:</span> Assessment sudah dimulai dan belum
            berakhir
          </p>
          <p>
            • <span className="font-medium">Belum Dimulai:</span> Assessment belum mencapai tanggal
            mulai
          </p>
          <p>
            • <span className="font-medium">Sudah Berakhir:</span> Assessment sudah melewati tanggal
            akhir
          </p>
          <p>
            • <span className="font-medium">Max Attempts:</span> Batas maksimal user dapat mencoba
            assessment
          </p>
          <p>
            • <span className="font-medium">Configure Scoring:</span> Atur cara menghitung skor
            (default/custom formula)
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AssessmentTypeEditDialog
        open={editDialogOpen}
        assessmentType={selectedAssessmentType}
        onOpenChange={handleEditDialogClose}
      />

      {/* Assignment Dialog */}
      {selectedAssessmentType && (
        <AssessmentAssignmentDialog
          open={assignmentDialogOpen}
          onOpenChange={handleAssignmentDialogClose}
          assessmentTypeId={selectedAssessmentType.id}
          assessmentTypeName={selectedAssessmentType.assessmentTypeName}
        />
      )}

      {/* Scoring Configuration Dialog */}
      {selectedAssessmentType && (
        <ScoringConfigDialog
          open={scoringConfigDialogOpen}
          onOpenChange={handleScoringConfigDialogClose}
          assessmentTypeId={selectedAssessmentType.id}
          assessmentTypeName={selectedAssessmentType.assessmentTypeName}
        />
      )}
    </div>
  );
}
