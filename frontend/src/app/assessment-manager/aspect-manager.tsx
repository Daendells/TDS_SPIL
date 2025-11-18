"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AspectResponse } from "@/types/aspect";
import { useGetAspectsByAssessmentId, useDeleteAspect } from "./_hooks/useAspect";
import { AspectDialog } from "./aspect-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AspectManagerProps {
  assessmentId: number;
  assessmentName: string;
}

export function AspectManager({ assessmentId, assessmentName }: AspectManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAspect, setEditingAspect] = useState<AspectResponse | null>(null);
  const [deletingAspect, setDeletingAspect] = useState<AspectResponse | null>(null);

  const { data: aspectsData, isLoading, refetch } = useGetAspectsByAssessmentId(assessmentId);
  const deleteAspectMutation = useDeleteAspect();

  const aspects = aspectsData ?? [];
  const totalWeight = aspects.reduce((sum, aspect) => sum + aspect.weight, 0);
  const isWeightValid = totalWeight === 100;

  const handleAdd = () => {
    setEditingAspect(null);
    setDialogOpen(true);
  };

  const handleEdit = (aspect: AspectResponse) => {
    setEditingAspect(aspect);
    setDialogOpen(true);
  };

  const handleDeleteClick = (aspect: AspectResponse) => {
    setDeletingAspect(aspect);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAspect) return;

    try {
      await deleteAspectMutation.mutateAsync(deletingAspect.id);
      toast.success("Aspect berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingAspect(null);
    } catch (error) {
      console.error("Error deleting aspect:", error);
      toast.error("Gagal menghapus aspect");
    }
  };

  if (assessmentId <= 0) {
    return null;
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Aspect Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola aspects untuk {assessmentName}
            </p>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Aspect
          </Button>
        </CardHeader>
        <CardContent>
          {!isWeightValid && aspects.length > 0 && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Total weight: {totalWeight}%. Harus 100% untuk valid.
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Memuat aspects...
            </div>
          ) : aspects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada aspect untuk assessment ini.
              <br />
              <Button
                variant="link"
                onClick={handleAdd}
                className="mt-2"
              >
                Tambah aspect pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="text-center">Weight (%)</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aspects.map((aspect) => (
                  <TableRow key={aspect.id}>
                    <TableCell className="font-medium">{aspect.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={aspect.weight > 0 ? "default" : "secondary"}>
                        {aspect.weight}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {aspect.questionId ? (
                        <Badge variant="outline">Linked</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(aspect)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(aspect)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={isWeightValid ? "default" : "destructive"}>
                      {totalWeight}%
                    </Badge>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AspectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assessmentId={assessmentId}
        aspect={editingAspect}
        onSuccess={() => refetch()}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Aspect</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus aspect &quot;{deletingAspect?.name}&quot;?
              Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
