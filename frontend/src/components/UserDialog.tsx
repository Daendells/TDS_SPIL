"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useCreateUser, useUpdateUser } from "@/hooks/useUserManagement";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const createUserSchema = z.object({
  username: z.string().min(3, "Username min 3 karakter").max(100),
  password: z.string().min(6, "Password min 6 karakter"),
  role: z.enum(["admin", "viewer"]),
});

const updateUserSchema = z.object({
  username: z.string().min(3, "Username min 3 karakter").max(100),
  password: z.string().min(6, "Password min 6 karakter").optional().or(z.literal("")),
  role: z.enum(["admin", "viewer"]),
});

export interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  defaultValues?: {
    id: number;
    username: string;
    password?: string;
    role: string;
  };
}

export function UserDialog({ open, onOpenChange, isEdit = false, defaultValues }: UserDialogProps) {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  const schema = isEdit ? updateUserSchema : createUserSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: defaultValues?.username || "",
      password: "",
      role: (defaultValues?.role as "admin" | "viewer") || "viewer",
    },
  });

  // Reset form when defaultValues changes or dialog opens in edit mode
  React.useEffect(() => {
    if (open && isEdit && defaultValues) {
      form.reset({
        username: defaultValues.username,
        password: "",
        role: (defaultValues.role as "admin" | "viewer") || "viewer",
      });
    } else if (open && !isEdit) {
      form.reset({
        username: "",
        password: "",
        role: "viewer",
      });
    }
  }, [open, isEdit, defaultValues, form]);

  // Auto-focus on password field when in edit mode
  React.useEffect(() => {
    if (isEdit && open) {
      setTimeout(() => {
        const passwordInput = document.querySelector("input[type='password']") as HTMLInputElement;
        if (passwordInput) passwordInput.focus();
      }, 100);
    }
  }, [isEdit, open]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      if (isEdit && defaultValues) {
        const updateData: { username: string; role: "admin" | "viewer"; password?: string } = {
          username: values.username,
          role: values.role,
        };
        if (values.password) {
          updateData.password = values.password;
        }
        await updateUserMutation.mutateAsync({
          id: defaultValues.id,
          data: updateData,
        });
        toast.success("User berhasil diupdate");
      } else {
        await createUserMutation.mutateAsync(
          values as { username: string; password: string; role: "admin" | "viewer" }
        );
        toast.success("User berhasil dibuat");
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Buat User Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update informasi user dan hak akses"
              : "Buat user baru dengan username, password, dan hak akses"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password {isEdit && "(kosongkan jika tidak ingin diubah)"}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role / Hak Akses</FormLabel>
                  <FormControl>
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value as "admin" | "viewer")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer (View-Only, tidak bisa edit data)</option>
                      <option value="admin">Admin (Full Access & User Management)</option>
                    </select>
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
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
