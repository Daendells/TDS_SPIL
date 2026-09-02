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

// RFC 4180 Compliant Multi-line CSV Parser (Handles newlines inside quotes)
function parseRFC4180CSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      i++;
      continue;
    }

    if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function useDISCAnalytics(initialDataset: DISCCandidate[] = REAL_DISC_DATASET) {
  const [candidates, setCandidates] = useState<DISCCandidate[]>(initialDataset);
  const [sourceTitle, setSourceTitle] = useState<string>("SPM Rec - Assessment Resume (582 Kandidat Rekrutmen SPIL)");
  const [selectedCandidate, setSelectedCandidate] = useState<DISCCandidate | null>(initialDataset[0] || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load from User Uploaded CSV with Proper Multi-line Handling
  const loadCustomCSV = useCallback((csvText: string, filename: string) => {
    setIsLoading(true);
    try {
      const parsedRows = parseRFC4180CSV(csvText);
      if (parsedRows.length < 2) throw new Error("File CSV tidak memiliki baris data yang cukup.");

      const headers = parsedRows[0].map((h) => h.toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes("nama"));
      const nikIdx = headers.findIndex((h) => h.includes("identitas") || h.includes("ktp") || h.includes("nik"));
      const emailIdx = headers.findIndex((h) => h.includes("email"));
      const dateIdx = headers.findIndex((h) => h.includes("timestamp") || h.includes("date"));
      const traitIdx = headers.findIndex((h) => h.includes("traitm") || h.includes("trait"));
      const traitLIdx = headers.findIndex((h) => h.includes("traitl"));
      const traitPkIdx = headers.findIndex((h) => h.includes("traitp-k") || h.includes("traitp"));
      const konsIdx = headers.findIndex((h) => h.includes("kons fin") || h.includes("kons"));
      const grmdIdx = headers.findIndex((h) => h.includes("grmd"));
      const grmiIdx = headers.findIndex((h) => h.includes("grmi"));
      const grmsIdx = headers.findIndex((h) => h.includes("grms"));
      const grmcIdx = headers.findIndex((h) => h.includes("grmc"));
      const grldIdx = headers.findIndex((h) => h.includes("grld"));
      const grliIdx = headers.findIndex((h) => h.includes("grli"));
      const grlsIdx = headers.findIndex((h) => h.includes("grls"));
      const grlcIdx = headers.findIndex((h) => h.includes("grlc"));
      const pkdIdx = headers.findIndex((h) => h.includes("grp-kd"));
      const pkiIdx = headers.findIndex((h) => h.includes("grp-ki"));
      const pksIdx = headers.findIndex((h) => h.includes("grp-ks"));
      const pkcIdx = headers.findIndex((h) => h.includes("grp-kc"));
      const descWordsIdx = headers.findIndex((h) => h.includes("desc. words") || h.includes("desc"));
      const charIdx = headers.findIndex((h) => h.includes("character"));
      const motivIdx = headers.findIndex((h) => h.includes("motivation"));
      const jobIdx = headers.findIndex((h) => h.includes("job emphasis"));
      const g1Idx = headers.findIndex((h) => h.includes("graph i") && !h.includes("graph ii"));
      const g2Idx = headers.findIndex((h) => h.includes("graph ii"));

      const newCandidates: DISCCandidate[] = [];

      for (let i = 1; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const name = nameIdx !== -1 ? row[nameIdx] : `Kandidat ${i}`;
        if (!name || name.trim() === "") continue;

        const trait = traitIdx !== -1 ? row[traitIdx] || "D / I / S / C" : "D / I / S / C";
        let dominant: "D" | "I" | "S" | "C" = "D";
        if (trait.startsWith("I") || trait.includes("/ I")) dominant = "I";
        else if (trait.startsWith("S") || trait.includes("/ S")) dominant = "S";
        else if (trait.startsWith("C") || trait.includes("/ C")) dominant = "C";

        newCandidates.push({
          id: `DISC-${i.toString().padStart(4, "0")}`,
          name: name.trim(),
          nik: nikIdx !== -1 && row[nikIdx] ? row[nikIdx].trim() : "-",
          email: emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim() : "-",
          date: dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : new Date().toISOString().slice(0, 10),
          dominantType: dominant,
          traitM: trait.trim(),
          traitL: traitLIdx !== -1 && row[traitLIdx] ? row[traitLIdx].trim() : "-",
          traitPk: traitPkIdx !== -1 && row[traitPkIdx] ? row[traitPkIdx].trim() : "-",
          consistency: konsIdx !== -1 && row[konsIdx] ? row[konsIdx].trim() : "Still Consistent",
          graph1: {
            d: grmdIdx !== -1 ? Number(row[grmdIdx]) || 0 : 2,
            i: grmiIdx !== -1 ? Number(row[grmiIdx]) || 0 : 1,
            s: grmsIdx !== -1 ? Number(row[grmsIdx]) || 0 : 0,
            c: grmcIdx !== -1 ? Number(row[grmcIdx]) || 0 : 3,
          },
          graph2: {
            d: grldIdx !== -1 ? Number(row[grldIdx]) || 0 : 1,
            i: grliIdx !== -1 ? Number(row[grliIdx]) || 0 : 0,
            s: grlsIdx !== -1 ? Number(row[grlsIdx]) || 0 : 2,
            c: grlcIdx !== -1 ? Number(row[grlcIdx]) || 0 : 2,
          },
          graph3: {
            d: pkdIdx !== -1 ? Number(row[pkdIdx]) || 0 : 1,
            i: pkiIdx !== -1 ? Number(row[pkiIdx]) || 0 : 1,
            s: pksIdx !== -1 ? Number(row[pksIdx]) || 0 : -1,
            c: pkcIdx !== -1 ? Number(row[pkcIdx]) || 0 : 1,
          },
          descWords: descWordsIdx !== -1 && row[descWordsIdx] ? row[descWordsIdx].trim() : "Adaptif, fokus pada hasil, sistematis.",
          character: charIdx !== -1 && row[charIdx] ? row[charIdx].trim() : "Kandidat memiliki orientasi kerja yang terstruktur.",
          motivation: motivIdx !== -1 && row[motivIdx] ? row[motivIdx].trim() : "Pencapaian target kerja dan pengakuan profesional.",
          jobEmphasis: jobIdx !== -1 && row[jobIdx] ? row[jobIdx].trim() : "Penerapan sistem operasional dan standar keselamatan.",
          workMask: g1Idx !== -1 && row[g1Idx] ? row[g1Idx].trim() : "Fokus pada tugas dan efisiensi waktu kerja.",
          underPressure: g2Idx !== -1 && row[g2Idx] ? row[g2Idx].trim() : "Tetap berhati-hati dan mengutamakan prosedur keselamatan.",
        });
      }

      if (newCandidates.length > 0) {
        setCandidates(newCandidates);
        setSelectedCandidate(newCandidates[0]);
        setSourceTitle(`${filename} (${newCandidates.length} Kandidat)`);
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
