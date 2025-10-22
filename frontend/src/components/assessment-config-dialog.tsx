"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";

interface Assessment {
  id: number;
  role: string;
  assessmentName: string;
  usingTimer: boolean;
  timerLimitMinutes: number | null;
}

interface AssessmentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole?: string;
  onAssessmentChange?: () => void;
}

const ROLES = [
  { value: "va_1", label: "VA_1 (COREVA)" },
  { value: "va_2", label: "VA_2 (Value Assessment)" },
  { value: "va_3", label: "VA_3 (Value Assessment)" },
  { value: "KKM", label: "KKM (Crew Evaluation)" },
  { value: "masinis_2", label: "Masinis 2 (Crew Evaluation)" },
  { value: "masinis_3", label: "Masinis 3 (Crew Evaluation)" },
  { value: "masinis_4", label: "Masinis 4 (Crew Evaluation)" },
  { value: "mualim_1", label: "Mualim 1 (Crew Evaluation)" },
  { value: "mualim_2", label: "Mualim 2 (Crew Evaluation)" },
  { value: "mualim_3", label: "Mualim 3 (Crew Evaluation)" },
  { value: "nahkoda", label: "Nahkoda (Crew Evaluation)" },
];

export default function AssessmentConfigDialog({
  open,
  onOpenChange,
  selectedRole,
  onAssessmentChange,
}: AssessmentConfigDialogProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState({
    role: "",
    assessmentName: "",
    usingTimer: false,
    timerLimitMinutes: 0,
  });

  const api = useApi();

  // Fetch assessment by role or all assessments
  const fetchAssessments = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedRole) {
        // Fetch specific assessment for the selected role
        response = await api.get(`/api/assessments/${selectedRole}`);
      } else {
        // Fetch all assessments
        response = await api.get("/api/assessments");
      }
      
      // Handle response structure - backend returns { code, status, data }
      if (response.data.code === 200) {
        if (selectedRole) {
          // For single assessment, wrap in array and set as editing
          const assessmentData = {
            id: response.data.data.assessmentId,
            role: response.data.data.role,
            assessmentName: response.data.data.assessmentName,
            usingTimer: response.data.data.usingTimer,
            timerLimitMinutes: response.data.data.timerLimitMinutes,
          };
          setAssessments([assessmentData]);
          // Set this assessment as being edited
          setEditingAssessment(assessmentData);
          setIsCreating(false);
        } else {
          // For multiple assessments, map the data
          const mappedAssessments = (response.data.data || []).map((item: any) => ({
            id: item.assessmentId,
            role: item.role,
            assessmentName: item.assessmentName,
            usingTimer: item.usingTimer,
            timerLimitMinutes: item.timerLimitMinutes,
          }));
          setAssessments(mappedAssessments);
        }
      } else {
        if (selectedRole && response.data.code === 500) {
          // No assessment found for this role, show create form
          setAssessments([]);
          setIsCreating(true);
          setFormData({ 
            role: selectedRole, 
            assessmentName: "",
            usingTimer: false, 
            timerLimitMinutes: 0 
          });
        } else {
          toast.error("Gagal memuat konfigurasi assessment");
        }
      }
    } catch (error: any) {
      console.error("Error fetching assessments:", error);
      if (selectedRole && (error.response?.status === 500 || error.response?.status === 404)) {
        // No assessment found for this role, show create form
        setAssessments([]);
        setIsCreating(true);
        setFormData({ 
          role: selectedRole, 
          assessmentName: "",
          usingTimer: false, 
          timerLimitMinutes: 0 
        });
      } else {
        toast.error("Terjadi kesalahan saat memuat data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new assessment
  const createAssessment = async () => {
    if (!formData.role) {
      toast.error("Role harus dipilih");
      return;
    }

    if (!formData.assessmentName.trim()) {
      toast.error("Nama assessment harus diisi");
      return;
    }

    try {
      const response = await api.post("/api/assessments", {
        role: formData.role,
        assessmentName: formData.assessmentName,
        usingTimer: formData.usingTimer,
        timerLimitMinutes: formData.usingTimer ? formData.timerLimitMinutes : null,
      });

      if (response.data.code === 200) {
        toast.success("Konfigurasi assessment berhasil dibuat");
        setIsCreating(false);
        setFormData({ role: "", assessmentName: "", usingTimer: false, timerLimitMinutes: 0 });
        fetchAssessments();
        onAssessmentChange?.(); // Notify parent component
      } else {
        toast.error(response.data.status || "Gagal membuat konfigurasi assessment");
      }
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast.error("Terjadi kesalahan saat membuat konfigurasi");
    }
  };

  // Update assessment
  const updateAssessment = async (assessment: Assessment) => {
    if (!assessment.assessmentName.trim()) {
      toast.error("Nama assessment harus diisi");
      return;
    }

    try {
      const response = await api.put(`/api/assessments/${assessment.id}`, {
        role: assessment.role,
        assessmentName: assessment.assessmentName,
        usingTimer: assessment.usingTimer,
        timerLimitMinutes: assessment.usingTimer ? assessment.timerLimitMinutes : null,
      });

      if (response.data.code === 200) {
        toast.success("Konfigurasi assessment berhasil diperbarui");
        setEditingAssessment(null);
        fetchAssessments();
        onAssessmentChange?.(); // Notify parent component
      } else {
        toast.error(response.data.status || "Gagal memperbarui konfigurasi assessment");
      }
    } catch (error) {
      console.error("Error updating assessment:", error);
      toast.error("Terjadi kesalahan saat memperbarui konfigurasi");
    }
  };

  // Load assessments when dialog opens
  useEffect(() => {
    if (open) {
      fetchAssessments();
    }
  }, [open]);

  // Set default role when selectedRole is provided
  useEffect(() => {
    if (selectedRole && isCreating && formData.role === "") {
      setFormData(prev => ({ ...prev, role: selectedRole }));
    }
  }, [selectedRole, isCreating, formData.role]);

  const handleEditClick = (assessment: Assessment) => {
    setEditingAssessment({ ...assessment });
  };

  const handleSaveEdit = () => {
    if (editingAssessment) {
      updateAssessment(editingAssessment);
    }
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setFormData({ 
      role: selectedRole || "", 
      assessmentName: "",
      usingTimer: false, 
      timerLimitMinutes: 0 
    });
  };

  const getRoleLabel = (roleValue: string) => {
    return ROLES.find(role => role.value === roleValue)?.label || roleValue;
  };

  // Check if selected role exists in assessments
  const roleExists = selectedRole && assessments.some(a => a.role === selectedRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[90vw] !max-w-[800px] !h-[55vh] top-[5vh] translate-y-0 flex flex-col">
        <DialogHeader>
          <DialogTitle>Konfigurasi Assessment</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Create New Assessment Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tambah Konfigurasi Baru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.filter(role => 
                        !assessments.some(a => a.role === role.value) || 
                        role.value === selectedRole
                      ).map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessment-name">Nama Assessment</Label>
                  <Input
                    id="assessment-name"
                    type="text"
                    value={formData.assessmentName}
                    onChange={(e) => setFormData({ ...formData, assessmentName: e.target.value })}
                    placeholder="Masukkan nama assessment"
                    maxLength={50}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="using-timer"
                    checked={formData.usingTimer}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, usingTimer: checked })}
                  />
                  <Label htmlFor="using-timer">Gunakan Timer</Label>
                </div>

                {formData.usingTimer && (
                  <div className="space-y-2">
                    <Label htmlFor="timer-limit">Batas Waktu (menit)</Label>
                    <Input
                      id="timer-limit"
                      type="number"
                      min="1"
                      value={formData.timerLimitMinutes}
                      onChange={(e) => setFormData({ ...formData, timerLimitMinutes: parseInt(e.target.value) || 0 })}
                      placeholder="Masukkan batas waktu dalam menit"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={createAssessment} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Simpan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Button - Only show if selectedRole doesn't exist or no selectedRole */}
          {!isCreating && (!selectedRole || !roleExists) && (
            <div className="flex justify-end">
              <Button onClick={handleCreateClick} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Konfigurasi
              </Button>
            </div>
          )}

          {/* Assessment List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">Memuat konfigurasi...</div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada konfigurasi assessment. Klik "Tambah Konfigurasi" untuk membuat yang baru.
              </div>
            ) : (
              assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardContent className="pt-6">
                    {editingAssessment && editingAssessment.id === assessment.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <div className="p-2 bg-gray-100 rounded">
                            {getRoleLabel(assessment.role)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Nama Assessment</Label>
                          <Input
                            type="text"
                            value={editingAssessment.assessmentName}
                            onChange={(e) => 
                              setEditingAssessment({ 
                                ...editingAssessment, 
                                assessmentName: e.target.value 
                              })
                            }
                            placeholder="Masukkan nama assessment"
                            maxLength={50}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editingAssessment.usingTimer}
                            onCheckedChange={(checked: boolean) => 
                              setEditingAssessment({ ...editingAssessment, usingTimer: checked })
                            }
                          />
                          <Label>Gunakan Timer</Label>
                        </div>

                        {editingAssessment.usingTimer && (
                          <div className="space-y-2">
                            <Label>Batas Waktu (menit)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={editingAssessment.timerLimitMinutes || 0}
                              onChange={(e) => 
                                setEditingAssessment({ 
                                  ...editingAssessment, 
                                  timerLimitMinutes: parseInt(e.target.value) || 0 
                                })
                              }
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdit} size="sm" className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Simpan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{getRoleLabel(assessment.role)}</h3>
                            <Badge variant={assessment.usingTimer ? "default" : "secondary"}>
                              {assessment.usingTimer ? "Timer Aktif" : "Tanpa Timer"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {assessment.assessmentName}
                          </p>
                          {assessment.usingTimer && assessment.timerLimitMinutes && (
                            <p className="text-sm text-muted-foreground">
                              Batas waktu: {assessment.timerLimitMinutes} menit
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(assessment)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}