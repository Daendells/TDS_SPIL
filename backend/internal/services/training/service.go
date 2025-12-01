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
		log.Warn("GROQ_API_KEY kosong - panggilan LLM akan gagal")
	}
	if model == "" {
		model = "llama-3.3-70b-versatile"
	}
	if pubBase == "" {
		pubBase = "http://localhost:8080"
	}

	outDir := "./public/materi"
	_ = os.MkdirAll(outDir, 0o755)

	return &Service{
		log:     log,
		http:    &http.Client{Timeout: 120 * time.Second},
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
    "goals": ["Tujuan 1 yang spesifik", "Tujuan 2 yang terukur"],
    "outcomes": ["Hasil 1 yang konkret", "Hasil 2 yang aplikatif"],
    "duration": "60-75 menit",
    "audience": "Target peserta dengan level kompetensi"
  },
  "slides": [
    {
      "heading": "OBJECTIVE: TUJUAN PEMBELAJARAN",
      "bullets": [
        "Sub-judul Pertama",
        "Penjelasan fokus dalam 2-3 kalimat yang memberikan konteks dan contoh konkret. Langsung ke poin penting tanpa bertele-tele.",
        "• Poin pertama dengan elaborasi",
        "Penjelasan singkat tentang poin ini mencakup why dan how. Berikan contoh praktis yang relatable.",
        "• Poin kedua dengan detail",
        "Elaborasi yang efisien dengan penjelasan step-by-step utama. Include tips paling penting atau common mistake yang critical."
      ],
      "speaker_notes": "Guidance untuk fasilitator dalam 150-250 kata dengan interaction cues dan timing",
      "slide_type": "objective"
    }
  ],
  "activities": [
    {
      "title": "Judul Aktivitas yang Menarik",
      "instructions": "Instruksi lengkap dan detail dengan langkah-langkah yang clear",
      "time": "15 menit"
    }
  ],
  "assessment": [
    {
      "question": "Pertanyaan yang menguji pemahaman aplikatif",
      "answer": "Jawaban komprehensif dengan penjelasan reasoning"
    }
  ],
  "references": [
    "Referensi 1 yang credible dan up-to-date",
    "Referensi 2 yang relevan dengan konteks Indonesia"
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

4. ⭐ REFERENSI TAMBAHAN (Opsional - PENTING!):
   %s
   %s
   
   ⚠️ CATATAN PENTING UNTUK REFERENSI TAMBAHAN:
   - Jika ada referensi tambahan, WAJIB diintegrasikan ke dalam materi
   - Buat 1 SLIDE KHUSUS tentang referensi tambahan (di bagian KONSEP atau setelahnya)
   - Jelaskan bagaimana referensi ini memperkaya pemahaman topik
   - Berikan contoh konkret dari referensi tersebut
   - Tunjukkan aplikasi praktis dari referensi dalam konteks topik training

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
				return "Gunakan referensi ini untuk memperkaya contoh dan memperdalam pembahasan."
			}
			return "Fokus sepenuhnya pada Topik Training, Tools/Metode, dan Deskripsi Perilaku."
		}(),
	)
}

// buildStructureSection defines the slide structure
func (s *Service) buildStructureSection() string {
	return `STRUKTUR SLIDE WAJIB:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SLIDE PEMBUKA (1 slide):
   ├─ slide_type: "opening"
   ├─ Judul menarik yang reflect Topik Training secara spesifik
   ├─ Hook: Mengapa topik ini penting untuk pekerjaan peserta?
   ├─ Overview: Brief context tentang Topik + Tools yang akan dipelajari
   ├─ Learning outcomes yang tie ke Deskripsi Perilaku
   └─ Ekspektasi hasil: Skill/knowledge yang langsung applicable

2. OBJECTIVE (1 slide):
   ├─ slide_type: "objective"
   ├─ Tujuan SMART yang directly address Topik Training
   ├─ Kompetensi yang developed (align dengan Deskripsi Perilaku)
   ├─ Connection: Bagaimana Tools mendukung pencapaian objective
   └─ Practical benefits dalam konteks pekerjaan sehari-hari

3. KONSEP (2-3 slide):
   ├─ slide_type: "concept"
   ├─ Definisi Topik Training yang jelas dan concise
   ├─ Framework/Model (Tools) dijelaskan dengan fokus pada hal penting
   ├─ Terminologi kunci dengan contoh singkat
   ├─ Hubungan logis: Konsep → Tools → Aplikasi → Perilaku
   └─ [JIKA ADA REFERENSI TAMBAHAN]: 1 slide khusus membahas referensi

4. LANGKAH (2-3 slide):
   ├─ slide_type: "steps"
   ├─ Step-by-step implementation menggunakan Tools (fokus pada langkah utama)
   ├─ Setiap langkah explain: WHAT + HOW (singkat & jelas)
   ├─ Best practices yang paling critical
   ├─ Practical tips untuk optimize hasil
   └─ Common pitfalls yang paling sering terjadi

5. STUDI KASUS (2 slide):
   ├─ slide_type: "case_study"
   ├─ Real case dari konteks Indonesia/industri relevant
   ├─ Problem statement yang jelas
   ├─ Solution menggunakan Tools yang telah dijelaskan
   ├─ Results achieved dan lessons learned
   └─ Key takeaways: Bagaimana case ini demonstrate Deskripsi Perilaku

6. PENUTUP (1 slide):
   ├─ slide_type: "closing"
   ├─ Summary: Topik + Tools + Perilaku yang telah covered
   ├─ Action items konkret (24-48 jam pertama)
   ├─ Next steps untuk continuous development
   ├─ Additional resources untuk self-learning
   ├─ Motivational closing yang inspire action
   └─ Clear call-to-action untuk apply learning
`
}

// buildContentRequirements specifies content quality standards
func (s *Service) buildContentRequirements() string {
	return `PERSYARATAN KONTEN BERKUALITAS TINGGI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL REQUIREMENTS:
✓ Setiap slide: 4-6 bullet points yang substansial dan fokus
✓ Setiap bullet: 2-3 kalimat yang padat dan informatif (tidak bertele-tele)
✓ Hindari bullet yang hanya keyword atau terlalu panjang
✓ Format heading: "OBJECTIVE:", "KONSEP:", "LANGKAH 1:", dll (untuk styling hijau)
✓ Prioritaskan poin-poin paling penting dan actionable
✓ Bahasa Indonesia profesional, concise, engaging (langsung ke inti)
✓ Konsistensi reference ke Topik + Tools + Deskripsi Perilaku di semua slide

FORMAT BULLET POINTS YANG DIHARAPKAN:

1. Sub-judul + Penjelasan Fokus (2-3 kalimat):
   "Definisi Problem Analysis
   Problem analysis adalah proses sistematis untuk memahami akar penyebab masalah, bukan hanya gejala permukaan. Metode ini fokus pada solusi fundamental yang mencegah masalah berulang, sehingga organisasi menghemat waktu dan resources."

2. Poin Utama dengan Elaborasi (2-3 kalimat):
   "• Fokus pada sistem, bukan individu
   Pendekatan efektif adalah melihat masalah sebagai hasil kegagalan sistem atau proses, bukan kesalahan personal. Dengan perspektif ini, kita identifikasi gap dalam prosedur atau tools, dan ciptakan learning organization yang terus berkembang."

3. Langkah dengan Penjelasan (2-3 kalimat):
   "Langkah 1: Identifikasi Masalah Secara Spesifik
   Nyatakan masalah dalam satu kalimat yang jelas, objektif, dan berbasis fakta. Libatkan stakeholder untuk memastikan pemahaman yang sama. Contoh: 'Pompa pendingin unit A berhenti pada 15 Jan pukul 14:00, delay produksi 3 jam'."

DURASI DAN AKTIVITAS:
├─ Total durasi: 60-75 menit (alokasi realistis per sesi)
├─ Speaker notes per slide: 150-250 kata (guidance efisien untuk fasilitator)
├─ 3-4 aktivitas interaktif (clear instructions + time allocation)
├─ 6-8 assessment questions (test pemahaman aplikatif + comprehensive answers)
└─ Referensi credible, up-to-date, relevant (konteks Indonesia jika memungkinkan)

⭐ SLIDE KHUSUS REFERENSI TAMBAHAN (WAJIB jika ada referensi):
Jika ada referensi tambahan, buat 1 slide tersendiri dengan format:
{
  "heading": "REFERENSI TAMBAHAN: [Nama Referensi]",
  "bullets": [
    "🔖 SUMBER REFERENSI",
    "[Nama referensi/artikel/buku/framework yang disebutkan user]",
    "",
    "• Relevansi dengan Topik Training",
    "Jelaskan bagaimana referensi ini memperkaya pemahaman topik dalam 2-3 kalimat fokus.",
    "",
    "• Konsep Kunci dari Referensi",
    "Highlight 2-3 konsep utama dari referensi yang directly applicable ke topik training.",
    "",
    "• Aplikasi Praktis",
    "Tunjukkan bagaimana mengintegrasikan referensi ini dengan tools/metode dalam konteks pekerjaan.",
    "",
    "• Contoh Implementasi",
    "Berikan 1 contoh konkret bagaimana referensi ini dapat diaplikasikan dalam scenario real."
  ],
  "speaker_notes": "Guidance 150-200 kata tentang cara membahas referensi tambahan",
  "slide_type": "concept"
}

LARANGAN:
✗ JANGAN gunakan emoji dalam konten apapun (kecuali slide referensi tambahan)
✗ JANGAN buat bullet point terlalu panjang (max 3-4 kalimat per bullet)
✗ JANGAN gunakan jargon tanpa penjelasan memadai
✗ JANGAN konten terlalu teoretis tanpa aplikasi praktis
✗ JANGAN bahasa ambigu atau tidak jelas
✗ JANGAN abaikan integrasi Topik + Tools + Deskripsi Perilaku
✗ JANGAN skip slide referensi tambahan jika ada referensi dari user
`
}

// getExampleSection provides quality content examples
func (s *Service) getExampleSection() string {
	return `CONTOH KONTEN BERKUALITAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Slide KONSEP yang baik (concise & fokus):

"bullets": [
  "KONSEP: PROBLEM ANALYSIS SISTEMATIS",
  "",
  "Definisi Problem Analysis",
  "Problem analysis adalah metodologi sistematis untuk mengidentifikasi dan memahami akar penyebab masalah dalam proses kerja. Berbeda dengan troubleshooting yang fokus pada gejala, problem analysis menggali why di balik setiap issue untuk menghasilkan solusi sustainable dan preventive.",
  "",
  "• Tools: 5 Whys Method",
  "5 Whys adalah teknik iteratif yang developed oleh Toyota untuk drill down dari symptom hingga root cause dengan bertanya 'Mengapa?' secara berulang (typically 5 kali). Metode ini membantu team uncover underlying system issues dan prevent waste resources fixing wrong problems.",
  "",
  "• Perbedaan Symptom dan Root Cause",
  "Symptom adalah gejala yang tampak di permukaan (mesin berhenti, error message, delay). Root cause adalah faktor fundamental di balik symptom (prosedur tidak diikuti, kurang maintenance, gap dalam training). Mengatasi root cause mencegah issue berulang dan demonstrate perilaku problem-solving efektif.",
  "",
  "• Impact: Problem Analysis → Decision Making → Improvement",
  "Problem analysis yang solid menjadi foundation untuk decision making efektif karena keputusan based on accurate understanding, bukan assumptions. Decisions yang informed by proper analysis memiliki higher success rate dan create learning opportunities untuk continuous improvement."
]

Slide REFERENSI TAMBAHAN yang menonjol (jika ada):

"bullets": [
  "🔖 REFERENSI TAMBAHAN: [Nama Framework/Artikel]",
  "",
  "• Relevansi dengan Problem Analysis",
  "Jelaskan bagaimana referensi ini complement atau extend konsep problem analysis yang sudah dijelaskan. Tunjukkan unique value yang ditambahkan oleh referensi ini.",
  "",
  "• Konsep Kunci",
  "Highlight 2-3 konsep utama dari referensi yang directly applicable. Contoh: framework thinking, systematic approach, atau specific methodology yang introduced oleh referensi.",
  "",
  "• Aplikasi dalam Konteks Kerja",
  "Tunjukkan step-by-step bagaimana mengintegrasikan referensi dengan tools yang sudah dijelaskan. Berikan scenario konkret di workplace.",
  "",
  "• Benefit Praktis",
  "Jelaskan tangible benefits yang didapat ketika apply referensi ini dalam daily work. Focus pada measurable outcomes atau observable improvements."
]
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

func (s *Service) callGroq(ctx context.Context, prompt string) (*Plan, error) {
	if s.apiKey == "" {
		return nil, errors.New("GROQ_API_KEY tidak di-set")
	}

	body := map[string]any{
		"model": s.model,
		"messages": []map[string]string{
			{"role": "system", "content": "You are an expert instructional designer. Respond ONLY with valid JSON. No markdown, no code fences, no explanations. Just pure JSON."},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.5,
		"top_p":       0.9,
		"max_tokens":  4500,
	}

	b, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.groq.com/openai/v1/chat/completions",
		bytes.NewReader(b),
	)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		s.log.Errorf("Groq API error: status=%d body=%s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("groq status %d", resp.StatusCode)
	}

	var raw struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}
	if len(raw.Choices) == 0 {
		return nil, errors.New("no choices from groq")
	}

	content := strings.TrimSpace(raw.Choices[0].Message.Content)
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

	basePrompt := fmt.Sprintf(`You are an expert educational content writer creating a COMPREHENSIVE, IN-DEPTH LEARNING GUIDE in Indonesian. This is NOT a presentation - it's a detailed study guide that provides complete understanding of the topic.

KONTEKS PELATIHAN:
- Topik: %s
- Kompetensi: %s
- Level: %d
- Tools/Framework: %s
- Deskripsi Perilaku: %s
- Referensi Utama: %s
- Referensi Tambahan: %s

%s

STRUKTUR KONTEN DETAIL (SUPER LENGKAP):

1. INTRODUCTION (800-1200 kata):
   - Konteks dan latar belakang topik secara mendalam
   - Mengapa topik ini penting di workplace modern Indonesia
   - Bagaimana topik ini relevan dengan level kompetensi yang ditargetkan
   - Overview lengkap apa yang akan dipelajari
   - Manfaat konkret yang akan didapat setelah mempelajari materi ini

2. CORE CONCEPTS (4-6 SECTIONS, masing-masing 800-1500 kata):
   Setiap section harus mencakup:
   - Penjelasan konsep secara detail dan mendalam
   - Teori dan framework yang mendasari
   - Contoh-contoh konkret dan relatable (minimal 3 per section)
   - Best practices dan proven strategies
   - Common mistakes dan cara menghindarinya
   - Tips implementasi praktis
   - Latihan refleksi atau self-assessment

3. PRACTICAL IMPLEMENTATION GUIDE (1500-2500 kata):
   - Step-by-step guide yang sangat detail
   - Setiap step dijelaskan dengan lengkap (150-300 kata per step)
   - Contoh implementasi di berbagai konteks
   - Checklist dan tools yang bisa digunakan
   - Troubleshooting guide untuk masalah umum
   - Success metrics dan cara mengukur progress

4. CASE STUDIES (3-5 studi kasus, masing-masing 400-600 kata):
   - Studi kasus lengkap dari dunia nyata
   - Context, challenge, solution, outcome yang detail
   - Analysis mendalam tentang mengapa berhasil/gagal
   - Key lessons dan takeaways
   - Aplikasi ke situasi lain

5. COMPREHENSIVE FAQ (15-25 pertanyaan):
   - Pertanyaan umum yang sering muncul
   - Jawaban super detail dan lengkap (100-200 kata per jawaban)
   - Include edge cases dan situasi khusus
   - Cross-references ke bagian lain dalam guide

6. RESOURCES & FURTHER LEARNING:
   - Books (minimal 5) dengan deskripsi singkat
   - Articles dan research papers
   - Online courses dan tutorials
   - Tools dan templates
   - Communities dan forums

7. CONCLUSION & ACTION PLAN (500-800 kata):
   - Summary komprehensif
   - Immediate action steps
   - Long-term development roadmap
   - Self-assessment tools
   - Next steps untuk continuing education

REQUIREMENTS:
- Total content harus SANGAT PANJANG dan DETAIL (8000-12000+ kata total)
- Setiap konsep dijelaskan secara menyeluruh dengan multiple perspectives
- Banyak contoh konkret, real-world applications, dan practical tips
- Bahasa Indonesia yang jelas, engaging, dan mudah dipahami
- Include analogies, metaphors, dan storytelling untuk clarity
- Cross-reference antar sections untuk comprehensive understanding
- Actionable insights di setiap bagian
- Focus pada deep understanding, bukan hanya surface-level knowledge

OUTPUT FORMAT - JSON VALID:
{
  "title": "Panduan Lengkap: [Topik Training]",
  "introduction": "Penjelasan panjang dan mendalam tentang topik (800-1200 kata)...",
  "sections": [
    {
      "title": "Judul Section",
      "content": "Konten super lengkap dan detail (800-1500 kata)...",
      "key_points": ["Poin penting 1", "Poin penting 2", ...],
      "examples": ["Contoh detail 1", "Contoh detail 2", "Contoh detail 3"],
      "exercises": "Latihan atau pertanyaan refleksi untuk section ini"
    }
  ],
  "practical_guide": {
    "step_by_step": [
      {
        "step_number": 1,
        "title": "Judul Step",
        "description": "Penjelasan super detail step ini (150-300 kata)...",
        "examples": ["Contoh implementasi 1", "Contoh implementasi 2"]
      }
    ],
    "tips": ["Tips praktis 1", "Tips praktis 2", ...],
    "common_pitfalls": ["Kesalahan umum 1 dan cara menghindarinya", ...]
  },
  "case_studies": [
    {
      "title": "Judul Case Study",
      "context": "Konteks lengkap (100-150 kata)",
      "challenge": "Tantangan yang dihadapi (80-120 kata)",
      "solution": "Solusi yang diterapkan (150-200 kata)",
      "outcome": "Hasil yang didapat (80-120 kata)",
      "lessons": ["Pelajaran 1", "Pelajaran 2", "Pelajaran 3"]
    }
  ],
  "faq": [
    {
      "question": "Pertanyaan yang relevan?",
      "answer": "Jawaban super detail dan lengkap (100-200 kata)..."
    }
  ],
  "resources": {
    "books": ["Buku 1: Deskripsi", "Buku 2: Deskripsi", ...],
    "articles": ["Artikel 1", "Artikel 2", ...],
    "videos": ["Video 1", "Video 2", ...],
    "tools": ["Tool 1", "Tool 2", ...],
    "additional": ["Resource tambahan 1", "Resource tambahan 2", ...]
  },
  "conclusion": "Kesimpulan komprehensif dan action plan (500-800 kata)..."
}

PENTING: 
- Hasilkan konten yang SANGAT LENGKAP dan DETAIL
- Setiap bagian harus substantif dan value-adding
- Ini bukan summary, tapi comprehensive learning guide
- Peserta harus bisa menguasai topik HANYA dari membaca guide ini`, 
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

// callGroqForDetailedContent calls LLM for detailed content
func (s *Service) callGroqForDetailedContent(ctx context.Context, prompt string) (*DetailedContent, error) {
	payload := map[string]interface{}{
		"model": s.model,
		"messages": []map[string]string{
			{"role": "system", "content": "You are an expert educational content writer. Always respond with valid JSON only, no markdown formatting."},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.8,
		"max_tokens": 16000, // Much higher for detailed content
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("groq API error: %d - %s", resp.StatusCode, string(body))
	}

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(body, &groqResp); err != nil {
		return nil, err
	}

	if len(groqResp.Choices) == 0 {
		return nil, errors.New("no choices in groq response")
	}

	content := groqResp.Choices[0].Message.Content
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
	plan, err := s.callGroq(ctx, prompt)
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
	plan, err := s.callGroq(ctx, promptPPTX)
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
	detailedContent, err := s.callGroqForDetailedContent(ctx, promptPDF)
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
