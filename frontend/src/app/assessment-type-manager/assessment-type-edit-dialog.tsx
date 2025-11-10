"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateAssessmentType,
  AssessmentType,
  AssessmentTypeUpdateRequest,
} from "./_hooks/useAssessmentType";

const FormSchema = z.object({
  assessmentTypeName: z.string().min(3, { message: "Minimal 3 karakter" }),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  maxAttempts: z
    .number()
    .min(1, { message: "Minimal 1 attempt" })
    .optional()
    .nullable(),
});

interface AssessmentTypeEditDialogProps {
  open: boolean;
  assessmentType: AssessmentType | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AssessmentTypeEditDialog({
  open,
  assessmentType,
  onOpenChange,
  onSuccess,
}: AssessmentTypeEditDialogProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateAssessmentType();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      assessmentTypeName: "",
      startTime: undefined,
      endTime: undefined,
      maxAttempts: undefined,
    },
  });

  useEffect(() => {
    if (assessmentType && open) {
      form.reset({
        assessmentTypeName: assessmentType.assessmentTypeName,
        startTime: assessmentType.startTime
          ? assessmentType.startTime.split("T")[0]
          : "",
        endTime: assessmentType.endTime
          ? assessmentType.endTime.split("T")[0]
          : "",
        maxAttempts: assessmentType.maxAttempts || undefined,
      });
    }
  }, [assessmentType, open, form]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!assessmentType) return;

    setIsLoading(true);
    try {
      const payload: AssessmentTypeUpdateRequest = {
        id: assessmentType.id,
        assessmentTypeName: data.assessmentTypeName,
        startTime: data.startTime
          ? new Date(data.startTime).toISOString()
          : undefined,
        endTime: data.endTime
          ? new Date(data.endTime).toISOString()
          : undefined,
        maxAttempts: data.maxAttempts || undefined,
      };

      await updateMutation.mutateAsync(payload);

      toast.success("Assessment type berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["assessment-types"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating assessment type:", error);
      toast.error("Gagal memperbarui assessment type");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Assessment Type</DialogTitle>
          <DialogDescription>
            Ubah informasi assessment type berikut
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assessmentTypeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Assessment Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: VA 1, VA 2, etc"
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
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Mulai</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Berakhir</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimal Attempts</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Berapa kali user bisa mencoba?"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
