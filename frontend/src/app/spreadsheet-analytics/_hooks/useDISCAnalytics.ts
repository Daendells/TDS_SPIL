"use client";

import { useState, useMemo, useCallback } from "react";
import { DISCCandidate, REAL_DISC_DATASET } from "../_data/discDataset";

export interface RoleFitAssessment {
  deckOfficerFit: number; // 0 - 100
  engineOfficerFit: number; // 0 - 100
  watchkeepingFit: number; // 0 - 100
  crewCoordinationFit: number; // 0 - 100
  recommendedRole: string;
  recommendedDepartment: "Dek (Nakhoda/Mualim)" | "Mesin (KKM/Masinis)" | "Dinas Jaga & Navigasi" | "Operasional Kru & Logistik";
  roleMatchBadge: { label: string; color: string };
}

export interface CandidateCompetencyScore {
  leadershipAndCommand: { score: number; level: string; desc: string };
  stressResilience: { score: number; level: string; desc: string };
  complianceAndSOP: { score: number; level: string; desc: string };
  crewTeamwork: { score: number; level: string; desc: string };
}

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
  roleDistribution: {
    deckDept: number;
    engineDept: number;
    watchkeeping: number;
    crewCoordination: number;
  };
  avgStressShift: number;
  executiveInsights: string[];
  recommendations: string[];
}

// Safe numeric parser that handles comma decimals and string sanitization
function parseNumeric(val: any, fallback: number = 0): number {
  if (val === undefined || val === null || val === "") return fallback;
  const str = String(val).trim().replace(",", ".");
  if (!/[0-9]/.test(str)) return fallback;
  const num = Number(str.replace(/[^0-9.-]/g, ""));
  return isNaN(num) ? fallback : num;
}

// RFC 4180 Compliant Multi-line CSV Parser (Handles newlines inside quotes and BOM)
function parseRFC4180CSV(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, ""); // Remove UTF-8 BOM if present
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

// Helper: Calculate Role Fit for Maritime Positions
export function calculateRoleFit(c: DISCCandidate): RoleFitAssessment {
  // Normalize graph values (typically range from -7 to +7, centered around 0)
  const g3 = c.graph3 || { d: 0, i: 0, s: 0, c: 0 };
  const g2 = c.graph2 || { d: 0, i: 0, s: 0, c: 0 };

  // 1. Deck Officer (Command, Decision Speed D, Navigational Accuracy C, Stress D)
  const deckScore = Math.min(
    98,
    Math.max(
      45,
      Math.round(50 + (g3.d * 7) + (g3.c * 6) + (g2.d * 5) - (g3.s * 2))
    )
  );

  // 2. Engine Officer (Technical Rigor C, Calm Resilience S, System Compliance)
  const engineScore = Math.min(
    98,
    Math.max(
      45,
      Math.round(50 + (g3.c * 8) + (g3.s * 6) + (g2.c * 5) - (g3.i * 3))
    )
  );

  // 3. Watchkeeping & Bridge (Steady focus S, Procedure Compliance C, low impulsivity)
  const watchScore = Math.min(
    98,
    Math.max(
      45,
      Math.round(50 + (g3.s * 8) + (g3.c * 6) + (g2.s * 4) - (Math.abs(g3.d) * 2))
    )
  );

  // 4. Crew Coordination / Deck Rating (Communication I, Steadiness S, Morale)
  const crewScore = Math.min(
    98,
    Math.max(
      45,
      Math.round(50 + (g3.i * 8) + (g3.s * 5) + (g3.d * 3))
    )
  );

  const scores = [
    { role: "Perwira Dek / Nakhoda / Mualim", dept: "Dek (Nakhoda/Mualim)" as const, score: deckScore, badge: { label: "Perwira Dek", color: "bg-blue-50 text-blue-700 border-blue-200" } },
    { role: "Perwira Mesin / KKM / Masinis", dept: "Mesin (KKM/Masinis)" as const, score: engineScore, badge: { label: "Perwira Mesin", color: "bg-emerald-50 text-emerald-700 border-emerald-200" } },
    { role: "Dinas Jaga / Navigasi & Radio", dept: "Dinas Jaga & Navigasi" as const, score: watchScore, badge: { label: "Dinas Jaga", color: "bg-indigo-50 text-indigo-700 border-indigo-200" } },
    { role: "Operasional Kru / Logistik Pelabuhan", dept: "Operasional Kru & Logistik" as const, score: crewScore, badge: { label: "Kru & Logistik", color: "bg-amber-50 text-amber-700 border-amber-200" } },
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  return {
    deckOfficerFit: deckScore,
    engineOfficerFit: engineScore,
    watchkeepingFit: watchScore,
    crewCoordinationFit: crewScore,
    recommendedRole: best.role,
    recommendedDepartment: best.dept,
    roleMatchBadge: best.badge,
  };
}

// Helper: Calculate 4-Pillar Competencies for Candidate
export function calculateCompetencies(c: DISCCandidate): CandidateCompetencyScore {
  const g1 = c.graph1 || { d: 0, i: 0, s: 0, c: 0 };
  const g2 = c.graph2 || { d: 0, i: 0, s: 0, c: 0 };
  const g3 = c.graph3 || { d: 0, i: 0, s: 0, c: 0 };

  // Leadership (D + I balance)
  const lScore = Math.min(99, Math.max(40, Math.round(50 + (g3.d * 8) + (g3.i * 4))));
  // Stress Resilience (Stability between G1 and G2, S and D under pressure)
  const shift = Math.sqrt(
    Math.pow(g1.d - g2.d, 2) +
    Math.pow(g1.i - g2.i, 2) +
    Math.pow(g1.s - g2.s, 2) +
    Math.pow(g1.c - g2.c, 2)
  );
  const sScore = Math.min(99, Math.max(35, Math.round(85 - (shift * 4) + (g2.s * 3))));
  // Compliance (C in G2 and G3)
  const cScore = Math.min(99, Math.max(40, Math.round(50 + (g3.c * 8) + (g2.c * 4))));
  // Teamwork (I and S)
  const tScore = Math.min(99, Math.max(40, Math.round(50 + (g3.i * 6) + (g3.s * 6))));

  const getLevel = (score: number) => {
    if (score >= 80) return "Sangat Tinggi (Optimal)";
    if (score >= 65) return "Baik (Memenuhi Standar)";
    if (score >= 50) return "Cukup (Perlu Monitoring)";
    return "Kurang (Butuh Pelatihan Khusus)";
  };

  return {
    leadershipAndCommand: {
      score: lScore,
      level: getLevel(lScore),
      desc: lScore >= 75
        ? "Mampu mengambil keputusan tegas, berani memimpin manuver kapal, dan mengarahkan bawahan dengan otoritas jelas."
        : "Cenderung memimpin secara kolaboratif atau membutuhkan arahan dari perwira senior untuk keputusan kritis.",
    },
    stressResilience: {
      score: sScore,
      level: getLevel(sScore),
      desc: sScore >= 75
        ? "Respon stabil saat cuaca buruk atau krisis mesin. Pola perilaku tidak mengalami distorsi tajam di bawah tekanan."
        : "Menunjukkan perubahan reaksi signifikan di bawah tekanan. Memerlukan pendampingan perwira senior saat situasi darurat.",
    },
    complianceAndSOP: {
      score: cScore,
      level: getLevel(cScore),
      desc: cScore >= 75
        ? "Sangat disiplin terhadap checklist ISM Code, regulasi SOLAS, MARPOL, serta dokumentasi pelayaran logistik SPIL."
        : "Fokus pada fleksibilitas kerja namun perlu pengawasan berkala pada kepatuhan administrasi dan checklist baku.",
    },
    crewTeamwork: {
      score: tScore,
      level: getLevel(tScore),
      desc: tScore >= 75
        ? "Membangun atmosfer kerja positif, menjaga komunikasi harmonis antardepartemen kapal dalam pelayaran panjang."
        : "Cenderung fokus mandiri pada tugas teknis spesifik dibanding koordinasi sosial interpersonal di kapal.",
    },
  };
}

// Helper: Generate Targeted Interview Questions for Assessor
export function generateInterviewQuestions(c: DISCCandidate): string[] {
  const questions: string[] = [];
  const g1 = c.graph1 || { d: 0, i: 0, s: 0, c: 0 };
  const g2 = c.graph2 || { d: 0, i: 0, s: 0, c: 0 };

  if (c.consistency.includes("Note") || c.consistency.includes("Incomplete")) {
    questions.push(
      "Asesmen menunjukkan catatan konfirmasi konsistensi: Tanyakan contoh situasi nyata ketika kandidat harus memilih antara kecepatan kerja (D) vs ketelitian prosedur (C) saat dinas di kapal."
    );
  }

  if (g1.d > g2.d + 1.5) {
    questions.push(
      "Kandidat menampilkan topeng kerja yang tegas di depan publik namun menjadi lebih pasif saat tertekan: Gali bagaimana ia menangani konflik langsung dengan kru bawahan."
    );
  } else if (g2.d > g1.d + 1.5) {
    questions.push(
      "Kandidat cenderung menjadi jauh lebih asertif/keras saat di bawah tekanan darurat: Tanyakan bagaimana ia mengontrol emosi agar komunikasi tetap jernih ke perwira lain."
    );
  }

  if (c.dominantType === "C") {
    questions.push(
      "Profil Conscientiousness dominan: Bagaimana kandidat mengatasi situasi jika terjadi ketidaksesuaian prosedur operasional akibat keterbatasan waktu di pelabuhan?"
    );
  } else if (c.dominantType === "D") {
    questions.push(
      "Profil Dominance dominan: Bagaimana kandidat menerima kritik atau masukan teknis dari perwira mesin/masinis saat keputusan operasional mendesak?"
    );
  } else {
    questions.push(
      "Bagaimana kandidat menjaga fokus dan stamina mental saat menjalani jadwal dinas jaga malam (watchkeeping) berulang di laut lepas?"
    );
  }

  questions.push(
    "Apa faktor pendorong utama yang membuat kandidat merasa paling produktif dan termotivasi saat bertugas di armada kapal PT SPIL?"
  );

  return questions;
}

export function useDISCAnalytics(initialDataset: DISCCandidate[] = REAL_DISC_DATASET) {
  const [candidates, setCandidates] = useState<DISCCandidate[]>(initialDataset);
  const [sourceTitle, setSourceTitle] = useState<string>("SPM Rec - Assessment Resume (582 Kandidat Rekrutmen SPIL)");
  const [selectedCandidate, setSelectedCandidate] = useState<DISCCandidate | null>(initialDataset[0] || null);
  const [comparisonCandidate, setComparisonCandidate] = useState<DISCCandidate | null>(initialDataset[1] || null);
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
      
      let traitIdx = headers.findIndex((h) => h.includes("traitm") || h.includes("trait_m") || h.includes("trait m"));
      if (traitIdx === -1) traitIdx = headers.findIndex((h) => h.includes("trait"));
      const traitLIdx = headers.findIndex((h) => h.includes("traitl") || h.includes("trait_l"));
      const traitPkIdx = headers.findIndex((h) => h.includes("traitp-k") || h.includes("traitp") || h.includes("trait_pk"));
      
      let konsIdx = headers.findIndex((h) => h.includes("kons fin") || h.includes("kons_fin") || h.includes("consistency"));
      if (konsIdx === -1) konsIdx = headers.findIndex((h) => h.includes("kons"));
      
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

        const rawKons = konsIdx !== -1 && row[konsIdx] ? row[konsIdx].trim() : "";
        const consistencyVal = rawKons === "" ? "Incomplete" : rawKons;

        const trait = traitIdx !== -1 && row[traitIdx] ? row[traitIdx].trim() : "D / C";
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
          traitM: trait,
          traitL: traitLIdx !== -1 && row[traitLIdx] ? row[traitLIdx].trim() : "-",
          traitPk: traitPkIdx !== -1 && row[traitPkIdx] ? row[traitPkIdx].trim() : "-",
          consistency: consistencyVal,
          graph1: {
            d: grmdIdx !== -1 ? parseNumeric(row[grmdIdx], 2) : 2,
            i: grmiIdx !== -1 ? parseNumeric(row[grmiIdx], 1) : 1,
            s: grmsIdx !== -1 ? parseNumeric(row[grmsIdx], 0) : 0,
            c: grmcIdx !== -1 ? parseNumeric(row[grmcIdx], 3) : 3,
          },
          graph2: {
            d: grldIdx !== -1 ? parseNumeric(row[grldIdx], 1) : 1,
            i: grliIdx !== -1 ? parseNumeric(row[grliIdx], 0) : 0,
            s: grlsIdx !== -1 ? parseNumeric(row[grlsIdx], 2) : 2,
            c: grlcIdx !== -1 ? parseNumeric(row[grlcIdx], 2) : 2,
          },
          graph3: {
            d: pkdIdx !== -1 ? parseNumeric(row[pkdIdx], 1) : 1,
            i: pkiIdx !== -1 ? parseNumeric(row[pkiIdx], 1) : 1,
            s: pksIdx !== -1 ? parseNumeric(row[pksIdx], -1) : -1,
            c: pkcIdx !== -1 ? parseNumeric(row[pkcIdx], 1) : 1,
          },
          descWords: descWordsIdx !== -1 && row[descWordsIdx] ? row[descWordsIdx].trim() : "Adaptif, fokus pada hasil, sistematis.",
          character: charIdx !== -1 && row[charIdx] ? row[charIdx].trim() : (consistencyVal === "Incomplete" ? "Data asesmen kandidat belum lengkap." : "Kandidat memiliki orientasi kerja yang terstruktur."),
          motivation: motivIdx !== -1 && row[motivIdx] ? row[motivIdx].trim() : "-",
          jobEmphasis: jobIdx !== -1 && row[jobIdx] ? row[jobIdx].trim() : "-",
          workMask: g1Idx !== -1 && row[g1Idx] ? row[g1Idx].trim() : "-",
          underPressure: g2Idx !== -1 && row[g2Idx] ? row[g2Idx].trim() : "-",
        });
      }

      if (newCandidates.length > 0) {
        setCandidates(newCandidates);
        setSelectedCandidate(newCandidates[0]);
        setComparisonCandidate(newCandidates[1] || newCandidates[0]);
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
    setComparisonCandidate(REAL_DISC_DATASET[1] || REAL_DISC_DATASET[0]);
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
        roleDistribution: { deckDept: 0, engineDept: 0, watchkeeping: 0, crewCoordination: 0 },
        avgStressShift: 0,
        executiveInsights: [],
        recommendations: [],
      };
    }

    const dominantCounts = { D: 0, I: 0, S: 0, C: 0 };
    const consistencyCounts: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};
    const roleDistribution = { deckDept: 0, engineDept: 0, watchkeeping: 0, crewCoordination: 0 };

    let sumG1 = { d: 0, i: 0, s: 0, c: 0 };
    let sumG2 = { d: 0, i: 0, s: 0, c: 0 };
    let sumG3 = { d: 0, i: 0, s: 0, c: 0 };
    let totalStressShift = 0;

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

      // Stress Shift
      const shift = Math.sqrt(
        Math.pow((c.graph1.d || 0) - (c.graph2.d || 0), 2) +
        Math.pow((c.graph1.i || 0) - (c.graph2.i || 0), 2) +
        Math.pow((c.graph1.s || 0) - (c.graph2.s || 0), 2) +
        Math.pow((c.graph1.c || 0) - (c.graph2.c || 0), 2)
      );
      totalStressShift += shift;

      // Role match
      const fit = calculateRoleFit(c);
      if (fit.recommendedDepartment === "Dek (Nakhoda/Mualim)") roleDistribution.deckDept++;
      else if (fit.recommendedDepartment === "Mesin (KKM/Masinis)") roleDistribution.engineDept++;
      else if (fit.recommendedDepartment === "Dinas Jaga & Navigasi") roleDistribution.watchkeeping++;
      else roleDistribution.crewCoordination++;
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

    const avgStressShift = Number((totalStressShift / total).toFixed(2));

    // Auto generated executive insights
    const insights = [
      `Sebanyak ${total} profil kandidat rekrutmen telah dianalisis melalui asesmen psikometri DISC terstandarisasi.`,
      `Tingkat reliabilitas jawaban kandidat: ${consistentPercentage}% berstatus 'Still Consistent' dan ${Math.round(((consistencyCounts["Note for Assessor"] || 0) / total) * 100)}% memerlukan konfirmasi wawancara teknis.`,
      `Kesesuaian Armada: ${roleDistribution.deckDept} kandidat (${Math.round((roleDistribution.deckDept / total) * 100)}%) cocok untuk Departemen Dek, ${roleDistribution.engineDept} kandidat (${Math.round((roleDistribution.engineDept / total) * 100)}%) untuk Departemen Mesin.`,
      `Rata-rata Stress Volatility Shift populasi berada di level ${avgStressShift} (Pergeseran adaptif moderat saat menghadapi tekanan operasional di laut).`,
    ];

    const recommendations = [
      "Prioritaskan kandidat berprofil Dominance-Conscientiousness (D/C) tinggi untuk penugasan Nakhoda & Mualim I guna kepemimpinan tegas dan taat regulasi ISM Code.",
      "Untuk Departemen Mesin (KKM & Masinis), pilih kandidat berprofil Conscientiousness-Steadiness (C/S) dengan skor ketelitian teknis di atas rata-rata populasi.",
      "Gunakan panduan pertanyaan wawancara terfokus (Interview Confirmation Guide) pada kandidat berstatus 'Note for Assessor' sebelum penugasan kapal resmi.",
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
      roleDistribution,
      avgStressShift,
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
    comparisonCandidate,
    setComparisonCandidate,
    isLoading,
    loadCustomCSV,
    resetToRealDataset,
  };
}
