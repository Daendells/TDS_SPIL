// Package prompt menyediakan prompt builder yang terpisah per fitur.
// Setiap fungsi mengembalikan system prompt yang siap dikirim ke AI provider.
package prompt

import (
	"fmt"
	"strings"

	"backend/internal/models/web"
)

// DefaultSPILRoles adalah daftar standar role kru kapal / maritim di PT Salam Pacific Indonesia Lines (PT SPIL).
var DefaultSPILRoles = []web.TargetRoleItem{
	{Role: "NAKHODA"},
	{Role: "KKM"},
	{Role: "MUALIM I"},
	{Role: "MUALIM II"},
	{Role: "MUALIM III"},
	{Role: "MUALIM IV"},
	{Role: "MASINIS I"},
	{Role: "MASINIS II"},
	{Role: "MASINIS III"},
	{Role: "MASINIS IV"},
	{Role: "ELECTRICIAN"},
	{Role: "FITTER"},
	{Role: "MANDOR MESIN"},
	{Role: "SERANG"},
	{Role: "KELASI"},
	{Role: "JURU MUDI"},
	{Role: "JURU MINYAK"},
	{Role: "JURU MASAK I"},
	{Role: "JURU MASAK II"},
	{Role: "PELAYAN"},
	{Role: "MARKONIS"},
	{Role: "KADET DEK"},
	{Role: "KADET MESIN"},
	{Role: "KADET ELECTRONIC"},
	{Role: "EXTRA NAKHODA"},
	{Role: "EXTRA KKM"},
	{Role: "EXT. MUALIM I"},
	{Role: "EXT. MUALIM II"},
	{Role: "EXT. MUALIM III"},
	{Role: "EXT. MASINIS I"},
	{Role: "EXT. MASINIS II"},
}

// Keep DefaultITRoles for backward compatibility if needed, aliased to DefaultSPILRoles
var DefaultITRoles = DefaultSPILRoles

// BuildCandidateAnalysisPrompt membuat system prompt untuk menganalisis 1 CV pelaut/kru kapal
// terhadap batch role maritim PT SPIL yang diberikan.
func BuildCandidateAnalysisPrompt(candidateName string, roles []web.TargetRoleItem) string {
	if len(roles) == 0 {
		roles = DefaultSPILRoles
	}

	var rolesFormatted []string
	for _, r := range roles {
		desc := strings.TrimSpace(r.Description)
		if desc == "" {
			desc = "(Gunakan kriteria standar kompetensi perkapalan & maritim PT SPIL)"
		}
		rolesFormatted = append(rolesFormatted, fmt.Sprintf("- Role: %s\n  Deskripsi/Kriteria: %s", r.Role, desc))
	}

	rolesText := strings.Join(rolesFormatted, "\n")

	providedName := strings.TrimSpace(candidateName)
	nameInstruction := `EKSTRAK NAMA KANDIDAT: Temukan nama lengkap asli pemilik CV dari dalam teks CV (misal: "Budi Santoso", "Davin", dll) dan isi field "candidate_name" dengannya.`
	if providedName != "" && providedName != "Kandidat" {
		nameInstruction = fmt.Sprintf(`EKSTRAK NAMA KANDIDAT: Cari nama lengkap asli di dalam CV. Jika ditemukan nama lengkap asli (misal: "Budi Santoso"), gunakan nama tersebut. Jika tidak ada, gunakan nama: "%s".`, providedName)
	}

	return fmt.Sprintf(`Anda adalah Senior Maritime HR Analyst & Expert Recruitment Specialist di PT Salam Pacific Indonesia Lines (PT SPIL), perusahaan pelayaran peti kemas & logistik maritim terkemuka di Indonesia.

TUGAS ANDA:
Analisis CV pelaut / kandidat kru kapal dan evaluasi kecocokannya terhadap SETIAP ROLE PERKAPALAN PT SPIL yang terdaftar di bawah ini secara individual, objektif, dan berbasis standar maritim industri pelayaran.

ATURAN PENTING:
1. Seluruh output HARUS dalam BAHASA INDONESIA baku dan profesional.
2. KONTEKS PERUSAHAAN (PT SPIL): Evaluasi kesesuaian berdasarkan standar maritim PT SPIL (sertifikasi STCW, COP, COC, pengalaman layar / sea time, kesiapan operasional kapal, keahlian teknik mesin kapal / navigasi dek).
3. %s
4. Wajib buat analisis untuk SETIAP ROLE yang terdaftar di bawah ini (%d role). Jangan ada role yang terlewat.
5. Hitung Fit Score (0-100) berdasarkan Kualifikasi & Sertifikasi Maritim (35%%), Pengalaman Layar/Sea Time (30%%), Keahlian Teknis Operasional (20%%), dan Pendidikan/Kadet (15%%).
6. Berikan poin kekuatan, area pengembangan, skill gap, dan alasan secara ringkas dan tepat sasaran.

DAFTAR ROLE PERKAPALAN PT SPIL YANG HARUS DI-EVALUASI:
%s

FORMAT OUTPUT (JSON murni, tanpa markdown codeblock):
{
  "candidate_name": "<nama lengkap kandidat asli>",
  "profile_summary": "<ringkasan profil maritim kandidat 1-2 kalimat>",
  "best_fit_role": "<nama role perkapalan dengan skor tertinggi>",
  "best_fit_score": <angka 0-100>,
  "role_fits": [
    {
      "role": "<nama role persis sesuai daftar>",
      "fit_score": <angka 0-100>,
      "strengths": ["<kekuatan maritim 1>", "<kekuatan 2>"],
      "weaknesses": ["<area pengembangan 1>"],
      "skill_gap": ["<skill/sertifikasi gap 1>"],
      "reason": "<alasan singkat 1-2 kalimat spesifik konteks perkapalan PT SPIL>"
    }
  ]
}

Hasilkan HANYA JSON murni. Jangan tambahkan teks apapun di luar JSON.`, nameInstruction, len(roles), rolesText)
}

// CandidateAnalysisUserMessage membuat user message untuk Candidate Analysis.
func CandidateAnalysisUserMessage(cvText string) string {
	return fmt.Sprintf("Berikut adalah teks CV pelaut / kandidat kru kapal PT SPIL yang dianalisis:\n\n%s", cvText)
}
