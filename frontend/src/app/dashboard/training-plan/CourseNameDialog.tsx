"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CourseNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (courseName: string) => void;
  isLoading: boolean;
  competencyCode: string;
  trainingMaterial: string;
}

export default function CourseNameDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  competencyCode,
  trainingMaterial,
}: CourseNameDialogProps) {
  const [courseName, setCourseName] = useState("");

  const handleSubmit = () => {
    if (courseName.trim()) {
      onSubmit(courseName.trim());
      setCourseName("");
    }
  };

  const handleCancel = () => {
    setCourseName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Activate Training - Course Name Required</DialogTitle>
          <DialogDescription>
            Enter the course name that will be sent for tracking training completion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Competency</Label>
            <div className="rounded-md bg-muted px-3 py-2 text-sm">{competencyCode}</div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Training Material</Label>
            <div className="rounded-md bg-muted px-3 py-2 text-sm">{trainingMaterial}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-name" className="text-sm font-medium">
              Course Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="course-name"
              placeholder="e.g., GARBAGE & WASTE MANAGEMENT"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              This name must match exactly with the course name in the system
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!courseName.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activate Training
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
