"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";

interface Option {
  optionId?: number;
  optionLetter: string;
  optionText: string;
  score: number;
  isImage: number;
}

interface Question {
  questionId?: number;
  role: string;
  questionText: string;
  category?: string;
  isImage?: string;
  imageUrl?: string;
  options?: Option[];
}

interface QuestionDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  question?: Question | null;
  role: string;
  categories: string[];
}

const getRoleDefaults = (role: string) => {
  switch (role) {
    case "va_1":
      return {
        optionCount: 3,
        optionLetters: ["a", "b", "c"],
        defaultScores: [4, 2, 0],
        defaultTexts: ["Opsi A", "Opsi B", "Opsi C"]
      };
    case "va_2":
      return {
        optionCount: 2,
        optionLetters: ["a", "b"],
        defaultScores: [1, 0],
        defaultTexts: ["Benar", "Salah"]
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
          "Sangat Menggambarkan Diri Saya"
        ]
      };
    default: // Crew evaluation roles
      return {
        optionCount: 4,
        optionLetters: ["a", "b", "c", "d"],
        defaultScores: [2, 0, 0, 0], // First option correct by default
        defaultTexts: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"]
      };
  }
};

export default function QuestionDialog({
  open,
  onClose,
  question,
  role,
  categories
}: QuestionDialogProps) {
  const [formData, setFormData] = useState({
    questionText: "",
    category: "",
    isImage: "0",
    imageUrl: ""
  });
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (open) {
      if (question) {
        // Editing existing question
        setFormData({
          questionText: question.questionText,
          category: question.category || "",
          isImage: question.isImage || "0",
          imageUrl: question.imageUrl || ""
        });
        setOptions(question.options || []);
      } else {
        // Creating new question
        const defaults = getRoleDefaults(role);
        setFormData({
          questionText: "",
          category: "",
          isImage: "0",
          imageUrl: ""
        });
        
        const defaultOptions: Option[] = defaults.optionLetters.map((letter, index) => ({
          optionLetter: letter,
          optionText: defaults.defaultTexts[index],
          score: defaults.defaultScores[index],
          isImage: 0
        }));
        
        setOptions(defaultOptions);
      }
    }
  }, [open, question, role]);

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
      let questionData;
      
      if (question?.questionId) {
        // Update existing question
        const updateData = {
          questionId: question.questionId,
          role,
          questionText: formData.questionText,
          category: role === "va_1" ? formData.category : null,
          isImage: formData.isImage,
          imageUrl: formData.imageUrl || null
        };
        
        const response = await api.put(`/api/questions/${question.questionId}`, updateData);
        questionData = response.data.data;
        
        // Delete existing options and create new ones
        for (const option of question.options || []) {
          if (option.optionId) {
            await api.delete(`/api/options/${option.optionId}`);
          }
        }
      } else {
        // Create new question
        const createData = {
          role,
          questionText: formData.questionText,
          category: role === "va_1" ? formData.category : null,
          isImage: formData.isImage,
          imageUrl: formData.imageUrl || null
        };
        
        const response = await api.post("/api/questions", createData);
        questionData = response.data.data;
      }

      // Create options
      for (const option of options) {
        await api.post("/api/options", {
          questionId: questionData.questionId,
          optionLetter: option.optionLetter,
          optionText: option.optionText,
          score: option.score,
          isImage: option.isImage
        });
      }

      toast.success(question?.questionId ? "Pertanyaan berhasil diperbarui" : "Pertanyaan berhasil dibuat");
      onClose(true);
    } catch (error) {
      toast.error("Gagal menyimpan pertanyaan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    const nextLetter = String.fromCharCode(97 + options.length); // a, b, c, d, etc.
    setOptions([...options, {
      optionLetter: nextLetter,
      optionText: `Opsi ${nextLetter.toUpperCase()}`,
      score: 0,
      isImage: 0
    }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof Option, value: any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setOptions(updatedOptions);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="!w-[95vw] !max-w-[1400px] !h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {question?.questionId ? "Perbarui Pertanyaan" : "Buat Pertanyaan Baru"}
          </DialogTitle>
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-2xl font-bold uppercase">
              {question?.questionId ? "Perbarui Pertanyaan" : "Buat Pertanyaan Baru"}
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
                  <Label htmlFor="questionText" className="text-sm font-medium">Teks Pertanyaan</Label>
                  <Textarea
                    id="questionText"
                    value={formData.questionText}
                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                    placeholder="Masukkan teks pertanyaan..."
                    className="min-h-[120px] mt-2"
                  />
                </div>

                {role === "va_1" && (
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Pilih kategori..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isImage" className="text-sm font-medium">Memiliki Gambar</Label>
                    <Select
                      value={formData.isImage}
                      onValueChange={(value) => setFormData({ ...formData, isImage: value })}
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
                    <div>
                      <Label htmlFor="imageUrl" className="text-sm font-medium">URL Gambar</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="Masukkan URL gambar..."
                        className="mt-2"
                      />
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

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
                          onChange={(e) => updateOption(index, "optionText", e.target.value)}
                          placeholder="Masukkan teks opsi..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Skor</Label>
                        <Input
                          type="number"
                          value={option.score}
                          onChange={(e) => updateOption(index, "score", parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1"
                        />
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
              {loading ? "Menyimpan..." : (question?.questionId ? "Perbarui Pertanyaan" : "Buat Pertanyaan")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}