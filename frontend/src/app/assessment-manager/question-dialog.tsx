"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { useUploadAssessmentImage } from "./_hooks/useAssessment";
import { useGetAspectsByAssessmentId } from "./_hooks/useAspect";
import { AspectResponse } from "@/types/aspect";

interface Option {
  optionId?: number;
  optionLetter: string;
  optionText: string;
  score: number;
  isImage: number;
  imageUrl?: string;
  imageFile?: File | null;
  imagePreview?: string;
  action?: "create" | "update" | "delete"; // Track operation type
  isNew?: boolean; // Track if this is a newly added option
}

interface Question {
  questionId?: number;
  assessmentId: number;
  questionText: string;
  category?: string;
  isImage?: string;
  imageUrl?: string;
  options?: Option[];
  aspectId?: number;
}

interface QuestionDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  question?: Question | null;
  assessmentId: number;
  role: string; // Keep for backward compatibility with getRoleDefaults
  categories: string[];
}

const getRoleDefaults = (role: string) => {
  switch (role) {
    case "va_1":
      return {
        optionCount: 3,
        optionLetters: ["a", "b", "c"],
        defaultScores: [4, 2, 0],
        defaultTexts: ["Opsi A", "Opsi B", "Opsi C"],
      };
    case "va_2":
      return {
        optionCount: 2,
        optionLetters: ["a", "b"],
        defaultScores: [1, 0],
        defaultTexts: ["Benar", "Salah"],
      };
    case "va_3":
      return {
        optionCount: 4,
        optionLetters: ["a", "b", "c", "d"],
        defaultScores: [1, 2, 3, 4],
        defaultTexts: [
          "Sangat Tidak Menggambarkan Diri Saya",
          "Tidak Menggambarkan Diri Saya",
          "Menggambarkan Diri Saya",
          "Sangat Menggambarkan Diri Saya",
        ],
      };
    default: // Crew evaluation roles
      return {
        optionCount: 4,
        optionLetters: ["a", "b", "c", "d"],
        defaultScores: [2, 0, 0, 0], // First option correct by default
        defaultTexts: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      };
  }
};

export default function QuestionDialog({
  open,
  onClose,
  question,
  assessmentId,
  role,
  categories,
}: QuestionDialogProps) {
  const [formData, setFormData] = useState({
    questionText: "",
    category: "",
    isImage: "0",
    imageUrl: "",
    aspectId: 0,
  });
  const [options, setOptions] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>("");

  const api = useApi();
  const uploadImageMutation = useUploadAssessmentImage();
  const { data: aspectsData } = useGetAspectsByAssessmentId(assessmentId);

  useEffect(() => {
    if (open) {
      if (question) {
        // Editing existing question
        setFormData({
          questionText: question.questionText,
          category: question.category || "",
          isImage: question.isImage || "0",
          imageUrl: question.imageUrl || "",
          aspectId: question.aspectId || 0,
        });

        // If question has existing image, don't show preview (keep as URL only)
        setQuestionImageFile(null);
        setQuestionImagePreview("");

        const existingOptions = (question.options || []).map((option) => ({
          ...option,
          action: "update" as const,
          isNew: false,
        }));

        setOptions(existingOptions);
      } else {
        // Creating new question
        const defaults = getRoleDefaults(role);
        setFormData({
          questionText: "",
          category: "",
          isImage: "0",
          imageUrl: "",
          aspectId: 0,
        });

        // Reset image upload state for new question
        setQuestionImageFile(null);
        setQuestionImagePreview("");

        const defaultOptions: Option[] = defaults.optionLetters.map(
          (letter, index) => ({
            optionLetter: letter,
            optionText: defaults.defaultTexts[index],
            score: defaults.defaultScores[index],
            isImage: 0,
            action: "create" as const,
            isNew: true,
          })
        );

        setOptions(defaultOptions);
      }
    }
  }, [open, question, role]);

  const handleQuestionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file tidak boleh lebih dari 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipe file harus berupa gambar (JPEG, PNG, GIF, WebP)");
      return;
    }

    setQuestionImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestionImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQuestionImage = () => {
    setQuestionImageFile(null);
    setQuestionImagePreview("");
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleSubmit = async () => {
    if (!formData.questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (options.length === 0) {
      toast.error("At least one option is required");
      return;
    }

    if (role === "va_1" && !formData.category) {
      toast.error("Category is required for VA_1 questions");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload image if one was selected
      if (questionImageFile && formData.isImage === "1") {
        try {
          const uploadResult = await uploadImageMutation.mutateAsync(
            questionImageFile
          );
          imageUrl = uploadResult.imageUrl;
        } catch {
          toast.error("Gagal mengunggah gambar");
          setLoading(false);
          return;
        }
      }

      // Upload option images if any
      const optionsWithUploadedImages = await Promise.all(
        options.map(async (option) => {
          let optionImageUrl = option.imageUrl || "";

          // If option has a new image file, upload it
          if (option.imageFile) {
            try {
              const uploadResult = await uploadImageMutation.mutateAsync(
                option.imageFile
              );
              optionImageUrl = uploadResult.imageUrl;
            } catch (error) {
              toast.error(
                `Gagal mengunggah gambar untuk opsi ${option.optionLetter}`
              );
              throw error;
            }
          }

          return {
            ...option,
            imageUrl: optionImageUrl,
          };
        })
      );

      if (question?.questionId) {
        // Update existing question using combined endpoint
        const updateData = {
          role,
          assessmentId,
          questionText: formData.questionText,
          category: role === "va_1" ? formData.category : null,
          isImage: formData.isImage,
          imageUrl: imageUrl || null,
          aspectId: formData.aspectId || null,
          options: optionsWithUploadedImages.map((option) => {
            // Determine action based on option state
            let action = option.action || "update";

            // If option has no ID, it's a create operation
            if (!option.optionId) {
              action = "create";
            }

            return {
              optionId: option.optionId || null,
              optionLetter: option.optionLetter,
              optionText: option.optionText,
              score: option.score,
              isImage: option.isImage,
              imageUrl: option.imageUrl || null,
              action: action,
            };
          }),
        };

        await api.put(
          `/api/questions-with-options/${question.questionId}`,
          updateData
        );
        toast.success("Pertanyaan berhasil diperbarui");
      } else {
        // Create new question using combined endpoint
        const createData = {
          role,
          assessmentId,
          questionText: formData.questionText,
          category: role === "va_1" ? formData.category : "",
          isImage: formData.isImage,
          imageUrl: imageUrl || "",
          aspectId: formData.aspectId || null,
          options: optionsWithUploadedImages.map((option) => ({
            optionLetter: option.optionLetter,
            optionText: option.optionText,
            score: option.score,
            isImage: option.isImage,
            imageUrl: option.imageUrl || null,
          })),
        };

        await api.post("/api/questions-with-options", createData);
        toast.success("Pertanyaan berhasil dibuat");
      }

      onClose(true);
    } catch (error) {
      console.error("Error saving question:", error);
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Gagal menyimpan pertanyaan";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    const nextLetter = String.fromCharCode(97 + options.length); // a, b, c, d, etc.
    setOptions([
      ...options,
      {
        optionLetter: nextLetter,
        optionText: `Opsi ${nextLetter.toUpperCase()}`,
        score: 0,
        isImage: 0,
        action: "create" as const,
        isNew: true,
      },
    ]);
  };

  const removeOption = (index: number) => {
    const optionToRemove = options[index];

    if (optionToRemove.isNew) {
      // If it's a newly added option, just remove it from the array
      setOptions(options.filter((_, i) => i !== index));
    } else {
      // If it's an existing option, mark it for deletion but keep in array for backend processing
      // We'll filter it out when sending to backend but keep the record for deletion
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (
    index: number,
    field: keyof Option,
    value: string | boolean | number
  ) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setOptions(updatedOptions);
  };

  const handleOptionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file tidak boleh lebih dari 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipe file harus berupa gambar (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedOptions = [...options];
      updatedOptions[index] = {
        ...updatedOptions[index],
        imageFile: file,
        imagePreview: reader.result as string,
      };
      setOptions(updatedOptions);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveOptionImage = (index: number) => {
    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      imageFile: null,
      imagePreview: "",
      imageUrl: "",
    };
    setOptions(updatedOptions);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="!w-[95vw] !max-w-[1400px] !h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {question?.questionId
              ? "Perbarui Pertanyaan"
              : "Buat Pertanyaan Baru"}
          </DialogTitle>
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-2xl font-bold uppercase">
              {question?.questionId
                ? "Perbarui Pertanyaan"
                : "Buat Pertanyaan Baru"}
            </h1>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* Left Column - Question Details */}
          <div className="flex flex-col gap-6">
            <div className="border rounded-xl shadow-sm p-6 bg-white">
              <h2 className="font-bold text-lg mb-4">Detail Pertanyaan</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="questionText" className="text-sm font-medium">
                    Teks Pertanyaan <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="questionText"
                    value={formData.questionText}
                    onChange={(e) =>
                      setFormData({ ...formData, questionText: e.target.value })
                    }
                    placeholder="Masukkan teks pertanyaan..."
                    className="min-h-[120px] mt-2"
                  />
                </div>

                {aspectsData &&
                  aspectsData.data &&
                  aspectsData.data.length > 0 && (
                    <div>
                      <Label htmlFor="aspectId" className="text-sm font-medium">
                        Aspek Penilaian
                      </Label>
                      <Select
                        value={formData.aspectId.toString()}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            aspectId: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Pilih aspek..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Tidak Ada Aspek</SelectItem>
                          {aspectsData.data.map((aspect: AspectResponse) => (
                            <SelectItem
                              key={aspect.id}
                              value={aspect.id.toString()}
                            >
                              {aspect.name} ({aspect.weight}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isImage" className="text-sm font-medium">
                      Memiliki Gambar
                    </Label>
                    <Select
                      value={formData.isImage}
                      onValueChange={(value) =>
                        setFormData({ ...formData, isImage: value })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Tidak</SelectItem>
                        <SelectItem value="1">Ya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.isImage === "1" && (
                    <div className="col-span-2 gap-2">
                      <Label className="text-sm font-medium">
                        Upload Gambar
                      </Label>

                      {questionImagePreview && (
                        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden mt-2 mb-3">
                          <Image
                            src={questionImagePreview}
                            alt="Preview"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <button
                            onClick={handleRemoveQuestionImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="questionImage"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 bg-gray-50"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-6 w-6 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Klik untuk upload (Max 10MB)
                            </p>
                          </div>
                          <Input
                            id="questionImage"
                            type="file"
                            accept="image/*"
                            onChange={handleQuestionImageChange}
                            disabled={loading}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Format: JPEG, PNG, GIF, WebP
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Options */}
          <div className="flex flex-col gap-6">
            <div className="border rounded-xl shadow-sm p-6 bg-white h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Opsi Jawaban</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Opsi
                </Button>
              </div>

              <div className="space-y-3 h-full overflow-y-auto">
                {options.map((option, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="bg-white">
                        Opsi {option.optionLetter.toUpperCase()}
                      </Badge>
                      {options.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Teks Opsi</Label>
                        <Input
                          value={option.optionText}
                          onChange={(e) =>
                            updateOption(index, "optionText", e.target.value)
                          }
                          placeholder="Masukkan teks opsi..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Skor</Label>
                        <Input
                          type="number"
                          value={option.score}
                          onChange={(e) =>
                            updateOption(
                              index,
                              "score",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      {/* Image Upload for Option */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Gambar Opsi (Opsional)
                        </Label>

                        {option.imagePreview && (
                          <div className="relative w-full h-28 bg-gray-100 rounded-lg overflow-hidden mb-2">
                            <Image
                              src={option.imagePreview}
                              alt={`Preview Opsi ${option.optionLetter}`}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            <button
                              onClick={() => handleRemoveOptionImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              type="button"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        <label
                          htmlFor={`optionImage-${index}`}
                          className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 bg-gray-50"
                        >
                          <div className="flex flex-col items-center justify-center pt-3 pb-3">
                            <Upload className="h-5 w-5 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">
                              Klik untuk upload
                            </p>
                          </div>
                          <Input
                            id={`optionImage-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOptionImageChange(e, index)}
                            disabled={loading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 pt-4 border-t">
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => onClose()}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading
                ? "Menyimpan..."
                : question?.questionId
                ? "Perbarui Pertanyaan"
                : "Buat Pertanyaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
