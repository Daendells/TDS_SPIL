import { ValueAssessmentData } from "@/app/value-assessment/page";

export interface ValueAssessmentFormData {
  assessmentData: ValueAssessmentData;
  currentStep: number;
  timestamp: string;
}

export class ValueAssessmentStorage {
  private static readonly STORAGE_KEY = "valueAssessmentFormData";

  /**
   * Simpan data assessment ke sessionStorage
   */
  static save(data: ValueAssessmentData, currentStep: number): void {
    try {
      const formData: ValueAssessmentFormData = {
        assessmentData: data,
        currentStep,
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error("Error saving assessment data to sessionStorage:", error);
    }
  }

  /**
   * Muat data assessment dari sessionStorage
   */
  static load(): { data: ValueAssessmentData | null; step: number } {
    try {
      const savedData = sessionStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const formData: ValueAssessmentFormData = JSON.parse(savedData);
        return {
          data: formData.assessmentData,
          step: formData.currentStep || 1,
        };
      }
    } catch (error) {
      console.error("Error loading assessment data from sessionStorage:", error);
    }
    return { data: null, step: 1 };
  }

  /**
   * Hapus data assessment dari sessionStorage
   */
  static clear(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing assessment data from sessionStorage:", error);
    }
  }

  /**
   * Cek apakah ada data tersimpan
   */
  static hasStoredData(): boolean {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY);
      return data !== null && data !== "";
    } catch {
      return false;
    }
  }

  /**
   * Export data assessment ke file JSON
   */
  static exportToFile(): void {
    try {
      const { data } = this.load();
      if (data) {
        const exportData = {
          ...data,
          exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `value-assessment-${data.seafarerCode || "backup"}-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting assessment data:", error);
    }
  }

  /**
   * Import data assessment dari file JSON
   */
  static async importFromFile(file: File): Promise<ValueAssessmentData | null> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validasi struktur data
      if (this.validateAssessmentData(data)) {
        return data as ValueAssessmentData;
      } else {
        throw new Error("Invalid assessment data format");
      }
    } catch (error) {
      console.error("Error importing assessment data:", error);
      return null;
    }
  }

  /**
   * Validasi struktur data assessment
   */
  private static validateAssessmentData(data: unknown): boolean {
    if (!data || typeof data !== "object") return false;

    const required = [
      "email",
      "consent",
      "fullName",
      "rank",
      "vesselName",
      "seamanCode",
      "section1Answers",
      "section2Answers",
      "section3Answers",
    ];

    return required.every((field) => Object.prototype.hasOwnProperty.call(data, field));
  }

  /**
   * Dapatkan waktu yang tersisa untuk section tertentu
   */
  static getTimeRemaining(
    startTime: string | undefined,
    totalMinutes: number = 30,
    pausedTime: number = 0
  ): number {
    if (!startTime) return totalMinutes * 60;

    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    // Subtract pausedTime (convert from ms to seconds) from elapsed time
    const elapsedSeconds = Math.floor((now - start) / 1000) - Math.floor(pausedTime / 1000);
    const totalSeconds = totalMinutes * 60;

    return Math.max(0, totalSeconds - elapsedSeconds);
  }

  /**
   * Format waktu dari detik ke MM:SS
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Dapatkan progres assessment dalam persen
   */
  static getProgress(data: ValueAssessmentData): number {
    let completed = 0;
    const total = 5; // 5 steps: greeting, personal, section1, section2, section3

    if (data.email && data.consent) completed++;
    if (data.fullName && data.seafarerCode) completed++;
    if (Object.keys(data.section1Answers).length > 0) completed++;
    if (Object.keys(data.section2Answers).length > 0) completed++;
    if (Object.keys(data.section3Answers).length > 0) completed++;

    return Math.round((completed / total) * 100);
  }
}
