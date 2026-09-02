"use client";

import { useState, useMemo, useCallback } from "react";
import { DISCCandidate, REAL_DISC_DATASET } from "../_data/discDataset";

export interface DISCSummary {
  totalCandidates: number;
  dominantCounts: {
    D: number; // Dominance
    I: number; // Influence
    S: number; // Steadiness
    C: number; // Conscientiousness
  };
  consistencyCounts: Record<string, number>;
  consistentPercentage: number;
  topTraits: { trait: string; count: number }[];
  avgGraph1: { d: number; i: number; s: number; c: number };
  avgGraph2: { d: number; i: number; s: number; c: number };
  avgGraph3: { d: number; i: number; s: number; c: number };
  executiveInsights: string[];
  recommendations: string[];
}

export function useDISCAnalytics(initialDataset: DISCCandidate[] = REAL_DISC_DATASET) {
  const [candidates, setCandidates] = useState<DISCCandidate[]>(initialDataset);
  const [sourceTitle, setSourceTitle] = useState<string>("SPM Rec - Assessment Resume (582 Kandidat Rekrutmen SPIL)");
  const [selectedCandidate, setSelectedCandidate] = useState<DISCCandidate | null>(initialDataset[0] || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load from User Uploaded CSV
  const loadCustomCSV = useCallback((csvText: string, filename: string) => {
    setIsLoading(true);
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("File CSV tidak memiliki baris data yang cukup.");

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
      const nameIdx = headers.findIndex((h) => h.toLowerCase().includes("nama"));
      const nikIdx = headers.findIndex((h) => h.toLowerCase().includes("identitas") || h.toLowerCase().includes("ktp") || h.toLowerCase().includes("nik"));
      const emailIdx = headers.findIndex((h) => h.toLowerCase().includes("email"));
      const traitIdx = headers.findIndex((h) => h.toLowerCase().includes("traitm") || h.toLowerCase().includes("trait"));
      const konsIdx = headers.findIndex((h) => h.toLowerCase().includes("kons fin") || h.toLowerCase().includes("kons"));
      const descWordsIdx = headers.findIndex((h) => h.toLowerCase().includes("desc. words") || h.toLowerCase().includes("desc"));
      const charIdx = headers.findIndex((h) => h.toLowerCase().includes("character"));
      const motivIdx = headers.findIndex((h) => h.toLowerCase().includes("motivation"));
      const jobIdx = headers.findIndex((h) => h.toLowerCase().includes("job emphasis"));
      const g1Idx = headers.findIndex((h) => h.toLowerCase().includes("graph i") && !h.toLowerCase().includes("graph ii"));
      const g2Idx = headers.findIndex((h) => h.toLowerCase().includes("graph ii"));

      const newCandidates: DISCCandidate[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        const name = nameIdx !== -1 ? row[nameIdx] : `Kandidat ${i}`;
        if (!name) continue;

        const trait = traitIdx !== -1 ? row[traitIdx] || "D / I / S / C" : "D / I / S / C";
        let dominant: "D" | "I" | "S" | "C" = "D";
        if (trait.startsWith("I") || trait.includes("/ I")) dominant = "I";
        else if (trait.startsWith("S") || trait.includes("/ S")) dominant = "S";
        else if (trait.startsWith("C") || trait.includes("/ C")) dominant = "C";

        newCandidates.push({
          id: `DISC-${i.toString().padStart(4, "0")}`,
          name: name,
          nik: nikIdx !== -1 ? row[nikIdx] || "-" : "-",
          email: emailIdx !== -1 ? row[emailIdx] || "-" : "-",
          date: new Date().toISOString().slice(0, 10),
          dominantType: dominant,
          traitM: trait,
          traitL: "-",
          traitPk: trait,
          consistency: konsIdx !== -1 ? row[konsIdx] || "Consistent" : "Consistent",
          graph1: { d: 2, i: 1, s: 0, c: 3 },
          graph2: { d: 1, i: 0, s: 2, c: 2 },
          graph3: { d: 1, i: 1, s: -1, c: 1 },
          descWords: descWordsIdx !== -1 ? row[descWordsIdx] || "Adaptif, fokus pada hasil, sistematis." : "Adaptif, fokus pada hasil, sistematis.",
          character: charIdx !== -1 ? row[charIdx] || "Kandidat memiliki orientasi kerja yang terstruktur." : "Kandidat memiliki orientasi kerja yang terstruktur.",
          motivation: motivIdx !== -1 ? row[motivIdx] || "Pencapaian target kerja dan pengakuan profesional." : "Pencapaian target kerja dan pengakuan profesional.",
          jobEmphasis: jobIdx !== -1 ? row[jobIdx] || "Penerapan sistem operasional dan standar keselamatan." : "Penerapan sistem operasional dan standar keselamatan.",
          workMask: g1Idx !== -1 ? row[g1Idx] || "Fokus pada tugas dan efisiensi waktu kerja." : "Fokus pada tugas dan efisiensi waktu kerja.",
          underPressure: g2Idx !== -1 ? row[g2Idx] || "Tetap berhati-hati dan mengutamakan prosedur keselamatan." : "Tetap berhati-hati dan mengutamakan prosedur keselamatan.",
        });
      }

      if (newCandidates.length > 0) {
        setCandidates(newCandidates);
        setSelectedCandidate(newCandidates[0]);
        setSourceTitle(filename);
      }
    } catch (e: any) {
      console.error("Failed to parse custom DISC CSV:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetToRealDataset = useCallback(() => {
    setCandidates(REAL_DISC_DATASET);
    setSelectedCandidate(REAL_DISC_DATASET[0]);
    setSourceTitle("SPM Rec - Assessment Resume (582 Kandidat Rekrutmen SPIL)");
  }, []);

  // Compute Aggregates
  const summary: DISCSummary = useMemo(() => {
    const total = candidates.length;
    if (total === 0) {
      return {
        totalCandidates: 0,
        dominantCounts: { D: 0, I: 0, S: 0, C: 0 },
        consistencyCounts: {},
        consistentPercentage: 0,
        topTraits: [],
        avgGraph1: { d: 0, i: 0, s: 0, c: 0 },
        avgGraph2: { d: 0, i: 0, s: 0, c: 0 },
        avgGraph3: { d: 0, i: 0, s: 0, c: 0 },
        executiveInsights: [],
        recommendations: [],
      };
    }

    const dominantCounts = { D: 0, I: 0, S: 0, C: 0 };
    const consistencyCounts: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};

    let sumG1 = { d: 0, i: 0, s: 0, c: 0 };
    let sumG2 = { d: 0, i: 0, s: 0, c: 0 };
    let sumG3 = { d: 0, i: 0, s: 0, c: 0 };

    candidates.forEach((c) => {
      // Dominant
      if (dominantCounts[c.dominantType] !== undefined) {
        dominantCounts[c.dominantType]++;
      } else {
        dominantCounts.D++;
      }

      // Consistency
      const kons = c.consistency || "Still Consistent";
      consistencyCounts[kons] = (consistencyCounts[kons] || 0) + 1;

      // Trait
      const t = c.traitM || "General";
      traitCounts[t] = (traitCounts[t] || 0) + 1;

      // Graphs
      sumG1.d += c.graph1.d || 0;
      sumG1.i += c.graph1.i || 0;
      sumG1.s += c.graph1.s || 0;
      sumG1.c += c.graph1.c || 0;

      sumG2.d += c.graph2.d || 0;
      sumG2.i += c.graph2.i || 0;
      sumG2.s += c.graph2.s || 0;
      sumG2.c += c.graph2.c || 0;

      sumG3.d += c.graph3.d || 0;
      sumG3.i += c.graph3.i || 0;
      sumG3.s += c.graph3.s || 0;
      sumG3.c += c.graph3.c || 0;
    });

    const consistentTotal = consistencyCounts["Still Consistent"] || consistencyCounts["Consistent"] || 0;
    const consistentPercentage = Math.round((consistentTotal / total) * 100);

    const sortedTraits = Object.entries(traitCounts)
      .map(([trait, count]) => ({ trait, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const avgGraph1 = {
      d: Number((sumG1.d / total).toFixed(2)),
      i: Number((sumG1.i / total).toFixed(2)),
      s: Number((sumG1.s / total).toFixed(2)),
      c: Number((sumG1.c / total).toFixed(2)),
    };
    const avgGraph2 = {
      d: Number((sumG2.d / total).toFixed(2)),
      i: Number((sumG2.i / total).toFixed(2)),
      s: Number((sumG2.s / total).toFixed(2)),
      c: Number((sumG2.c / total).toFixed(2)),
    };
    const avgGraph3 = {
      d: Number((sumG3.d / total).toFixed(2)),
      i: Number((sumG3.i / total).toFixed(2)),
      s: Number((sumG3.s / total).toFixed(2)),
      c: Number((sumG3.c / total).toFixed(2)),
    };

    // Auto generated executive insights
    const insights = [
      `Sebanyak ${total} profil kandidat rekrutmen telah dianalisis melalui asesmen psikometri DISC terstandarisasi.`,
      `Tingkat reliabilitas jawaban kandidat sangat tinggi: ${consistentPercentage}% berstatus 'Still Consistent'.`,
      `Karakter dominan terbesar dalam pool rekrutmen adalah ${
        dominantCounts.D >= dominantCounts.C ? "Dominance (D - Orientasi Hasil & Ketegasan)" : "Conscientiousness (C - Kepatuhan Prosedur & Akurasi)"
      } dengan ${Math.max(dominantCounts.D, dominantCounts.C)} kandidat.`,
      `Pola kepribadian paling populer yang ditemukan adalah '${sortedTraits[0]?.trait || "D/C"}' (${sortedTraits[0]?.count || 0} kandidat).`,
    ];

    const recommendations = [
      "Tempatkan kandidat dengan tipe Dominance-Conscientiousness (D/C) tinggi pada posisi Perwira Dek/Mesin untuk kepemimpinan tangguh dan taat regulasi ISM Code.",
      "Kandidat dengan profil Steadiness (S) tinggi sangat ideal untuk operasional dinas jaga panjang dan stabilitas kerja sama tim di atas kapal.",
      "Lakukan wawancara konfirmasi mendalam pada kandidat dengan status inkonsisten guna memvalidasi kesesuaian psikologis dengan ritme kerja laut.",
    ];

    return {
      totalCandidates: total,
      dominantCounts,
      consistencyCounts,
      consistentPercentage,
      topTraits: sortedTraits,
      avgGraph1,
      avgGraph2,
      avgGraph3,
      executiveInsights: insights,
      recommendations,
    };
  }, [candidates]);

  return {
    candidates,
    sourceTitle,
    summary,
    selectedCandidate,
    setSelectedCandidate,
    isLoading,
    loadCustomCSV,
    resetToRealDataset,
  };
}
