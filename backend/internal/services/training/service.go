package training

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/AlexGames73/unioffice-free/measurement"
	"github.com/AlexGames73/unioffice-free/presentation"
	"github.com/jung-kurt/gofpdf"
	"github.com/sirupsen/logrus"
)

type Service struct {
	log     *logrus.Logger
	http    *http.Client
	apiKey  string
	model   string
	pubBase string
	outDir  string
}

func NewTrainingService(log *logrus.Logger, apiKey, model, pubBase string) *Service {
	if apiKey == "" {
		log.Warn("GEMINI_API_KEY kosong - panggilan LLM akan gagal")
	}
	if model == "" {
		model = "gemini-2.0-flash"
	}
	if pubBase == "" {
		pubBase = "http://localhost:8080"
	}

	outDir := "./public/materi"
	_ = os.MkdirAll(outDir, 0o755)

	return &Service{
		log:     log,
		http:    &http.Client{Timeout: 180 * time.Second},
		apiKey:  apiKey,
		model:   model,
		pubBase: strings.TrimRight(pubBase, "/"),
		outDir:  outDir,
	}
}

type GenerateInput struct {
	Kode              string
	TopikTraining     string
	Kompetensi        string
	Referensi         string
	Level             int
	Tools             string
	DeskripsiPerilaku string
}

type Plan struct {
	Title      string     `json:"title"`
	Overview   Overview   `json:"overview"`
	Slides     []Slide    `json:"slides"`
	Activities []Activity `json:"activities,omitempty"`
	Assessment []QA       `json:"assessment,omitempty"`
	References []string   `json:"references,omitempty"`
}

type Overview struct {
	Goals    []string `json:"goals"`
	Outcomes []string `json:"outcomes"`
	Duration string   `json:"duration"`
	Audience string   `json:"audience"`
}

type Slide struct {
	Heading      string   `json:"heading"`
	Bullets      []string `json:"bullets"`
	SpeakerNotes string   `json:"speaker_notes"`
	SlideType    string   `json:"slide_type"`
}

type Activity struct {
	Title        string `json:"title"`
	Instructions string `json:"instructions"`
	Time         string `json:"time"`
}

type QA struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

// DetailedContent represents the comprehensive learning guide structure
type DetailedContent struct {
	Title           string                `json:"title"`
	Introduction    string                `json:"introduction"`
	Sections        []DetailedSection     `json:"sections"`
	PracticalGuide  PracticalGuide        `json:"practical_guide"`
	CaseStudies     []DetailedCaseStudy   `json:"case_studies"`
	FAQ             []DetailedFAQ         `json:"faq"`
	Resources       ResourceSection       `json:"resources"`
	Conclusion      string                `json:"conclusion"`
}

type DetailedSection struct {
	Title       string   `json:"title"`
	Content     string   `json:"content"`      // Super lengkap, 500-1000 kata per section
	KeyPoints   []string `json:"key_points"`
	Examples    []string `json:"examples"`
	Exercises   string   `json:"exercises"`
}

type PracticalGuide struct {
	StepByStep  []PracticalStep `json:"step_by_step"`
	Tips        []string        `json:"tips"`
	CommonPitfalls []string     `json:"common_pitfalls"`
}

type PracticalStep struct {
	StepNumber  int      `json:"step_number"`
	Title       string   `json:"title"`
	Description string   `json:"description"`   // Detail lengkap
	Examples    []string `json:"examples"`
}

type DetailedCaseStudy struct {
	Title       string   `json:"title"`
	Context     string   `json:"context"`
	Challenge   string   `json:"challenge"`
	Solution    string   `json:"solution"`
	Outcome     string   `json:"outcome"`
	Lessons     []string `json:"lessons"`
}

type DetailedFAQ struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`  // Jawaban super detail dan lengkap
}

type ResourceSection struct {
	Books       []string `json:"books"`
	Articles    []string `json:"articles"`
	Videos      []string `json:"videos"`
	Tools       []string `json:"tools"`
	Additional  []string `json:"additional"`
}

func (s *Service) buildPrompt(in GenerateInput) string {
	topicType := s.determineTopicType(in.TopikTraining, in.Tools)

	// Build structured context sections
	contextSection := s.buildContextSection(in, topicType)
	focusSection := s.buildFocusSection(in)
	structureSection := s.buildStructureSection()
	contentRequirements := s.buildContentRequirements()
	
	basePrompt := fmt.Sprintf(`You are a professional instructional designer creating high-quality training content in Indonesian. Generate a comprehensive training plan following the OBJECTIVE → KONSEP → LANGKAH → STUDI KASUS → PENUTUP structure.

%s

%s

%s

%s

%s

%s

%s

OUTPUT FORMAT - JSON VALID:
Return ONLY valid JSON without any markdown formatting, comments, or additional text:

{
  "title": "Judul Pelatihan yang Menarik dan Deskriptif",
  "overview": {
    "goals": ["Tujuan 1 yang spesifik dan terukur", "Tujuan 2 yang konkret dan achievable"],
    "outcomes": ["Hasil pembelajaran 1 yang dapat diobservasi", "Hasil pembelajaran 2 yang dapat diukur"],
    "duration": "90-120 menit",
    "audience": "Perwira kapal container SPIL dengan level kompetensi tertentu"
  },
  "slides": [
    {
      "heading": "OBJECTIVE: TUJUAN PEMBELAJARAN TRAINING INI",
      "bullets": [
        "Apa yang Akan Anda Pelajari dalam Training Ini?",
        "Training ini dirancang khusus untuk membekali perwira kapal container SPIL dengan kemampuan [topik training] yang sistematis dan terstruktur. Anda akan mempelajari tools dan metode yang sudah terbukti efektif di industri maritim internasional. Setelah mengikuti training ini, Anda akan mampu menerapkan ilmu yang didapat langsung di kapal untuk meningkatkan efektivitas operasional. Kemampuan ini akan menjadi nilai tambah signifikan untuk pengembangan karir Anda sebagai perwira profesional.",
        "",
        "• Kompetensi yang Akan Dikembangkan",
        "Kompetensi utama yang akan dikembangkan adalah [nama kompetensi] yang merupakan skill kritis untuk perwira kapal modern. Kemampuan ini mencakup aspek analitis, decision-making, dan implementasi praktis di lapangan. Dengan menguasai kompetensi ini, Anda akan lebih siap menghadapi berbagai tantangan operasional yang kompleks. Skill ini juga sangat dihargai oleh manajemen dan menjadi faktor penting dalam promosi karir.",
        "",
        "• Target Hasil yang Terukur",
        "Setelah training ini, Anda diharapkan mampu: (1) mengidentifikasi dan mendefinisikan masalah dengan akurat, (2) menggunakan tools/metode yang diajarkan secara mandiri, (3) mengambil keputusan berbasis data dan fakta, bukan asumsi. Keberhasilan akan diukur melalui assessment di akhir training dan observasi implementasi di kapal. Target minimal adalah 80% pemahaman konsep dan kemampuan aplikasi dasar."
      ],
      "speaker_notes": "Mulai dengan greeting dan perkenalan singkat. Jelaskan mengapa training ini penting untuk karir mereka. Tanyakan ekspektasi peserta dan catat untuk dibahas di akhir sesi. Gunakan 5-7 menit untuk bagian objective ini.",
      "slide_type": "objective"
    }
  ],
  "activities": [
    {
      "title": "Praktik Langsung: Aplikasi [Tools/Metode] di Skenario Kapal",
      "instructions": "Peserta dibagi dalam kelompok 3-4 orang. Setiap kelompok akan mendapat skenario masalah berbeda yang umum terjadi di kapal container. Gunakan worksheet yang disediakan untuk menerapkan langkah-langkah yang sudah dipelajari. Waktu diskusi 10 menit, presentasi per kelompok 3 menit. Fasilitator memberikan feedback untuk setiap presentasi.",
      "time": "20 menit"
    }
  ],
  "assessment": [
    {
      "question": "Dalam situasi dimana pompa ballast gagal saat proses loading dan crew saling menyalahkan, langkah pertama apa yang harus Anda lakukan sebagai Chief Officer menurut metode yang dipelajari?",
      "answer": "Langkah pertama adalah IDENTIFIKASI MASALAH dengan jelas dan spesifik menggunakan format 5W1H. Jangan langsung menyalahkan siapapun karena ini akan membuat crew defensive. Kumpulkan semua stakeholder yang relevan untuk memastikan pemahaman yang sama tentang apa sebenarnya yang terjadi. Dokumentasikan fakta dari log book dan wawancara crew dengan pertanyaan terbuka. Baru setelah masalah terdefinisi dengan jelas, lanjutkan ke langkah analisis berikutnya."
    }
  ],
  "references": [
    "Maritime Leadership: Best Practices for Ship Officers - IMO Guidelines 2023",
    "Problem Solving Techniques in Maritime Operations - Indonesian Maritime Academy Publication"
  ]
}

%s`,
		contextSection,
		focusSection,
		structureSection,
		contentRequirements,
		s.getTopicSpecificGuidelines(topicType),
		s.getExampleSection(),
	)

	return basePrompt
}

// buildContextSection creates the training context section
func (s *Service) buildContextSection(in GenerateInput, topicType string) string {
	return fmt.Sprintf(`KONTEKS PELATIHAN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KODE TRAINING      : %s
TOPIK PELATIHAN    : %s
KOMPETENSI TARGET  : %s
LEVEL PESERTA      : %d (1=Pemula, 2=Menengah, 3=Mahir)
TOOLS/MODEL/METODE : %s
TIPE KONTEN        : %s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
		in.Kode,
		in.TopikTraining,
		in.Kompetensi,
		in.Level,
		valueOrDash(in.Tools),
		topicType,
	)
}

// buildFocusSection emphasizes the main training focus
func (s *Service) buildFocusSection(in GenerateInput) string {
	keyword := in.DeskripsiPerilaku
	if keyword == "" {
		keyword = extractKeyword(in.Referensi)
	}
	optionalRef := extractOptionalReferensi(in.Referensi)
	
	return fmt.Sprintf(`FOKUS UTAMA TRAINING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. TOPIK TRAINING SEBAGAI INTI MATERI:
   "%s" adalah core topic yang WAJIB menjadi benang merah di seluruh slide.
   - Setiap slide HARUS mengacu kembali ke topik ini
   - Gunakan variasi kata/frasa yang tetap relate dengan topik
   - Pastikan peserta memahami relevance topik dengan pekerjaan mereka

2. TOOLS/METODE SEBAGAI INSTRUMEN:
   "%s" adalah tools/model/framework yang digunakan untuk achieve topik training.
   - Jelaskan HOW tools ini mendukung pencapaian topik
   - Berikan step-by-step cara menggunakan tools
   - Sertakan praktik terbaik dan common mistakes dalam penggunaan tools
   - Tunjukkan hubungan langsung: Tools → Implementasi → Hasil terkait Topik

3. DESKRIPSI PERILAKU SEBAGAI OUTCOME:
   KEYWORD PERILAKU: "%s"
   Ini adalah behavioral indicator atau expected outcome yang harus dicapai.
   - Setiap learning objective harus tie back ke keyword ini
   - Case study harus demonstrate perilaku ini in action
   - Assessment harus measure apakah peserta bisa exhibit perilaku ini
   - Action items di closing harus actionable untuk develop perilaku ini

4. ⭐ REFERENSI TAMBAHAN (Opsional - SANGAT PENTING!):
   %s
   %s
   
   CATATAN KRITIS UNTUK REFERENSI TAMBAHAN:
   %s
   
   INSTRUKSI KHUSUS PENGGUNAAN REFERENSI:
   - SEMUA konten WAJIB strictly follow dan based on referensi yang disebutkan
   - Mention nama buku/sumber/author secara eksplisit di MINIMAL 3 slide berbeda
   - Gunakan konsep, framework, atau terminologi PERSIS dari referensi tersebut
   - Berikan quote atau highlight key points dari referensi (jika applicable)
   - Tunjukkan bagaimana referensi ini applicable dalam konteks maritime/kapal SPIL
   - Jangan generic - harus specific ke referensi yang disebutkan
   - Setiap contoh dan studi kasus harus mengacu pada framework/konsep dari referensi

INTEGRASI KETIGA ELEMEN:
Topik Training + Tools/Metode + Deskripsi Perilaku = Materi Training yang Kohesif
   
Contoh flow yang baik:
- OBJECTIVE: "Mampu [Deskripsi Perilaku] dengan menerapkan [Tools] dalam konteks [Topik Training]"
- KONSEP: Jelaskan fundamental [Topik Training] dan bagaimana [Tools] relevant
- LANGKAH: Step-by-step menggunakan [Tools] untuk implement [Topik Training]
- STUDI KASUS: Real scenario yang show [Deskripsi Perilaku] achieved melalui [Tools] dan [Topik Training]
- PENUTUP: Ringkas connection antara [Topik]+[Tools]+[Perilaku] dan next steps
`,
		in.TopikTraining,
		valueOrDash(in.Tools),
		keyword,
		func() string {
			if optionalRef != "-" {
				return fmt.Sprintf("REFERENSI: %s", optionalRef)
			}
			return "Tidak ada referensi tambahan yang spesifik."
		}(),
		func() string {
			if optionalRef != "-" {
				return "PENTING: Gunakan referensi ini sebagai SUMBER UTAMA untuk seluruh materi training."
			}
			return "Fokus sepenuhnya pada Topik Training, Tools/Metode, dan Deskripsi Perilaku."
		}(),
		func() string {
			if optionalRef != "-" {
				return `JIKA ADA REFERENSI SPESIFIK (BUKU/SUMBER):
   1. Buat 1-2 SLIDE KHUSUS membahas framework/konsep dari referensi tersebut
   2. WAJIB mention nama buku/author/sumber di minimal 3 slide berbeda:
      - Di Slide Objective: "Berdasarkan framework dari [Nama Buku/Author]..."
      - Di Slide Konsep: "Menurut [Nama Buku], konsep ini..."
      - Di Slide Tools/Steps: "Seperti yang dijelaskan dalam [Referensi]..."
      - Di Slide Studi Kasus: "Implementasi konsep [Nama Buku] dalam kasus..."
   3. Gunakan terminologi PERSIS dari referensi (tidak diparafrase)
   4. Berikan quote singkat atau key takeaway dari referensi di speaker notes
   5. SEMUA contoh dan analisis HARUS based on framework/konsep dari referensi
   6. Adaptasikan konsep referensi ke konteks maritime/kapal SPIL secara eksplisit
   7. Jangan tambah teori lain yang tidak dari referensi tersebut
   
   CONTOH MENTION YANG BENAR:
   SALAH: "Ada beberapa framework untuk komunikasi..."
   BENAR: "Framework GRPI dari Patrick Lencioni menjelaskan 4 komponen teamwork..."
   
   SALAH: "Komunikasi efektif memerlukan..."
   BENAR: "Menurut buku 'Crucial Conversations', komunikasi efektif memerlukan..."
   
   SALAH: "Ada teknik untuk meningkatkan trust..."
   BENAR: "Stephen Covey dalam 'The Speed of Trust' mengidentifikasi 13 perilaku trust..."
   
   INTI: Setiap slide harus clearly reference the source material!`
			}
			return ""
		}(),
	)
}

// buildStructureSection defines the slide structure
func (s *Service) buildStructureSection() string {
	return `STRUKTUR SLIDE WAJIB (13-15 SLIDE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PENTING: WAJIB BUAT MINIMAL 13 SLIDE, MAKSIMAL 15 SLIDE!
Ini adalah PPT untuk video training online dengan peserta perwira kapal container (SPIL).

SLIDE 1: JUDUL (slide_type: "opening")
   ├─ Judul training yang menarik dan profesional
   ├─ Sub-judul: Nama kompetensi yang dikembangkan
   ├─ Target peserta: Perwira kapal container SPIL
   └─ Durasi training yang diharapkan

SLIDE 2: OBJECTIVE (slide_type: "objective")
   ├─ Tujuan pembelajaran yang SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
   ├─ Kompetensi yang akan dikembangkan
   ├─ Learning outcomes yang konkret dan terukur
   ├─ Benefit yang akan didapat peserta setelah mengikuti training
   └─ JIKA ADA REFERENSI: Mention framework/buku yang menjadi basis training

SLIDE 3: KONSEP (slide_type: "concept")
   ├─ Definisi dan penjelasan detail tentang topik training
   ├─ JIKA ADA REFERENSI: Jelaskan konsep DARI referensi tersebut dengan mention eksplisit
   ├─ Mengapa topik ini penting untuk perwira kapal
   ├─ Konteks dan relevansi dengan pekerjaan sehari-hari di kapal
   └─ Framework atau model yang akan digunakan (DARI REFERENSI jika ada)

SLIDE 4: CHALLENGES/TANTANGAN (slide_type: "challenges")
   ├─ Tantangan umum yang dihadapi terkait topik ini
   ├─ Dampak jika tantangan tidak diatasi
   ├─ Contoh situasi nyata di kapal container
   └─ Mengapa perlu tools/metode untuk mengatasi tantangan ini

SLIDE 5-9: LANGKAH-LANGKAH TOOLS (5 slide terpisah, slide_type: "steps")
   
   SLIDE 5: LANGKAH 1 - [Nama Step Pertama]
   ├─ Penjelasan detail step pertama dari tools/metode
   ├─ JIKA ADA REFERENSI: Gunakan terminologi dari referensi
   ├─ Contoh konkret penerapan di kapal
   ├─ Tips praktis untuk step ini
   └─ Common mistakes yang harus dihindari

   SLIDE 6: LANGKAH 2 - [Nama Step Kedua]
   ├─ Penjelasan detail step kedua
   ├─ Hubungan dengan step sebelumnya
   ├─ Contoh penerapan praktis (based on referensi jika ada)
   └─ Best practices

   SLIDE 7: LANGKAH 3 - [Nama Step Ketiga]
   ├─ Penjelasan detail step ketiga
   ├─ Contoh dan ilustrasi
   ├─ JIKA ADA REFERENSI: Mention cara referensi menjelaskan step ini
   ├─ Potensi hambatan dan cara mengatasinya
   └─ Tips untuk maksimalisasi hasil

   SLIDE 8: LANGKAH 4 - [Nama Step Keempat]
   ├─ Penjelasan detail step keempat
   ├─ Koneksi dengan step-step sebelumnya
   ├─ Contoh aplikasi di situasi kapal
   └─ Key points yang harus diingat

   SLIDE 9: LANGKAH 5 - [Nama Step Kelima/Final]
   ├─ Penjelasan detail step terakhir
   ├─ Cara memastikan implementasi berhasil
   ├─ Ringkasan semua langkah
   └─ Transition ke studi kasus

SLIDE 10: RINGKASAN TOOLS (slide_type: "summary")
   ├─ Recap semua 5 langkah dalam 1 slide
   ├─ Diagram atau flowchart sederhana (dalam bentuk teks)
   ├─ Key takeaways dari setiap langkah
   └─ Checklist untuk implementasi

SLIDE 11: STUDI KASUS (slide_type: "case_study")
   ├─ Skenario nyata di kapal container
   ├─ JIKA ADA REFERENSI: Gunakan contoh/kasus yang aligned dengan framework referensi
   ├─ Konteks situasi: siapa, apa, dimana, kapan
   ├─ Masalah/tantangan yang dihadapi
   └─ Pertanyaan untuk refleksi peserta

SLIDE 12: PEMECAHAN MASALAH (slide_type: "solution")
   ├─ Solusi menggunakan tools/metode yang telah dijelaskan
   ├─ JIKA ADA REFERENSI: Tunjukkan bagaimana solusi mengikuti framework dari referensi
   ├─ Langkah-langkah penerapan dalam studi kasus
   ├─ Hasil yang dicapai
   └─ Lessons learned dan best practices (quote dari referensi jika applicable)

SLIDE 13: PENUTUP/CLOSING (slide_type: "closing")
   ├─ Summary keseluruhan training
   ├─ Action items konkret untuk peserta (24-48 jam pertama)
   ├─ Next steps untuk pengembangan berkelanjutan
   ├─ Additional resources dan referensi
   └─ Motivational closing dan call-to-action

OPSIONAL - SLIDE 14-15 (jika diperlukan):
   ├─ FAQ atau pertanyaan umum
   ├─ Additional resources
   ├─ Contact information untuk follow-up
   └─ Assessment atau quiz preview

⚠️ INGAT: 
- WAJIB buat MINIMAL 13 slide, bisa sampai 15 slide
- Setiap slide harus substantif dengan 4-6 bullet points
- Fokus pada konteks perwira kapal container SPIL
- Gunakan contoh-contoh yang relevan dengan dunia maritim
`
}

// buildContentRequirements specifies content quality standards
func (s *Service) buildContentRequirements() string {
	return `PERSYARATAN KONTEN UNTUK PPT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ JUMLAH SLIDE WAJIB: MINIMAL 13 SLIDE, MAKSIMAL 15 SLIDE!
Jangan buat kurang dari 13 slide. Ikuti struktur yang sudah ditentukan.

CRITICAL REQUIREMENTS:
✓ WAJIB buat 13-15 slide sesuai struktur yang diberikan
✓ Setiap slide: 4-6 bullet points yang JELAS dan RINGKAS (ini untuk PPT, bukan dokumen!)
✓ Setiap bullet: 1-2 kalimat yang PADAT dan INFORMATIF (PPT harus concise!)
✓ Format heading: "JUDUL:", "OBJECTIVE:", "KONSEP:", "CHALLENGES:", "LANGKAH 1:", "LANGKAH 2:", dst, "RINGKASAN:", "STUDI KASUS:", "PEMECAHAN MASALAH:", "PENUTUP:" (untuk styling hijau)
✓ Setiap poin harus punya: poin utama + 1 contoh singkat atau aplikasi praktis
✓ Bahasa Indonesia profesional, ringkas, engaging
✓ Konteks: Perwira kapal container SPIL (gunakan contoh maritim yang spesifik)

FORMAT BULLET POINTS UNTUK PPT (WAJIB IKUTI!):

⚠️ INI PPT - SETIAP BULLET HARUS RINGKAS (1-2 KALIMAT SAJA!)

1. Sub-judul + Penjelasan RINGKAS (1-2 kalimat):
   "Definisi Problem Analysis dalam Konteks Maritim
   Problem analysis adalah metodologi sistematis untuk mengidentifikasi akar penyebab masalah operasional di kapal. Metode ini mencegah masalah berulang dengan menangani penyebab utama, bukan hanya gejala."

2. Poin Utama dengan Elaborasi SINGKAT (1-2 kalimat):
   "• Fokus pada Sistem dan Proses, Bukan Individu
   Lihat masalah sebagai hasil kegagalan sistem atau prosedur kerja, bukan kesalahan personal crew. Pendekatan ini membuat crew lebih terbuka berbagi informasi untuk investigasi yang efektif."

3. Langkah dengan Penjelasan PADAT (1-2 kalimat):
   "Langkah 1: Identifikasi dan Definisikan Masalah Secara Spesifik
   Nyatakan masalah dalam satu kalimat yang jelas, terukur, dan berbasis fakta menggunakan format 5W1H. Contoh: 'Pompa ballast No.2 berhenti beroperasi pada 15 Jan pukul 14:00 saat loading di Tanjung Priok, menyebabkan delay 3 jam.'"

DURASI DAN AKTIVITAS:
├─ Total durasi: 90-120 menit (untuk 13-15 slide PPT)
├─ Konten per slide: 80-150 kata (ringkas untuk PPT, detail ada di speaker notes!)
├─ Speaker notes per slide: 100-150 kata (guidance untuk fasilitator)
├─ 3-4 aktivitas interaktif (clear instructions + time allocation)
├─ 6-8 assessment questions (test pemahaman aplikatif + comprehensive answers)
└─ Referensi credible, up-to-date, relevant (konteks maritim Indonesia)

⭐ SLIDE KHUSUS REFERENSI TAMBAHAN (WAJIB jika ada referensi):
Jika ada referensi tambahan, buat 1 slide tersendiri dengan format:
{
  "heading": "REFERENSI TAMBAHAN: [Nama Referensi]",
  "bullets": [
    "SUMBER REFERENSI",
    "[Nama referensi/artikel/buku/framework yang disebutkan user]",
    "",
    "• Relevansi dengan Topik Training",
    "Referensi ini memperkaya pemahaman topik dengan perspektif tambahan yang relevan untuk operasional kapal.",
    "",
    "• Konsep Kunci dari Referensi",
    "Highlight 2-3 konsep utama yang directly applicable ke topik training dalam 1-2 kalimat.",
    "",
    "• Aplikasi Praktis",
    "Tunjukkan cara mengintegrasikan referensi dengan tools/metode dalam konteks pekerjaan sehari-hari."
  ],
  "speaker_notes": "Guidance 100-150 kata tentang cara membahas referensi tambahan",
  "slide_type": "concept"
}

LARANGAN:
✗ JANGAN buat kurang dari 13 slide - INI WAJIB!
✗ JANGAN buat bullet yang TERLALU PANJANG - ini PPT, bukan essay! (max 2 kalimat per bullet)
✗ JANGAN buat konten yang dangkal - tetap harus informatif meski ringkas
✗ JANGAN gunakan emoji dalam konten apapun
✗ JANGAN buat bullet point terlalu panjang (max 2 kalimat per bullet untuk PPT!)
✗ JANGAN gunakan jargon tanpa penjelasan
✗ JANGAN konten terlalu teoretis - selalu sertakan aplikasi praktis
✗ JANGAN bahasa ambigu
✗ JANGAN abaikan konteks perwira kapal container SPIL
✗ JANGAN gabungkan langkah-langkah tools - WAJIB 1 langkah = 1 slide (slide 5-9)
`
}

// getExampleSection provides quality content examples
func (s *Service) getExampleSection() string {
	return `CONTOH KONTEN PPT BERKUALITAS (13-15 SLIDE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ PENTING: Ini contoh untuk PPT (RINGKAS!), bukan dokumen training lengkap!

Contoh Slide 3 - KONSEP (setiap bullet 1-2 kalimat saja!):

{
  "heading": "KONSEP: PROBLEM ANALYSIS SISTEMATIS",
  "bullets": [
    "Definisi Problem Analysis dalam Konteks Maritim",
    "Problem analysis adalah metodologi sistematis untuk mengidentifikasi akar penyebab masalah operasional di kapal. Metode ini mencegah masalah berulang dengan menangani root cause, bukan hanya gejala permukaan.",
    "",
    "• Mengapa Penting untuk Perwira Kapal Container?",
    "Masalah yang tidak diselesaikan sampai akarnya dapat menyebabkan delay bongkar muat, kerusakan cargo, dan risiko keselamatan. Kemampuan menganalisis masalah secara sistematis membedakan perwira outstanding dengan yang biasa-biasa saja.",
    "",
    "• Tools yang Akan Dipelajari: 5 Whys Method",
    "5 Whys adalah teknik bertanya 'Mengapa?' secara berulang untuk menemukan root cause. Metode ini sederhana, tidak butuh tools khusus, dan sangat efektif untuk lingkungan maritim."
  ],
  "speaker_notes": "Jelaskan konteks problem analysis di maritim dengan contoh konkret. Tekankan bahwa ini skill praktis yang akan membantu karir mereka. Alokasikan 7-8 menit untuk slide ini.",
  "slide_type": "concept"
}

Contoh Slide 5 - LANGKAH 1 (setiap bullet 1-2 kalimat!):

{
  "heading": "LANGKAH 1: IDENTIFIKASI DAN DEFINISIKAN MASALAH SECARA SPESIFIK",
  "bullets": [
    "Apa yang Harus Dilakukan di Langkah Ini?",
    "Nyatakan masalah dalam satu kalimat yang jelas, terukur, dan berbasis fakta. Libatkan stakeholder relevan dan dokumentasikan lengkap dengan format 5W1H.",
    "",
    "• Contoh Identifikasi Masalah: BAIK vs BURUK",
    "BAIK: 'Pompa ballast No.2 berhenti pada 15 Jan pukul 14:00 saat loading di Tanjung Priok, delay 3 jam, kerugian Rp 50 juta.' BURUK: 'Pompa sering rusak' (terlalu umum, tidak actionable).",
    "",
    "• Tips Praktis",
    "Gunakan log book sebagai referensi faktual, ambil foto kondisi equipment sebagai dokumentasi visual. Wawancarai crew dengan pertanyaan terbuka, hindari bahasa menyalahkan.",
    "",
    "• Common Mistake yang Harus Dihindari",
    "Jangan langsung menyalahkan individu sebelum investigasi selesai - ini menciptakan blame game yang toxic. Jangan buru-buru loncat ke solusi tanpa memahami masalah dengan benar."
  ],
  "speaker_notes": "Tekankan pentingnya spesifisitas. Minta peserta menulis contoh masalah dari pengalaman mereka, review dan berikan feedback. Alokasikan 8-10 menit.",
  "slide_type": "steps"
}

Contoh Slide 11 - STUDI KASUS (bullet 1-2 kalimat!):

{
  "heading": "STUDI KASUS: MASALAH POMPA BALLAST BERULANG DI KM. SPIL NUSANTARA",
  "bullets": [
    "Konteks Situasi",
    "KM. SPIL Nusantara (1.200 TEU, rute Surabaya-Makassar) mengalami kegagalan pompa ballast 4 kali dalam 3 bulan. Setiap kejadian menyebabkan delay 4 jam, total kerugian Rp 200 juta.",
    "",
    "• Masalah yang Dihadapi Chief Officer",
    "Sudah ganti pompa 2 kali dengan unit baru tapi masalah tetap berulang. Tim deck dan engine saling menyalahkan, Captain dapat teguran dari kantor pusat.",
    "",
    "• Pertanyaan Refleksi",
    "Jika Anda Chief Officer, bagaimana memulai problem analysis dengan 5 Whys? Siapa yang perlu Anda libatkan dan bagaimana mengatasi blame game?",
    "",
    "• Hint untuk Analisis",
    "Masalah berulang meski pompa diganti 2x - ini indikasi strong bahwa root cause BUKAN di pompanya. Pikirkan: supply listrik, filter tersumbat, SOP tidak diikuti, atau faktor lingkungan?"
  ],
  "speaker_notes": "Beri waktu 3-5 menit untuk peserta berpikir sebelum melanjutkan ke slide pemecahan. Minta beberapa peserta share pendekatan mereka.",
  "slide_type": "case_study"
}

⚠️ PENTING: 
- Buat 13-15 slide dengan KUALITAS seperti contoh di atas
- Setiap LANGKAH harus di slide terpisah (5 langkah = 5 slide)
- Setiap bullet WAJIB 1-2 kalimat saja (ini PPT, bukan dokumen!)
- Tetap sertakan contoh konkret di setiap slide
- Konten harus PADAT dan INFORMATIF meski ringkas
`
}

// Keep the existing helper functions
func valueOrDash(s string) string {
	if strings.TrimSpace(s) == "" {
		return "-"
	}
	return s
}

func (s *Service) determineTopicType(topik, tools string) string {
	topikLower := strings.ToLower(topik)
	toolsLower := strings.ToLower(tools)

	if strings.Contains(toolsLower, "excel") || strings.Contains(toolsLower, "powerpoint") ||
		strings.Contains(toolsLower, "word") || strings.Contains(toolsLower, "office") ||
		strings.Contains(topikLower, "teknologi") || strings.Contains(topikLower, "software") ||
		strings.Contains(topikLower, "sistem") || strings.Contains(topikLower, "digital") {
		return "technical"
	}

	if strings.Contains(topikLower, "komunikasi") || strings.Contains(topikLower, "leadership") ||
		strings.Contains(topikLower, "teamwork") || strings.Contains(topikLower, "trust") ||
		strings.Contains(topikLower, "accountability") || strings.Contains(topikLower, "interpersonal") ||
		strings.Contains(topikLower, "emotional") || strings.Contains(topikLower, "motivasi") {
		return "soft_skill"
	}

	if strings.Contains(topikLower, "framework") || strings.Contains(topikLower, "model") ||
		strings.Contains(topikLower, "methodology") || strings.Contains(topikLower, "agile") ||
		strings.Contains(topikLower, "smart") || strings.Contains(topikLower, "grpi") ||
		strings.Contains(toolsLower, "model") || strings.Contains(toolsLower, "framework") {
		return "framework"
	}

	if strings.Contains(topikLower, "management") || strings.Contains(topikLower, "planning") ||
		strings.Contains(topikLower, "execution") || strings.Contains(topikLower, "control") ||
		strings.Contains(topikLower, "prioritization") || strings.Contains(topikLower, "goals") {
		return "management"
	}

	return "general"
}

func (s *Service) getTopicSpecificGuidelines(topicType string) string {
	switch topicType {
	case "technical":
		return `PANDUAN KHUSUS TOPIK TEKNIS:
- Sertakan step-by-step instructions yang sangat detail dengan screenshot descriptions atau visual cues
- Berikan shortcut keyboard, hotkeys, dan efficiency tips yang dapat langsung meningkatkan produktivitas
- Cantumkan system requirements, compatibility considerations, dan technical prerequisites yang perlu dipenuhi
- Sediakan comprehensive troubleshooting guide untuk common issues dengan solusi step-by-step
- Buat hands-on exercises dengan file contoh atau sample data yang representative
- Include best practices untuk data management, security, dan optimization
- Referensi harus include official documentation, vendor resources, dan community forums yang terpercaya`

	case "soft_skill":
		return `PANDUAN KHUSUS SOFT SKILLS:
- Gunakan storytelling dan real-life scenarios yang relatable untuk membuat konten lebih engaging dan memorable
- Sertakan self-assessment tools, reflection questions, dan personal development frameworks
- Berikan role-play activities, group discussions, dan collaborative exercises yang mendorong interaction
- Cantumkan behavioral indicators, competency rubrics, dan measurement metrics yang observable
- Fokus pada emotional intelligence components, interpersonal dynamics, dan relationship building strategies
- Include cultural sensitivity considerations dan Indonesian workplace context
- Referensi dari psychology research, organizational behavior studies, dan leadership literature yang evidence-based`

	case "framework":
		return `PANDUAN KHUSUS FRAMEWORK/MODEL:
- Jelaskan origin story, theoretical foundation, dan evolution dari framework tersebut untuk memberikan context
- Berikan detailed comparison dengan framework alternatif termasuk strengths, limitations, dan best use cases
- Sertakan comprehensive implementation roadmap dengan phases, milestones, dan success criteria
- Cantumkan KPIs, metrics, dan measurement tools untuk tracking effectiveness dan ROI
- Buat ready-to-use templates, worksheets, dan tools yang dapat immediate application
- Include adaptation guidelines untuk menyesuaikan framework dengan konteks organisasi spesifik
- Referensi dari original authors, case studies, dan research papers yang validate framework effectiveness`

	case "management":
		return `PANDUAN KHUSUS MANAJEMEN:
- Fokus pada strategic decision-making processes dengan frameworks dan mental models yang practical
- Sertakan delegation frameworks, accountability structures, dan authority matrices yang clear
- Berikan comprehensive performance measurement tools, dashboards, dan reporting templates
- Cantumkan change management considerations, stakeholder management strategies, dan communication plans
- Buat detailed action planning templates dengan timeline, resources, dan risk mitigation strategies
- Include leadership principles, coaching techniques, dan team development approaches
- Referensi dari management literature, business case studies, dan industry best practices yang proven effective`

	default:
		return `PANDUAN UMUM:
- Seimbangkan theoretical foundations dengan practical applications yang immediately implementable
- Sertakan Indonesian context, local examples, dan cultural considerations yang relevant
- Berikan actionable takeaways dengan clear next steps dan implementation guidelines
- Cantumkan comprehensive follow-up resources untuk continued learning dan skill development
- Buat engaging dan interactive content dengan varied delivery methods dan learning modalities
- Include real-world examples, success stories, dan lessons learned dari praktisi
- Focus on transfer of learning dengan application exercises dan on-the-job implementation support`
	}
}

// extractKeyword mengekstrak keyword utama (sebelum "Referensi Tambahan:")
func extractKeyword(referensi string) string {
	if strings.TrimSpace(referensi) == "" {
		return "-"
	}
	
	// Cari posisi "Referensi Tambahan:"
	parts := strings.Split(referensi, "Referensi Tambahan:")
	keyword := strings.TrimSpace(parts[0])
	
	if keyword == "" {
		return "-"
	}
	return keyword
}

// extractOptionalReferensi mengekstrak referensi tambahan (setelah "Referensi Tambahan:")
func extractOptionalReferensi(referensi string) string {
	if strings.TrimSpace(referensi) == "" {
		return "-"
	}
	
	// Cari posisi "Referensi Tambahan:"
	parts := strings.Split(referensi, "Referensi Tambahan:")
	
	if len(parts) < 2 {
		// Tidak ada separator, berarti ini hanya keyword
		return "-"
	}
	
	optional := strings.TrimSpace(parts[1])
	if optional == "" {
		return "-"
	}
	return optional
}

func (s *Service) callGemini(ctx context.Context, prompt string) (*Plan, error) {
	if s.apiKey == "" {
		return nil, errors.New("GEMINI_API_KEY tidak di-set")
	}

	systemInstruction := "You are an expert instructional designer creating CONCISE PowerPoint training content in Indonesian. This is for PPT slides, NOT a full document - keep each bullet point to 1-2 sentences maximum. Be informative but CONCISE. Respond ONLY with valid JSON. No markdown, no code fences, no explanations. Just pure JSON."

	body := map[string]any{
		"system_instruction": map[string]any{
			"parts": []map[string]string{
				{"text": systemInstruction},
			},
		},
		"contents": []map[string]any{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]any{
			"temperature":      0.6,
			"topP":             0.9,
			"maxOutputTokens":  65536,
			"responseMimeType": "application/json",
		},
	}

	b, _ := json.Marshal(body)
	apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", s.model, s.apiKey)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		s.log.Errorf("Gemini API error: status=%d body=%s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("gemini status %d", resp.StatusCode)
	}

	var raw struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}
	if len(raw.Candidates) == 0 || len(raw.Candidates[0].Content.Parts) == 0 {
		return nil, errors.New("no candidates from gemini")
	}

	content := strings.TrimSpace(raw.Candidates[0].Content.Parts[0].Text)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	var plan Plan
	if err := json.Unmarshal([]byte(content), &plan); err != nil {
		s.log.WithError(err).Warn("JSON parse error, content:\n" + content)
		return nil, fmt.Errorf("gagal parsing JSON dari model: %w", err)
	}

	return &plan, nil
}

func (s *Service) buildPDF(plan *Plan, filename string) error {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(true, 15)

	pdf.AddUTF8Font("DejaVu", "", "fonts/DejaVuSans.ttf")
	pdf.AddUTF8Font("DejaVu", "B", "fonts/DejaVuSans-Bold.ttf")

	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 20)
	pdf.CellFormat(0, 12, plan.Title, "", 1, "C", false, 0, "")
	pdf.Ln(6)
	pdf.SetFont("DejaVu", "", 12)
	pdf.MultiCell(0, 7, fmt.Sprintf(
		"Kompetensi: %s\nDurasi: %s\nAudiens: %s",
		strings.Join(plan.Overview.Goals, ", "),
		plan.Overview.Duration,
		plan.Overview.Audience,
	), "", "L", false)

	for i, sl := range plan.Slides {
		pdf.AddPage()
		pdf.SetFont("DejaVu", "B", 16)
		pdf.CellFormat(0, 10, fmt.Sprintf("Slide %d - %s", i+1, sl.Heading), "", 1, "L", false, 0, "")
		pdf.Ln(2)
		pdf.SetFont("DejaVu", "", 12)
		for _, b := range sl.Bullets {
			if strings.TrimSpace(b) == "" {
				pdf.Ln(2)
				continue
			}
			pdf.CellFormat(5, 6, "•", "", 0, "L", false, 0, "")
			pdf.MultiCell(0, 6, b, "", "L", false)
		}
		if strings.TrimSpace(sl.SpeakerNotes) != "" {
			pdf.Ln(3)
			pdf.SetFont("DejaVu", "", 10)
			pdf.SetTextColor(90, 90, 90)
			pdf.MultiCell(0, 5, "Catatan Fasilitator: "+sl.SpeakerNotes, "", "L", false)
			pdf.SetTextColor(0, 0, 0)
		}
	}

	if len(plan.Activities) > 0 {
		pdf.AddPage()
		pdf.SetFont("DejaVu", "B", 16)
		pdf.CellFormat(0, 10, "Aktivitas & Latihan", "", 1, "L", false, 0, "")
		pdf.SetFont("DejaVu", "", 12)
		for _, a := range plan.Activities {
			pdf.SetFont("DejaVu", "B", 12)
			pdf.MultiCell(0, 6, fmt.Sprintf("- %s (%s)", a.Title, a.Time), "", "L", false)
			pdf.SetFont("DejaVu", "", 12)
			pdf.MultiCell(0, 6, a.Instructions, "", "L", false)
			pdf.Ln(2)
		}
	}

	if len(plan.Assessment) > 0 {
		pdf.AddPage()
		pdf.SetFont("DejaVu", "B", 16)
		pdf.CellFormat(0, 10, "Assessment (Contoh Q&A)", "", 1, "L", false, 0, "")
		pdf.SetFont("DejaVu", "", 12)
		for i, qa := range plan.Assessment {
			pdf.MultiCell(0, 6, fmt.Sprintf("%d) %s", i+1, qa.Question), "", "L", false)
			pdf.SetFont("DejaVu", "", 11)
			pdf.MultiCell(0, 6, "Jawaban: "+qa.Answer, "", "L", false)
			pdf.SetFont("DejaVu", "", 12)
			pdf.Ln(1)
		}
	}

	if len(plan.References) > 0 {
		pdf.AddPage()
		pdf.SetFont("DejaVu", "B", 16)
		pdf.CellFormat(0, 10, "Referensi", "", 1, "L", false, 0, "")
		pdf.SetFont("DejaVu", "", 11)
		for _, r := range plan.References {
			pdf.MultiCell(0, 5, "• "+r, "", "L", false)
		}
	}

	return pdf.OutputFileAndClose(filename)
}

func (s *Service) buildPPTX(plan *Plan, filename string) error {
	const leftMargin = 0.5 * measurement.Inch
	const topMargin = 0.5 * measurement.Inch
	const contentWidth = 9.0 * measurement.Inch
	const slideWidth = 10.0 * measurement.Inch
	const slideHeight = 7.5 * measurement.Inch

	ppt := presentation.New()
	defer ppt.Close()

	titleSlide := ppt.AddSlide()

	titleBox := titleSlide.AddTextBox()
	titleBox.Properties().SetPosition(leftMargin, 2.0*measurement.Inch)
	titleBox.Properties().SetSize(contentWidth, 1.5*measurement.Inch)

	titlePara := titleBox.AddParagraph()
	titleRun := titlePara.AddRun()
	titleRun.SetText(plan.Title)
	titleRun.Properties().SetSize(44)
	titleRun.Properties().SetBold(true)

	overviewBox := titleSlide.AddTextBox()
	overviewBox.Properties().SetPosition(leftMargin, 3.8*measurement.Inch)
	overviewBox.Properties().SetSize(contentWidth, 3.0*measurement.Inch)

	infoPara := overviewBox.AddParagraph()
	infoRun := infoPara.AddRun()
	infoRun.SetText(fmt.Sprintf("Durasi: %s | Audiens: %s", plan.Overview.Duration, plan.Overview.Audience))
	infoRun.Properties().SetSize(18)

	if len(plan.Overview.Goals) > 0 {
		overviewBox.AddParagraph()

		goalsTitlePara := overviewBox.AddParagraph()
		goalsTitleRun := goalsTitlePara.AddRun()
		goalsTitleRun.SetText("Tujuan Pembelajaran:")
		goalsTitleRun.Properties().SetSize(18)
		goalsTitleRun.Properties().SetBold(true)

		for _, goal := range plan.Overview.Goals {
			goalPara := overviewBox.AddParagraph()
			goalRun := goalPara.AddRun()
			goalRun.SetText("• " + goal)
			goalRun.Properties().SetSize(16)
		}
	}

	for _, slide := range plan.Slides {
		contentSlide := ppt.AddSlide()

		headingBox := contentSlide.AddTextBox()
		headingBox.Properties().SetPosition(leftMargin, topMargin)
		headingBox.Properties().SetSize(contentWidth, 0.8*measurement.Inch)

		headingPara := headingBox.AddParagraph()
		headingRun := headingPara.AddRun()
		headingRun.SetText(slide.Heading)
		headingRun.Properties().SetSize(28)
		headingRun.Properties().SetBold(true)

		contentBox := contentSlide.AddTextBox()
		contentBox.Properties().SetPosition(leftMargin, 1.4*measurement.Inch)
		contentBox.Properties().SetSize(contentWidth, 5.8*measurement.Inch)

		for _, bullet := range slide.Bullets {
			bulletText := strings.TrimSpace(bullet)
			if bulletText == "" {
				emptyPara := contentBox.AddParagraph()
				emptyRun := emptyPara.AddRun()
				emptyRun.SetText(" ")
				emptyRun.Properties().SetSize(8)
				continue
			}

			bulletPara := contentBox.AddParagraph()
			bulletRun := bulletPara.AddRun()
			bulletRun.SetText(bulletText)
			bulletRun.Properties().SetSize(16)
		}
	}

	if len(plan.Activities) > 0 {
		actSlide := ppt.AddSlide()

		actHeadingBox := actSlide.AddTextBox()
		actHeadingBox.Properties().SetPosition(leftMargin, topMargin)
		actHeadingBox.Properties().SetSize(contentWidth, 0.8*measurement.Inch)

		actHeadingPara := actHeadingBox.AddParagraph()
		actHeadingRun := actHeadingPara.AddRun()
		actHeadingRun.SetText("Aktivitas & Latihan")
		actHeadingRun.Properties().SetSize(28)
		actHeadingRun.Properties().SetBold(true)

		actContentBox := actSlide.AddTextBox()
		actContentBox.Properties().SetPosition(leftMargin, 1.4*measurement.Inch)
		actContentBox.Properties().SetSize(contentWidth, 5.8*measurement.Inch)

		for i, activity := range plan.Activities {
			actTitlePara := actContentBox.AddParagraph()
			actTitleRun := actTitlePara.AddRun()
			actTitleRun.SetText(fmt.Sprintf("%d. %s (%s)", i+1, activity.Title, activity.Time))
			actTitleRun.Properties().SetSize(18)
			actTitleRun.Properties().SetBold(true)

			actInstrPara := actContentBox.AddParagraph()
			actInstrRun := actInstrPara.AddRun()
			actInstrRun.SetText("   " + activity.Instructions)
			actInstrRun.Properties().SetSize(15)

			if i < len(plan.Activities)-1 {
				spacePara := actContentBox.AddParagraph()
				spaceRun := spacePara.AddRun()
				spaceRun.SetText(" ")
				spaceRun.Properties().SetSize(6)
			}
		}
	}

	if len(plan.Assessment) > 0 {
		assSlide := ppt.AddSlide()

		assHeadingBox := assSlide.AddTextBox()
		assHeadingBox.Properties().SetPosition(leftMargin, topMargin)
		assHeadingBox.Properties().SetSize(contentWidth, 0.8*measurement.Inch)

		assHeadingPara := assHeadingBox.AddParagraph()
		assHeadingRun := assHeadingPara.AddRun()
		assHeadingRun.SetText("Assessment & Evaluasi")
		assHeadingRun.Properties().SetSize(28)
		assHeadingRun.Properties().SetBold(true)

		assContentBox := assSlide.AddTextBox()
		assContentBox.Properties().SetPosition(leftMargin, 1.4*measurement.Inch)
		assContentBox.Properties().SetSize(contentWidth, 5.8*measurement.Inch)

		for i, qa := range plan.Assessment {
			qPara := assContentBox.AddParagraph()
			qRun := qPara.AddRun()
			qRun.SetText(fmt.Sprintf("Q%d: %s", i+1, qa.Question))
			qRun.Properties().SetSize(15)
			qRun.Properties().SetBold(true)

			aPara := assContentBox.AddParagraph()
			aRun := aPara.AddRun()
			aRun.SetText(fmt.Sprintf("A: %s", qa.Answer))
			aRun.Properties().SetSize(14)

			if i < len(plan.Assessment)-1 {
				spacePara := assContentBox.AddParagraph()
				spaceRun := spacePara.AddRun()
				spaceRun.SetText(" ")
				spaceRun.Properties().SetSize(6)
			}
		}
	}

	if err := ppt.Validate(); err != nil {
		return fmt.Errorf("PPTX validation failed: %w", err)
	}

	if err := ppt.SaveToFile(filename); err != nil {
		return fmt.Errorf("failed to save PPTX: %w", err)
	}

	return s.enhancePPTXWithBackgroundAndColors(filename)
}

func (s *Service) enhancePPTXWithBackgroundAndColors(filename string) error {
	reader, err := zip.OpenReader(filename)
	if err != nil {
		return fmt.Errorf("failed to open PPTX as ZIP: %w", err)
	}

	tempFile := filename + ".tmp"
	writer, err := os.Create(tempFile)
	if err != nil {
		reader.Close()
		return fmt.Errorf("failed to create temp file: %w", err)
	}

	zipWriter := zip.NewWriter(writer)

	backgroundImagePath := "public/ppt-background.png"

	mediaWriter, err := zipWriter.Create("ppt/media/image1.png")
	if err != nil {
		zipWriter.Close()
		writer.Close()
		reader.Close()
		os.Remove(tempFile)
		return fmt.Errorf("failed to create media entry: %w", err)
	}

	backgroundFile, err := os.Open(backgroundImagePath)
	if err != nil {
		zipWriter.Close()
		writer.Close()
		reader.Close()
		os.Remove(tempFile)
		return fmt.Errorf("failed to open background image: %w", err)
	}

	if _, err := io.Copy(mediaWriter, backgroundFile); err != nil {
		backgroundFile.Close()
		zipWriter.Close()
		writer.Close()
		reader.Close()
		os.Remove(tempFile)
		return fmt.Errorf("failed to copy background image: %w", err)
	}
	backgroundFile.Close()

	for _, file := range reader.File {
		if err := s.processZipFile(file, zipWriter); err != nil {
			zipWriter.Close()
			writer.Close()
			reader.Close()
			os.Remove(tempFile)
			return fmt.Errorf("failed to process file %s: %w", file.Name, err)
		}
	}

	if err := zipWriter.Close(); err != nil {
		writer.Close()
		reader.Close()
		os.Remove(tempFile)
		return fmt.Errorf("failed to close zip writer: %w", err)
	}

	if err := writer.Close(); err != nil {
		reader.Close()
		os.Remove(tempFile)
		return fmt.Errorf("failed to close temp file: %w", err)
	}

	if err := reader.Close(); err != nil {
		os.Remove(tempFile)
		return fmt.Errorf("failed to close zip reader: %w", err)
	}

	if err := os.Remove(filename); err != nil {
		os.Remove(tempFile)
		return fmt.Errorf("failed to remove original file: %w", err)
	}

	if err := os.Rename(tempFile, filename); err != nil {
		return fmt.Errorf("failed to rename temp file: %w", err)
	}

	return nil
}

func (s *Service) processZipFile(file *zip.File, zipWriter *zip.Writer) error {
	reader, err := file.Open()
	if err != nil {
		return err
	}
	defer reader.Close()

	writer, err := zipWriter.Create(file.Name)
	if err != nil {
		return err
	}

	if strings.HasPrefix(file.Name, "ppt/slides/slide") && strings.HasSuffix(file.Name, ".xml") {
		return s.enhanceSlideXML(reader, writer)
	}

	if file.Name == "[Content_Types].xml" {
		return s.enhanceContentTypes(reader, writer)
	}

	if strings.HasPrefix(file.Name, "ppt/slides/_rels/slide") && strings.HasSuffix(file.Name, ".xml.rels") {
		return s.enhanceSlideRels(reader, writer)
	}

	_, err = io.Copy(writer, reader)
	return err
}

func (s *Service) enhanceSlideXML(reader io.Reader, writer io.Writer) error {
	content, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	xmlStr := string(content)

	backgroundXML := `<p:bg>
		<p:bgPr>
			<a:blipFill dpi="0" rotWithShape="1">
				<a:blip r:embed="rId2"/>
				<a:stretch>
					<a:fillRect/>
				</a:stretch>
			</a:blipFill>
		</p:bgPr>
	</p:bg>`

	xmlStr = strings.Replace(xmlStr, "<p:cSld>", "<p:cSld>"+backgroundXML, 1)

	xmlStr = s.applyTextColorsAndFormatting(xmlStr)

	_, err = writer.Write([]byte(xmlStr))
	return err
}

func (s *Service) applyTextColorsAndFormatting(xmlStr string) string {
	runPattern := regexp.MustCompile(`(?s)<a:r>(.*?)</a:r>`)

	result := runPattern.ReplaceAllStringFunc(xmlStr, func(runMatch string) string {
		textPattern := regexp.MustCompile(`<a:t[^>]*>(.*?)</a:t>`)
		textMatch := textPattern.FindStringSubmatch(runMatch)

		if len(textMatch) < 2 {
			return runMatch
		}

		textContent := textMatch[1]
		if strings.TrimSpace(textContent) == "" {
			return runMatch
		}

		styling := s.determineTextStyling(textContent)
		rPrXML := s.buildRunPropertiesXML(styling)

		rPrPattern := regexp.MustCompile(`(?s)<a:rPr[^>]*>.*?</a:rPr>`)
		if rPrPattern.MatchString(runMatch) {
			return rPrPattern.ReplaceAllString(runMatch, rPrXML)
		}

		return strings.Replace(runMatch, "<a:r>", "<a:r>"+rPrXML, 1)
	})

	return result
}

type TextStyling struct {
	Color    string
	IsBold   bool
	FontSize int
	FontName string
}

func (s *Service) determineTextStyling(text string) TextStyling {
	trimmedText := strings.TrimSpace(text)

	if s.isTitlePattern(trimmedText) {
		return TextStyling{
			Color:    "4CAF50",
			IsBold:   true,
			FontSize: 0,
			FontName: "Calibri",
		}
	}

	if s.isStrongPattern(trimmedText) {
		return TextStyling{
			Color:    "D32F2F",
			IsBold:   true,
			FontSize: 0,
			FontName: "Calibri",
		}
	}

	if s.isSubHeadingPattern(trimmedText) {
		return TextStyling{
			Color:    "212121",
			IsBold:   true,
			FontSize: 0,
			FontName: "Calibri",
		}
	}

	return TextStyling{
		Color:    "212121",
		IsBold:   false,
		FontSize: 0,
		FontName: "Calibri",
	}
}

func (s *Service) isTitlePattern(text string) bool {
	upperText := strings.ToUpper(text)

	titleKeywords := []string{
		"OBJECTIVE:", "KONSEP:", "LANGKAH", "STUDI KASUS:", "PENUTUP:",
		"PEMBUKA:", "OPENING:", "CLOSING:", "CASE STUDY:", "AKTIVITAS:",
		"ASSESSMENT:", "EVALUASI:",
	}

	for _, keyword := range titleKeywords {
		if strings.Contains(upperText, keyword) {
			return true
		}
	}

	if (strings.Contains(upperText, "KONSEP") || strings.Contains(upperText, "LANGKAH") ||
		strings.Contains(upperText, "OBJECTIVE") || strings.Contains(upperText, "TUJUAN")) &&
		strings.Contains(text, ":") {
		return true
	}

	if len(text) < 100 && strings.HasSuffix(text, ":") && upperText == text {
		return s.hasLetters(text)
	}

	langkahPattern := regexp.MustCompile(`(?i)LANGKAH\s+\d+\s*:`)
	if langkahPattern.MatchString(text) {
		return true
	}

	return false
}

func (s *Service) isStrongPattern(text string) bool {
	if strings.Contains(text, "Mengapa?") || strings.Contains(text, "MENGAPA?") ||
		strings.Contains(text, "mengapa?") {
		return true
	}

	upperText := strings.ToUpper(text)

	strongKeywords := []string{
		"PENTING:", "CRITICAL:", "WARNING:", "PERHATIAN:", "CATAT:",
		"INGAT:", "PERLU DIINGAT:", "HARAP DIPERHATIKAN:", "WAJIB:",
		"HARUS:", "JANGAN:", "HINDARI:", "PASTIKAN:", "AKAR MASALAH:",
		"ROOT CAUSE:", "KEY POINT:", "KUNCI:", "FUNDAMENTAL:",
	}

	for _, keyword := range strongKeywords {
		if strings.Contains(upperText, keyword) {
			return true
		}
	}

	if (strings.Contains(text, "\"") && strings.Count(text, "\"") >= 2) ||
		(strings.Contains(text, "(") && strings.Contains(text, ")") && len(text) < 100) {
		return true
	}

	if strings.Contains(text, "!") && len(text) < 150 {
		return true
	}

	conceptKeywords := []string{
		"AKAR MASALAH", "ROOT CAUSE", "KRITIS", "VITAL", "FUNDAMENTAL",
		"ESSENTIAL", "KEY", "CORE ISSUE", "UTAMA", "PRIMER",
	}

	for _, keyword := range conceptKeywords {
		if strings.Contains(upperText, keyword) {
			return true
		}
	}

	return false
}

func (s *Service) isSubHeadingPattern(text string) bool {
	trimmedText := strings.TrimSpace(text)

	subHeadingKeywords := []string{
		"Definisi", "Tujuan", "Manfaat", "Langkah", "Contoh", "Penjelasan",
		"Cara", "Metode", "Proses", "Hasil", "Kesimpulan", "Analisis",
		"Implementasi", "Aplikasi", "Praktik", "Tips", "Catatan", "Overview",
		"Definition", "Purpose", "Benefits", "Steps", "Example", "Method",
		"Symptom", "Problem", "Solution", "Analysis", "Background", "Context",
		"Langkah Praktis", "Best Practices", "Prosedur", "Panduan", "Guidelines",
	}

	for _, keyword := range subHeadingKeywords {
		if trimmedText == keyword || strings.HasPrefix(trimmedText, keyword+" ") ||
			trimmedText == keyword+":" {
			return true
		}
	}

	words := strings.Fields(trimmedText)
	if len(words) == 1 && len(trimmedText) > 3 && len(trimmedText) < 35 {
		firstChar := rune(trimmedText[0])
		if firstChar >= 'A' && firstChar <= 'Z' {
			return true
		}
	}

	if strings.Contains(text, "(") && strings.Contains(text, ")") {
		parenIndex := strings.Index(text, "(")
		beforeParen := strings.TrimSpace(text[:parenIndex])
		if len(beforeParen) < 50 && len(beforeParen) > 2 {
			return true
		}
	}

	if strings.HasPrefix(trimmedText, "•") && len(trimmedText) < 100 {
		afterBullet := strings.TrimSpace(strings.TrimPrefix(trimmedText, "•"))
		if !strings.Contains(afterBullet, ".") || strings.Count(afterBullet, ".") == 1 {
			return true
		}
	}

	return false
}

func (s *Service) hasLetters(text string) bool {
	for _, r := range text {
		if (r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') {
			return true
		}
	}
	return false
}

func (s *Service) buildRunPropertiesXML(styling TextStyling) string {
	var attributes []string

	attributes = append(attributes, `lang="id-ID"`)
	attributes = append(attributes, `dirty="0"`)

	if styling.IsBold {
		attributes = append(attributes, `b="1"`)
	}

	if styling.FontSize > 0 {
		attributes = append(attributes, fmt.Sprintf(`sz="%d00"`, styling.FontSize))
	}

	if styling.FontName != "" {
		attributes = append(attributes, fmt.Sprintf(`typeface="%s"`, styling.FontName))
	}

	attrStr := strings.Join(attributes, " ")

	return fmt.Sprintf(
		`<a:rPr %s><a:solidFill><a:srgbClr val="%s"/></a:solidFill><a:latin typeface="%s"/></a:rPr>`,
		attrStr,
		styling.Color,
		styling.FontName,
	)
}

func (s *Service) enhanceContentTypes(reader io.Reader, writer io.Writer) error {
	content, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	xmlStr := string(content)

	if !strings.Contains(xmlStr, `Extension="png"`) {
		pngType := `<Default Extension="png" ContentType="image/png"/>`
		xmlStr = strings.Replace(xmlStr, "</Types>", pngType+"</Types>", 1)
	}

	_, err = writer.Write([]byte(xmlStr))
	return err
}

func (s *Service) enhanceSlideRels(reader io.Reader, writer io.Writer) error {
	content, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	xmlStr := string(content)

	if !strings.Contains(xmlStr, `Id="rId2"`) {
		imageRel := `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>`
		xmlStr = strings.Replace(xmlStr, "</Relationships>", imageRel+"</Relationships>", 1)
	}

	_, err = writer.Write([]byte(xmlStr))
	return err
}

type GenerateMeta struct {
	Title      string `json:"title"`
	SlideCount int    `json:"slide_count"`
	Duration   string `json:"duration"`
	PPTXLink   string `json:"pptx_link"`
	PDFLink    string `json:"pdf_link"`
}

// DeleteOldFile menghapus file lama jika ada
func (s *Service) DeleteOldFile(fileURL string) error {
	if fileURL == "" {
		return nil
	}

	// Extract filename from URL
	// URL format: http://localhost:8080/files/materi/filename.pptx
	parts := strings.Split(fileURL, "/")
	if len(parts) == 0 {
		return fmt.Errorf("invalid file URL: %s", fileURL)
	}
	filename := parts[len(parts)-1]
	
	filepath := filepath.Join(s.outDir, filename)
	
	// Check if file exists
	if _, err := os.Stat(filepath); os.IsNotExist(err) {
		s.log.Warnf("File tidak ditemukan untuk dihapus: %s", filepath)
		return nil
	}
	
	// Delete file
	if err := os.Remove(filepath); err != nil {
		s.log.WithError(err).Errorf("Gagal menghapus file: %s", filepath)
		return err
	}
	
	s.log.Infof("Berhasil menghapus file lama: %s", filepath)
	return nil
}

// buildDetailedPrompt creates prompt for comprehensive PDF guide
func (s *Service) buildDetailedPrompt(in GenerateInput) string {
	topicType := s.determineTopicType(in.TopikTraining, in.Tools)
	topicGuidelines := s.getTopicSpecificGuidelines(topicType)
	
	keyword := extractKeyword(in.Referensi)
	additionalRef := extractOptionalReferensi(in.Referensi)

	basePrompt := fmt.Sprintf(`You are an expert educational content writer creating a COMPREHENSIVE LEARNING GUIDE in Indonesian. This is a DETAILED STUDY GUIDE (bukan presentation slides) - lebih mendalam dari PPT dengan penjelasan lengkap, banyak contoh, dan aplikasi praktis.

KONTEKS PELATIHAN:
- Topik: %s
- Kompetensi: %s
- Level: %d
- Tools/Framework: %s
- Deskripsi Perilaku: %s
- Referensi Utama: %s
- Referensi Tambahan: %s

%s

STRUKTUR KONTEN (LENGKAP & MENDALAM):

1. INTRODUCTION (500-700 kata):
   - Konteks dan latar belakang topik secara menyeluruh
   - Mengapa topik ini penting di workplace modern
   - Relevansi dengan level kompetensi yang ditargetkan
   - Overview lengkap apa yang akan dipelajari
   - Manfaat konkret yang akan didapat
   - Challenge umum yang akan dihadapi

2. CORE CONCEPTS (4 SECTIONS, masing-masing 500-800 kata):
   Setiap section harus mencakup:
   - Penjelasan konsep secara detail dan mendalam
   - Teori dan framework yang mendasari dengan elaborasi
   - Contoh-contoh konkret dan relatable (minimal 2-3 per section)
   - Best practices dan proven strategies dengan penjelasan
   - Common mistakes dan cara menghindarinya (dijelaskan detail)
   - Tips implementasi praktis dengan context
   - Refleksi atau self-assessment questions

3. PRACTICAL IMPLEMENTATION GUIDE (800-1000 kata):
   - Step-by-step guide yang detail dan jelas
   - Setiap step dijelaskan lengkap (120-180 kata per step)
   - Contoh implementasi di berbagai konteks
   - Checklist dan tools yang bisa digunakan
   - Troubleshooting guide untuk masalah umum (dijelaskan detail)
   - Success metrics dan cara mengukur progress
   - Tips optimasi untuk setiap step

4. CASE STUDIES (3 studi kasus, masing-masing 200-250 kata):
   - Studi kasus lengkap dari dunia nyata (preferably Indonesia atau maritime context)
   - Context, challenge, solution, outcome yang detail
   - Analysis mendalam tentang mengapa berhasil/gagal
   - Key lessons dan takeaways yang actionable
   - Aplikasi ke situasi lain

5. FAQ (5 pertanyaan):
   - Pertanyaan umum yang sering muncul
   - Jawaban lengkap dan detail (70-120 kata per jawaban)
   - Include berbagai skenario dan situasi
   - Tips tambahan dalam jawaban

6. RESOURCES & FURTHER LEARNING:
   - Books (4-6 buku) dengan deskripsi dan key takeaways
   - Articles dan research papers penting
   - Online courses atau video resources
   - Tools dan templates yang bisa langsung digunakan
   - Communities atau forums untuk networking

7. CONCLUSION & ACTION PLAN (350-500 kata):
   - Summary komprehensif dari semua konsep utama
   - Immediate action steps (24-48 jam pertama)
   - Short-term goals (1-3 bulan)
   - Long-term development roadmap
   - Self-assessment checklist
   - Next steps untuk continuing education

REQUIREMENTS:
- Total content harus LENGKAP dan MENDALAM (5000-7000 kata total)
- Ini BUKAN summary atau overview - ini learning guide yang comprehensive
- Setiap konsep dijelaskan dengan depth dan multiple perspectives
- Banyak contoh konkret, real-world applications, dan practical scenarios
- Bahasa Indonesia yang jelas, engaging, dan mudah dipahami
- Include analogies dan storytelling untuk clarity
- Actionable insights dan practical tips di setiap bagian
- Focus pada deep understanding DAN aplikasi praktis
- Lebih detail dari PPT slides tapi tidak bertele-tele

OUTPUT FORMAT - JSON VALID:
{
  "title": "Panduan Lengkap: [Topik Training]",
  "introduction": "Penjelasan menyeluruh tentang topik (500-700 kata)...",
  "sections": [
    {
      "title": "Judul Section",
      "content": "Konten lengkap dan mendalam (500-800 kata)...",
      "key_points": ["Poin penting 1 dengan elaborasi", "Poin penting 2 dengan elaborasi", ...],
      "examples": ["Contoh detail 1 dengan context", "Contoh detail 2"],
      "exercises": "Latihan refleksi atau self-assessment untuk section ini"
    }
  ],
  "practical_guide": {
    "step_by_step": [
      {
        "step_number": 1,
        "title": "Judul Step",
        "description": "Penjelasan detail step ini (120-180 kata) dengan context, rationale, dan tips...",
        "examples": ["Contoh implementasi 1 dengan context", "Contoh implementasi 2"]
      }
    ],
    "tips": ["Tips praktis 1 dengan penjelasan", "Tips praktis 2 dengan context", ...],
    "common_pitfalls": ["Kesalahan umum 1: penjelasan dan cara menghindarinya", ...]
  },
  "case_studies": [
    {
      "title": "Judul Case Study",
      "context": "Konteks lengkap (70-100 kata)",
      "challenge": "Tantangan yang dihadapi (60-90 kata)",
      "solution": "Solusi yang diterapkan (100-150 kata)",
      "outcome": "Hasil yang didapat (50-80 kata)",
      "lessons": ["Pelajaran 1 dengan elaborasi", "Pelajaran 2", "Pelajaran 3"]
    }
  ],
  "faq": [
    {
      "question": "Pertanyaan yang relevan?",
      "answer": "Jawaban lengkap dan detail (70-120 kata) dengan examples dan tips..."
    }
  ],
  "resources": {
    "books": ["Buku 1: Deskripsi dan key takeaways", "Buku 2: Deskripsi", ...],
    "articles": ["Artikel 1 dengan deskripsi", "Artikel 2", ...],
    "videos": ["Video/Course 1", "Video 2", ...],
    "tools": ["Tool 1: Deskripsi penggunaan", "Tool 2", ...]
  },
  "conclusion": "Kesimpulan komprehensif dan action plan (350-500 kata)..."
}

PENTING: 
- Hasilkan konten yang LENGKAP dan MENDALAM
- Ini LEARNING GUIDE yang comprehensive, bukan summary
- Setiap bagian harus substantif dengan value yang jelas
- Lebih detail dan lengkap dari PPT slides
- Peserta harus bisa deeply understand dan apply topik dari guide ini
- Balance antara theory (pemahaman) dan practice (aplikasi)`, 
		in.TopikTraining, 
		in.Kompetensi, 
		in.Level, 
		in.Tools, 
		keyword,
		keyword,
		additionalRef,
		topicGuidelines)

	return basePrompt
}

// callGeminiForDetailedContent calls LLM for detailed content
func (s *Service) callGeminiForDetailedContent(ctx context.Context, prompt string) (*DetailedContent, error) {
	systemInstruction := "You are an expert educational content writer. Always respond with valid JSON only, no markdown formatting."

	payload := map[string]interface{}{
		"system_instruction": map[string]any{
			"parts": []map[string]string{
				{"text": systemInstruction},
			},
		},
		"contents": []map[string]any{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]any{
			"temperature":      0.8,
			"maxOutputTokens":  65536,
			"responseMimeType": "application/json",
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", s.model, s.apiKey)
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gemini API error: %d - %s", resp.StatusCode, string(body))
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return nil, err
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, errors.New("no candidates in gemini response")
	}

	content := geminiResp.Candidates[0].Content.Parts[0].Text
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	var detailed DetailedContent
	if err := json.Unmarshal([]byte(content), &detailed); err != nil {
		s.log.Errorf("Failed to parse detailed content JSON: %v\nContent: %s", err, content)
		return nil, fmt.Errorf("failed to parse LLM detailed output: %w", err)
	}

	return &detailed, nil
}

// buildDetailedPDF creates comprehensive PDF guide
func (s *Service) buildDetailedPDF(content *DetailedContent, filename string) error {
	pdf := gofpdf.New("P", "mm", "A4", "")
	
	// Add UTF-8 font (only use available fonts)
	pdf.AddUTF8Font("DejaVu", "", "./fonts/DejaVuSans.ttf")
	pdf.AddUTF8Font("DejaVu", "B", "./fonts/DejaVuSans-Bold.ttf")

	// Cover page
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 24)
	pdf.SetTextColor(0, 51, 102)
	pdf.MultiCell(0, 15, content.Title, "", "C", false)
	pdf.Ln(20)
	
	pdf.SetFont("DejaVu", "", 14)
	pdf.SetTextColor(80, 80, 80)
	pdf.MultiCell(0, 8, "Panduan Pembelajaran Komprehensif", "", "C", false)
	pdf.Ln(10)
	pdf.MultiCell(0, 8, fmt.Sprintf("Generated: %s", time.Now().Format("02 January 2006")), "", "C", false)

	// Table of Contents
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 18)
	pdf.SetTextColor(0, 51, 102)
	pdf.Cell(0, 12, "Daftar Isi")
	pdf.Ln(15)
	
	pdf.SetFont("DejaVu", "", 12)
	pdf.SetTextColor(0, 0, 0)
	tocItems := []string{
		"1. Pendahuluan",
		"2. Konsep Inti",
		"3. Panduan Implementasi Praktis",
		"4. Studi Kasus",
		"5. FAQ (Frequently Asked Questions)",
		"6. Sumber Belajar & Referensi",
		"7. Kesimpulan & Rencana Aksi",
	}
	for _, item := range tocItems {
		pdf.Cell(10, 8, "")
		pdf.MultiCell(0, 8, item, "", "L", false)
	}

	// Introduction
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 20)
	pdf.SetTextColor(0, 51, 102)
	pdf.Cell(0, 12, "1. PENDAHULUAN")
	pdf.Ln(12)
	
	pdf.SetFont("DejaVu", "", 11)
	pdf.SetTextColor(0, 0, 0)
	pdf.MultiCell(0, 6, content.Introduction, "", "L", false)

	// Core Sections
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 20)
	pdf.SetTextColor(0, 51, 102)
	pdf.Cell(0, 12, "2. KONSEP INTI")
	pdf.Ln(12)

	for i, section := range content.Sections {
		if i > 0 {
			pdf.AddPage()
		}
		
		// Section title
		pdf.SetFont("DejaVu", "B", 16)
		pdf.SetTextColor(0, 102, 204)
		pdf.MultiCell(0, 10, fmt.Sprintf("2.%d %s", i+1, section.Title), "", "L", false)
		pdf.Ln(5)
		
		// Section content
		pdf.SetFont("DejaVu", "", 11)
		pdf.SetTextColor(0, 0, 0)
		pdf.MultiCell(0, 6, section.Content, "", "L", false)
		pdf.Ln(5)
		
		// Key points
		if len(section.KeyPoints) > 0 {
			pdf.SetFont("DejaVu", "B", 12)
			pdf.SetTextColor(0, 102, 204)
			pdf.Cell(0, 8, "Poin-Poin Kunci:")
			pdf.Ln(8)
			
			pdf.SetFont("DejaVu", "", 11)
			pdf.SetTextColor(0, 0, 0)
			for _, point := range section.KeyPoints {
				pdf.Cell(5, 6, "")
				pdf.Cell(5, 6, "•")
				pdf.MultiCell(0, 6, point, "", "L", false)
			}
			pdf.Ln(3)
		}
		
		// Examples
		if len(section.Examples) > 0 {
			pdf.SetFont("DejaVu", "B", 12)
			pdf.SetTextColor(34, 139, 34)
			pdf.Cell(0, 8, "Contoh Konkret:")
			pdf.Ln(8)
			
			pdf.SetFont("DejaVu", "", 11)
			pdf.SetTextColor(60, 60, 60)
			for idx, example := range section.Examples {
				pdf.SetFont("DejaVu", "B", 11)
				pdf.Cell(0, 6, fmt.Sprintf("Contoh %d:", idx+1))
				pdf.Ln(6)
				pdf.SetFont("DejaVu", "", 11)
				pdf.MultiCell(0, 6, example, "", "L", false)
				pdf.Ln(3)
			}
		}
		
		// Exercises
		if section.Exercises != "" {
			pdf.Ln(3)
			pdf.SetFillColor(255, 248, 220)
			pdf.SetFont("DejaVu", "B", 11)
			pdf.SetTextColor(139, 69, 19)
			pdf.CellFormat(0, 8, "Latihan Refleksi:", "", 1, "L", true, 0, "")
			pdf.SetFont("DejaVu", "", 10)
			pdf.SetTextColor(0, 0, 0)
			pdf.MultiCell(0, 6, section.Exercises, "", "L", true)
		}
	}

	// Practical Guide
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 20)
	pdf.SetTextColor(0, 51, 102)
	pdf.Cell(0, 12, "3. PANDUAN IMPLEMENTASI PRAKTIS")
	pdf.Ln(15)

	pdf.SetFont("DejaVu", "B", 14)
	pdf.SetTextColor(0, 102, 204)
	pdf.Cell(0, 10, "Langkah-Langkah Detail:")
	pdf.Ln(10)

	for _, step := range content.PracticalGuide.StepByStep {
		pdf.SetFont("DejaVu", "B", 13)
		pdf.SetTextColor(0, 0, 0)
		pdf.MultiCell(0, 8, fmt.Sprintf("Langkah %d: %s", step.StepNumber, step.Title), "", "L", false)
		pdf.Ln(3)
		
		pdf.SetFont("DejaVu", "", 11)
		pdf.MultiCell(0, 6, step.Description, "", "L", false)
		pdf.Ln(4)
		
		if len(step.Examples) > 0 {
			pdf.SetFont("DejaVu", "", 10)
			pdf.SetTextColor(60, 60, 60)
			for _, ex := range step.Examples {
				pdf.Cell(5, 6, "")
				pdf.MultiCell(0, 6, "→ "+ex, "", "L", false)
			}
			pdf.SetTextColor(0, 0, 0)
			pdf.Ln(4)
		}
	}

	// Tips
	if len(content.PracticalGuide.Tips) > 0 {
		pdf.Ln(5)
		pdf.SetFont("DejaVu", "B", 13)
		pdf.SetTextColor(34, 139, 34)
		pdf.Cell(0, 8, "Tips Implementasi:")
		pdf.Ln(8)
		
		pdf.SetFont("DejaVu", "", 11)
		pdf.SetTextColor(0, 0, 0)
		for _, tip := range content.PracticalGuide.Tips {
			pdf.Cell(5, 6, "")
			pdf.Cell(5, 6, "✓")
			pdf.MultiCell(0, 6, tip, "", "L", false)
		}
	}

	// Common Pitfalls
	if len(content.PracticalGuide.CommonPitfalls) > 0 {
		pdf.Ln(8)
		pdf.SetFont("DejaVu", "B", 13)
		pdf.SetTextColor(204, 0, 0)
		pdf.Cell(0, 8, "Kesalahan Umum yang Harus Dihindari:")
		pdf.Ln(8)
		
		pdf.SetFont("DejaVu", "", 11)
		pdf.SetTextColor(0, 0, 0)
		for _, pitfall := range content.PracticalGuide.CommonPitfalls {
			pdf.Cell(5, 6, "")
			pdf.Cell(5, 6, "✗")
			pdf.MultiCell(0, 6, pitfall, "", "L", false)
		}
	}

	// Case Studies
	if len(content.CaseStudies) > 0 {
		pdf.AddPage()
		pdf.SetFont("DejaVu", "B", 20)
		pdf.SetTextColor(0, 51, 102)
		pdf.Cell(0, 12, "4. STUDI KASUS")
		pdf.Ln(15)

		for i, cs := range content.CaseStudies {
			if i > 0 {
				pdf.Ln(10)
			}
			
			pdf.SetFont("DejaVu", "B", 14)
			pdf.SetTextColor(0, 102, 204)
			pdf.MultiCell(0, 9, fmt.Sprintf("Studi Kasus %d: %s", i+1, cs.Title), "", "L", false)
			pdf.Ln(5)
			
			pdf.SetFont("DejaVu", "B", 11)
			pdf.SetTextColor(0, 0, 0)
			pdf.Cell(0, 7, "Konteks:")
			pdf.Ln(7)
			pdf.SetFont("DejaVu", "", 11)
			pdf.MultiCell(0, 6, cs.Context, "", "L", false)
			pdf.Ln(3)
			
			pdf.SetFont("DejaVu", "B", 11)
			pdf.Cell(0, 7, "Tantangan:")
			pdf.Ln(7)
			pdf.SetFont("DejaVu", "", 11)
			pdf.MultiCell(0, 6, cs.Challenge, "", "L", false)
			pdf.Ln(3)
			
			pdf.SetFont("DejaVu", "B", 11)
			pdf.Cell(0, 7, "Solusi:")
			pdf.Ln(7)
			pdf.SetFont("DejaVu", "", 11)
			pdf.MultiCell(0, 6, cs.Solution, "", "L", false)
			pdf.Ln(3)
			
			pdf.SetFont("DejaVu", "B", 11)
			pdf.Cell(0, 7, "Hasil:")
			pdf.Ln(7)
			pdf.SetFont("DejaVu", "", 11)
			pdf.MultiCell(0, 6, cs.Outcome, "", "L", false)
			pdf.Ln(5)
			
			if len(cs.Lessons) > 0 {
				pdf.SetFont("DejaVu", "B", 11)
				pdf.SetTextColor(34, 139, 34)
				pdf.Cell(0, 7, "Pelajaran Penting:")
				pdf.Ln(7)
				pdf.SetFont("DejaVu", "", 11)
				pdf.SetTextColor(0, 0, 0)
				for _, lesson := range cs.Lessons {
					pdf.Cell(5, 6, "")
					pdf.Cell(5, 6, "•")
					pdf.MultiCell(0, 6, lesson, "", "L", false)
				}
			}
		}
	}

	// FAQ
	if len(content.FAQ) > 0 {
		pdf.AddPage()
		pdf.SetFont("DejaVu", "B", 20)
		pdf.SetTextColor(0, 51, 102)
		pdf.Cell(0, 12, "5. FREQUENTLY ASKED QUESTIONS (FAQ)")
		pdf.Ln(15)

		for i, faq := range content.FAQ {
			pdf.SetFont("DejaVu", "B", 12)
			pdf.SetTextColor(0, 102, 204)
			pdf.MultiCell(0, 7, fmt.Sprintf("Q%d: %s", i+1, faq.Question), "", "L", false)
			pdf.Ln(4)
			
			pdf.SetFont("DejaVu", "", 11)
			pdf.SetTextColor(0, 0, 0)
			pdf.MultiCell(0, 6, "A: "+faq.Answer, "", "L", false)
			pdf.Ln(6)
		}
	}

	// Resources
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 20)
	pdf.SetTextColor(0, 51, 102)
	pdf.Cell(0, 12, "6. SUMBER BELAJAR & REFERENSI")
	pdf.Ln(15)

	if len(content.Resources.Books) > 0 {
		pdf.SetFont("DejaVu", "B", 13)
		pdf.SetTextColor(0, 102, 204)
		pdf.Cell(0, 8, "Buku Rekomendasi:")
		pdf.Ln(8)
		pdf.SetFont("DejaVu", "", 11)
		pdf.SetTextColor(0, 0, 0)
		for _, book := range content.Resources.Books {
			pdf.Cell(5, 6, "")
			pdf.MultiCell(0, 6, "• "+book, "", "L", false)
		}
		pdf.Ln(5)
	}

	if len(content.Resources.Articles) > 0 {
		pdf.SetFont("DejaVu", "B", 13)
		pdf.SetTextColor(0, 102, 204)
		pdf.Cell(0, 8, "Artikel & Research Papers:")
		pdf.Ln(8)
		pdf.SetFont("DejaVu", "", 11)
		pdf.SetTextColor(0, 0, 0)
		for _, article := range content.Resources.Articles {
			pdf.Cell(5, 6, "")
			pdf.MultiCell(0, 6, "• "+article, "", "L", false)
		}
		pdf.Ln(5)
	}

	if len(content.Resources.Tools) > 0 {
		pdf.SetFont("DejaVu", "B", 13)
		pdf.SetTextColor(0, 102, 204)
		pdf.Cell(0, 8, "Tools & Templates:")
		pdf.Ln(8)
		pdf.SetFont("DejaVu", "", 11)
		pdf.SetTextColor(0, 0, 0)
		for _, tool := range content.Resources.Tools {
			pdf.Cell(5, 6, "")
			pdf.MultiCell(0, 6, "• "+tool, "", "L", false)
		}
		pdf.Ln(5)
	}

	// Conclusion
	pdf.AddPage()
	pdf.SetFont("DejaVu", "B", 20)
	pdf.SetTextColor(0, 51, 102)
	pdf.Cell(0, 12, "7. KESIMPULAN & RENCANA AKSI")
	pdf.Ln(15)
	
	pdf.SetFont("DejaVu", "", 11)
	pdf.SetTextColor(0, 0, 0)
	pdf.MultiCell(0, 6, content.Conclusion, "", "L", false)

	return pdf.OutputFileAndClose(filename)
}

func (s *Service) GenerateAndBuildPDF(ctx context.Context, in GenerateInput) (link string, meta GenerateMeta, err error) {
	s.log.Infof("[GenerateAndBuildPDF] Input: %+v", in)

	prompt := s.buildPrompt(in)
	plan, err := s.callGemini(ctx, prompt)
	if err != nil {
		return "", GenerateMeta{}, err
	}

	safe := strings.ReplaceAll(strings.ToLower(in.Kode+"_"+in.TopikTraining), " ", "-")
	ts := time.Now().Format("20060102-150405")
	filename := fmt.Sprintf("%s-%s.pdf", safe, ts)
	abs := filepath.Join(s.outDir, filename)

	if err := s.buildPDF(plan, abs); err != nil {
		return "", GenerateMeta{}, err
	}

	link = fmt.Sprintf("%s/files/materi/%s", s.pubBase, filename)
	meta = GenerateMeta{
		Title:      plan.Title,
		SlideCount: len(plan.Slides),
		Duration:   plan.Overview.Duration,
	}
	return link, meta, nil
}

func (s *Service) GenerateAndBuildPPTX(ctx context.Context, in GenerateInput, oldFileURL string, oldPdfURL string) (pptxLink string, pdfLink string, meta GenerateMeta, err error) {
	s.log.Infof("[GenerateAndBuildPPTX] Input: %+v", in)

	// Delete old files if exists
	if oldFileURL != "" {
		if err := s.DeleteOldFile(oldFileURL); err != nil {
			s.log.WithError(err).Warn("Gagal menghapus file PPTX lama, tapi proses generate tetap dilanjutkan")
		}
	}
	if oldPdfURL != "" {
		if err := s.DeleteOldFile(oldPdfURL); err != nil {
			s.log.WithError(err).Warn("Gagal menghapus file PDF lama, tapi proses generate tetap dilanjutkan")
		}
	}

	// Generate PPTX (enhanced dengan lebih banyak konten)
	s.log.Info("Generating enhanced presentation slides...")
	promptPPTX := s.buildPrompt(in)
	plan, err := s.callGemini(ctx, promptPPTX)
	if err != nil {
		return "", "", GenerateMeta{}, fmt.Errorf("failed to generate PPTX content: %w", err)
	}

	safe := strings.ReplaceAll(strings.ToLower(in.Kode+"_"+in.TopikTraining), " ", "-")
	ts := time.Now().Format("20060102-150405")
	
	// Build PPTX
	filenamePPTX := fmt.Sprintf("%s-%s.pptx", safe, ts)
	absPPTX := filepath.Join(s.outDir, filenamePPTX)
	if err := s.buildPPTX(plan, absPPTX); err != nil {
		return "", "", GenerateMeta{}, fmt.Errorf("failed to build PPTX: %w", err)
	}
	pptxLink = fmt.Sprintf("%s/files/materi/%s", s.pubBase, filenamePPTX)

	// Generate comprehensive PDF guide
	s.log.Info("Generating detailed PDF learning guide...")
	promptPDF := s.buildDetailedPrompt(in)
	detailedContent, err := s.callGeminiForDetailedContent(ctx, promptPDF)
	if err != nil {
		s.log.WithError(err).Warn("Failed to generate detailed PDF content, using basic PDF instead")
		// Fallback to basic PDF if detailed generation fails
		filenamePDF := fmt.Sprintf("%s-%s-guide.pdf", safe, ts)
		absPDF := filepath.Join(s.outDir, filenamePDF)
		if err := s.buildPDF(plan, absPDF); err != nil {
			return pptxLink, "", GenerateMeta{Title: plan.Title, SlideCount: len(plan.Slides), Duration: plan.Overview.Duration, PPTXLink: pptxLink, PDFLink: ""}, fmt.Errorf("failed to build fallback PDF: %w", err)
		}
		pdfLink = fmt.Sprintf("%s/files/materi/%s", s.pubBase, filenamePDF)
	} else {
		// Build detailed PDF
		filenamePDF := fmt.Sprintf("%s-%s-guide.pdf", safe, ts)
		absPDF := filepath.Join(s.outDir, filenamePDF)
		if err := s.buildDetailedPDF(detailedContent, absPDF); err != nil {
			return pptxLink, "", GenerateMeta{Title: plan.Title, SlideCount: len(plan.Slides), Duration: plan.Overview.Duration, PPTXLink: pptxLink, PDFLink: ""}, fmt.Errorf("failed to build detailed PDF: %w", err)
		}
		pdfLink = fmt.Sprintf("%s/files/materi/%s", s.pubBase, filenamePDF)
	}

	meta = GenerateMeta{
		Title:      plan.Title,
		SlideCount: len(plan.Slides),
		Duration:   plan.Overview.Duration,
		PPTXLink:   pptxLink,
		PDFLink:    pdfLink,
	}
	
	s.log.Infof("Successfully generated both PPTX and PDF. PPTX: %s, PDF: %s", pptxLink, pdfLink)
	return pptxLink, pdfLink, meta, nil
}
