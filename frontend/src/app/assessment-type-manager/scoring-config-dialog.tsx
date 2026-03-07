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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Calculator, CheckCircle, XCircle } from "lucide-react";
import {
  useGetScoringConfig,
  useUpdateScoringConfig,
  useValidateFormula,
  UpdateScoringConfigRequest,
} from "./_hooks/useScoringConfig";

const FormSchema = z.object({
  scoringType: z.enum(["default", "custom", "cfit"]),
  scoringFormula: z.string().optional(),
  usePercentage: z.boolean(),
});

interface ScoringConfigDialogProps {
  open: boolean;
  assessmentTypeId: number;
  assessmentTypeName: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ScoringConfigDialog({
  open,
  assessmentTypeId,
  assessmentTypeName,
  onOpenChange,
  onSuccess,
}: ScoringConfigDialogProps) {
  const queryClient = useQueryClient();
  const [testScore, setTestScore] = useState(80);
  const [testMaxScore, setTestMaxScore] = useState(100);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    result?: number;
    error?: string;
  } | null>(null);

  const { data: scoringConfig, isLoading } = useGetScoringConfig(assessmentTypeId);
  const updateScoringConfig = useUpdateScoringConfig();
  const validateFormula = useValidateFormula();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      scoringType: "default",
      scoringFormula: "",
      usePercentage: true,
    },
  });

  const watchScoringType = form.watch("scoringType");
  const watchFormula = form.watch("scoringFormula");

  useEffect(() => {
    if (scoringConfig) {
      form.reset({
        scoringType: scoringConfig.scoringType,
        scoringFormula: scoringConfig.scoringFormula || "",
        usePercentage: scoringConfig.usePercentage,
      });
    }
  }, [scoringConfig, form]);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      const payload: UpdateScoringConfigRequest = {
        assessmentTypeId,
        scoringType: values.scoringType,
        scoringFormula: values.scoringType === "custom" ? values.scoringFormula : null,
        usePercentage: values.usePercentage,
      };

      await updateScoringConfig.mutateAsync(payload);

      toast.success("Konfigurasi scoring berhasil diupdate!");
      queryClient.invalidateQueries({ queryKey: ["scoring-config", assessmentTypeId] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Gagal mengupdate konfigurasi scoring"
      );
    }
  };

  const handleValidateFormula = async () => {
    if (!watchFormula) return;

    try {
      const result = await validateFormula.mutateAsync({
        formula: watchFormula,
        testScore,
        testMaxScore,
      });
      setValidationResult(result);
    } catch (error: unknown) {
      setValidationResult({
        isValid: false,
        error:
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Error validating formula",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[98vh] overflow-y-auto p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Calculator className="h-6 w-6" />
            Konfigurasi Scoring - {assessmentTypeName}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 mt-2">
            Konfigurasi cara menghitung skor untuk assessment ini
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Form Section */}
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="scoringType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Tipe Scoring</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Pilih tipe scoring" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Default (Persentase)</SelectItem>
                          <SelectItem value="custom">Custom (Formula)</SelectItem>
                          <SelectItem value="cfit">CFIT (Tabel Konversi)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm leading-relaxed">
                        <strong>Default:</strong> (score / max_score) × 100
                        <br />
                        <strong>Custom:</strong> Formula yang dapat dikustomisasi
                        <br />
                        <strong>CFIT:</strong> Konversi jumlah soal benar (0–49) ke skor standar
                        CFIT
                        <br />
                        <div className="mt-2 text-xs text-gray-600">
                          <strong>Contoh Custom:</strong>{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">score * 2</code>,{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            (score / max_score) * 90 + 10
                          </code>
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchScoringType === "custom" && (
                  <FormField
                    control={form.control}
                    name="scoringFormula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Formula Custom</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="(score / max_score) * 90 + 10"
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription className="text-sm leading-relaxed">
                          <strong>Variabel yang tersedia:</strong>{" "}
                          <code className="bg-gray-100 px-1 rounded">score</code> dan{" "}
                          <code className="bg-gray-100 px-1 rounded">max_score</code>
                          <br />
                          <strong>Operasi yang didukung:</strong> +, -, *, /, ()
                          <br />
                          <div className="mt-2 space-y-2">
                            <div className="text-xs text-gray-600">
                              <strong>Contoh sederhana (klik untuk gunakan):</strong>
                              <div className="mt-1 flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() => field.onChange("score * 10")}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs cursor-pointer border border-blue-200 transition-colors"
                                >
                                  score * 10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => field.onChange("score + 20")}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs cursor-pointer border border-blue-200 transition-colors"
                                >
                                  score + 20
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              <strong>Contoh persentase:</strong>
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => field.onChange("(score / max_score) * 80 + 20")}
                                  className="bg-green-50 hover:bg-green-100 text-green-800 px-2 py-1 rounded text-xs cursor-pointer border border-green-200 transition-colors"
                                >
                                  (score / max_score) * 80 + 20
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              <strong>Contoh kompleks:</strong>
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => field.onChange("(score - 5) * (100 / max_score)")}
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs cursor-pointer border border-purple-200 transition-colors"
                                >
                                  (score - 5) * (100 / max_score)
                                </button>
                              </div>
                            </div>
                          </div>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </form>
            </Form>

            {/* CFIT Conversion Table Preview */}
            {watchScoringType === "cfit" && (
              <Card className="border-2 border-orange-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                    <Calculator className="h-4 w-4" />
                    Tabel Konversi CFIT (50 Soal)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Jumlah soal benar akan dikonversi ke skor CFIT secara otomatis.
                  </p>
                  <div className="grid grid-cols-5 gap-1 text-xs">
                    {(
                      [
                        [0, 38],
                        [1, 40],
                        [2, 43],
                        [3, 45],
                        [4, 47],
                        [5, 48],
                        [6, 52],
                        [7, 55],
                        [8, 57],
                        [9, 60],
                        [10, 63],
                        [11, 67],
                        [12, 70],
                        [13, 72],
                        [14, 75],
                        [15, 78],
                        [16, 81],
                        [17, 85],
                        [18, 88],
                        [19, 91],
                        [20, 94],
                        [21, 96],
                        [22, 100],
                        [23, 103],
                        [24, 106],
                        [25, 109],
                        [26, 113],
                        [27, 116],
                        [28, 119],
                        [29, 121],
                        [30, 124],
                        [31, 128],
                        [32, 131],
                        [33, 133],
                        [34, 137],
                        [35, 140],
                        [36, 142],
                        [37, 145],
                        [38, 149],
                        [39, 152],
                        [40, 155],
                        [41, 157],
                        [42, 161],
                        [43, 165],
                        [44, 167],
                        [45, 169],
                        [46, 173],
                        [47, 176],
                        [48, 179],
                        [49, 183],
                      ] as [number, number][]
                    ).map(([correct, converted]) => (
                      <div
                        key={correct}
                        className="flex justify-between bg-orange-50 border border-orange-100 rounded px-2 py-1"
                      >
                        <span className="font-medium text-orange-800">{correct}</span>
                        <span className="text-orange-600">→ {converted}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formula Testing */}
            {watchScoringType === "custom" && watchFormula && (
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Test Formula
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Test Score</label>
                      <Input
                        type="number"
                        value={testScore}
                        onChange={(e) => setTestScore(Number(e.target.value))}
                        placeholder="80"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Score</label>
                      <Input
                        type="number"
                        value={testMaxScore}
                        onChange={(e) => setTestMaxScore(Number(e.target.value))}
                        placeholder="100"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidateFormula}
                    disabled={validateFormula.isPending}
                    className="w-full h-10"
                  >
                    {validateFormula.isPending ? "Memvalidasi..." : "Test Formula"}
                  </Button>

                  {validationResult && (
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        validationResult.isValid
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {validationResult.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium text-base">
                          {validationResult.isValid ? "Formula Valid" : "Formula Error"}
                        </span>
                      </div>
                      {validationResult.isValid && validationResult.result !== undefined && (
                        <p className="text-green-700 font-medium">
                          Hasil: {testScore}/{testMaxScore} → {validationResult.result.toFixed(2)}
                        </p>
                      )}
                      {validationResult.error && (
                        <p className="text-red-700">{validationResult.error}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="pt-8 border-t mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateScoringConfig.isPending || isLoading}
            className="h-10 px-6"
          >
            {updateScoringConfig.isPending ? "Menyimpan..." : "Simpan Konfigurasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
