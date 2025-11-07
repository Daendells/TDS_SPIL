"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetCompetencyMappings,
  useGetAllTrainings,
  useUpdateCompetencyMapping,
  useCreateCompetencyMapping,
  useDeleteCompetencyMapping,
  type CompetencyMappingFormData,
  type CompetencyMappingItem,
  type Training,
} from "./_hooks/useCompetencyMappingCMS";

interface CompetencyMappingCMSProps {
  program: string;
}

export default function CompetencyMappingCMS({ program }: CompetencyMappingCMSProps) {
  const [editingMapping, setEditingMapping] = useState<CompetencyMappingItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<CompetencyMappingFormData>({
    competencyCode: "",
    program: program,
    trainingMaterial1Id: null,
    trainingMaterial2Id: null,
    category: "M",
  });

  // React Query hooks
  const { data: mappings, isLoading: mappingsLoading } = useGetCompetencyMappings(program);
  const { data: trainings, isLoading: trainingsLoading } = useGetAllTrainings();
  const updateMutation = useUpdateCompetencyMapping();
  const createMutation = useCreateCompetencyMapping();
  const deleteMutation = useDeleteCompetencyMapping();

  // Handle edit click
  const handleEdit = (mapping: CompetencyMappingItem) => {
    setEditingMapping(mapping);
    setFormData({
      competencyCode: mapping.competencyCode,
      program: mapping.program,
      trainingMaterial1Id: mapping.trainingMaterial1Id,
      trainingMaterial2Id: mapping.trainingMaterial2Id,
      category: mapping.category,
    });
    setIsEditDialogOpen(true);
  };

  // Handle create new mapping
  const handleCreateNew = () => {
    setFormData({
      competencyCode: "",
      program: program,
      trainingMaterial1Id: null,
      trainingMaterial2Id: null,
      category: "M",
    });
    setIsCreateDialogOpen(true);
  };

  // Handle update submit
  const handleUpdateSubmit = async () => {
    if (!editingMapping) return;

    try {
      await updateMutation.mutateAsync({
        id: editingMapping.id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      setEditingMapping(null);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  // Handle create submit
  const handleCreateSubmit = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  // Handle delete
  const handleDelete = (mapping: CompetencyMappingItem) => {
    setDeletingId(mapping.id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;

    try {
      await deleteMutation.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (mappingsLoading || trainingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Competency Mapping</h3>
          <p className="text-sm text-muted-foreground">
            Manage competency-to-training mappings for {program} program
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Mapping
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competency Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Training Material 1</TableHead>
              <TableHead>Training Material 2</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings && mappings.length > 0 ? (
              mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">
                    {mapping.competencyCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant={mapping.category === "M" ? "destructive" : "secondary"}>
                      {mapping.category === "M" ? "Mandatory" : "Non-Mandatory"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {mapping.trainingMaterial1?.topik_training || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.trainingMaterial2?.topik_training || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(mapping)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(mapping)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No competency mappings found for {program} program
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Competency Mapping</DialogTitle>
            <DialogDescription>
              Update training materials for {formData.competencyCode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Competency Code</Label>
              <Input
                value={formData.competencyCode}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Training Material 1</Label>
              <Select
                value={formData.trainingMaterial1Id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trainingMaterial1Id: value !== "none" ? parseInt(value) : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {trainings?.map((training) => (
                    <SelectItem key={training.no} value={training.no.toString()}>
                      {training.topik_training} ({training.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Training Material 2</Label>
              <Select
                value={formData.trainingMaterial2Id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trainingMaterial2Id: value !== "none" ? parseInt(value) : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {trainings?.map((training) => (
                    <SelectItem key={training.no} value={training.no.toString()}>
                      {training.topik_training} ({training.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Competency Mapping</DialogTitle>
            <DialogDescription>
              Add a new competency training mapping for {program}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Competency Code</Label>
              <Input
                placeholder="e.g. LDC, ACH, COM"
                value={formData.competencyCode}
                onChange={(e) =>
                  setFormData({ ...formData, competencyCode: e.target.value.toUpperCase() })
                }
              />
              <p className="text-xs text-muted-foreground">
                Category (Mandatory/Non-Mandatory) is automatically calculated based on gap percentage (&gt;60% = Mandatory)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Training Material 1</Label>
              <Select
                value={formData.trainingMaterial1Id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trainingMaterial1Id: value !== "none" ? parseInt(value) : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {trainings?.map((training) => (
                    <SelectItem key={training.no} value={training.no.toString()}>
                      {training.topik_training} ({training.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Training Material 2</Label>
              <Select
                value={formData.trainingMaterial2Id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trainingMaterial2Id: value !== "none" ? parseInt(value) : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {trainings?.map((training) => (
                    <SelectItem key={training.no} value={training.no.toString()}>
                      {training.topik_training} ({training.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending || !formData.competencyCode}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Competency Mapping</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mapping? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
