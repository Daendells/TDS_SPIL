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
	Kode          string
	TopikTraining string
	Kompetensi    string
	Referensi     string
	Level         int
	Tools         string
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

func (s *Service) buildPrompt(in GenerateInput) string {
	topicType := s.determineTopicType(in.TopikTraining, in.Tools)

	basePrompt := fmt.Sprintf(`You are a professional instructional designer creating high-quality training content in Indonesian. Generate a comprehensive training plan following the OBJECTIVE → KONSEP → LANGKAH → STUDI KASUS → PENUTUP structure.

KONTEKS PELATIHAN:
KODE: %s
TOPIK: %s
KOMPETENSI: %s
LEVEL: %d (1=Pemula, 2=Menengah, 3=Mahir)
TOOLS/MODEL: %s
REFERENSI TAMBAHAN: %s
TIPE TOPIK: %s

STRUKTUR SLIDE WAJIB:

1. SLIDE PEMBUKA (1 slide):
   - slide_type: "opening"
   - Judul yang menarik dan menggambarkan inti pelatihan secara spesifik
   - Overview singkat yang menjelaskan relevansi topik dengan pekerjaan sehari-hari peserta
   - Tujuan pembelajaran yang jelas dan terukur dengan kata kerja aksi yang konkret
   - Manfaat langsung yang akan dirasakan peserta setelah mengikuti pelatihan ini
   - Ekspektasi hasil akhir berupa skill atau pengetahuan yang dapat diterapkan segera

2. OBJECTIVE (1-2 slide):
   - slide_type: "objective"
   - Tujuan pembelajaran yang menggunakan framework SMART dengan penjelasan mengapa setiap tujuan penting untuk dikuasai
   - Kompetensi spesifik yang akan dikembangkan beserta contoh penerapannya di lingkungan kerja
   - Indikator keberhasilan yang dapat diukur dengan metrik atau kriteria yang jelas
   - Manfaat praktis yang akan diperoleh peserta dalam konteks pekerjaan mereka sehari-hari
   - Hubungan antara tujuan pembelajaran dengan kebutuhan organisasi atau tim

3. KONSEP (3-4 slide):
   - slide_type: "concept"
   - Definisi konsep utama dengan penjelasan yang mendalam dan mudah dipahami oleh peserta dengan berbagai latar belakang
   - Prinsip-prinsip fundamental yang menjadi dasar dari topik yang dipelajari beserta rasionalisasi mengapa prinsip tersebut penting
   - Framework atau model teoretis yang digunakan dengan visualisasi mental yang membantu pemahaman
   - Terminologi kunci dengan definisi lengkap dan contoh penggunaan dalam konteks nyata
   - Hubungan logis antar konsep yang menunjukkan bagaimana setiap elemen saling terkait dan mendukung pemahaman holistik
   - Perbedaan antara konsep yang mirip atau sering disalahpahami untuk menghindari konfusi
   - Contoh ilustrasi yang relevan dengan pengalaman peserta untuk memperkuat pemahaman konseptual

4. LANGKAH (3-4 slide):
   - slide_type: "steps"
   - Prosedur langkah demi langkah yang sangat detail dan actionable dengan penjelasan tujuan setiap langkah
   - Panduan operasional lengkap yang mencakup apa yang harus dilakukan, bagaimana melakukannya, dan mengapa langkah tersebut penting
   - Best practices yang telah terbukti efektif beserta penjelasan mengapa praktik tersebut direkomendasikan
   - Tips implementasi praktis yang membantu peserta menghindari kesalahan umum dan mengoptimalkan hasil
   - Tools dan teknik spesifik yang dapat digunakan dengan panduan singkat cara penggunaannya
   - Checklist verifikasi untuk memastikan setiap langkah telah dilakukan dengan benar dan lengkap
   - Common pitfalls yang sering terjadi beserta strategi pencegahan dan solusi jika masalah muncul
   - Troubleshooting guide untuk mengatasi kendala yang mungkin dihadapi selama implementasi

5. STUDI KASUS (2-3 slide):
   - slide_type: "case_study"
   - Contoh kasus nyata dari konteks Indonesia atau industri yang relevan dengan peserta untuk meningkatkan relevansi pembelajaran
   - Problem statement yang jelas dengan deskripsi situasi yang detail termasuk background, stakeholder yang terlibat, dan tantangan yang dihadapi
   - Analisis situasi yang mendalam menggunakan framework atau konsep yang telah dipelajari sebelumnya dalam sesi pelatihan
   - Proses problem solving yang sistematis dengan penjelasan reasoning di balik setiap keputusan yang diambil
   - Solusi alternatif yang dipertimbangkan beserta evaluasi pro dan kontra dari masing-masing opsi
   - Implementasi solusi terpilih dengan langkah-langkah detail dan hasil yang dicapai
   - Lessons learned yang mencakup apa yang berjalan baik, apa yang bisa diperbaiki, dan insight yang dapat diterapkan di situasi lain
   - Key takeaways yang dapat segera diterapkan oleh peserta dalam pekerjaan mereka

6. PENUTUP (1 slide):
   - slide_type: "closing"
   - Ringkasan komprehensif dari semua poin penting yang telah dipelajari dengan penekanan pada key messages
   - Action items konkret yang dapat segera dilakukan peserta dalam 24-48 jam setelah pelatihan
   - Next steps yang terstruktur untuk pengembangan kompetensi lebih lanjut termasuk timeline yang disarankan
   - Resources tambahan berupa buku, artikel, video, atau tools yang dapat digunakan untuk pembelajaran mandiri
   - Motivasi penutup yang menginspirasi peserta untuk menerapkan ilmu yang telah dipelajari
   - Call to action yang jelas dan spesifik untuk memastikan transfer pembelajaran ke pekerjaan

%s

PERSYARATAN KONTEN YANG SANGAT DETAIL:

CRITICAL REQUIREMENTS:
- Setiap slide WAJIB memiliki 5-8 bullet points yang substansial dan informatif
- Setiap bullet point HARUS berisi minimal 2-4 kalimat lengkap yang memberikan penjelasan mendalam, bukan hanya satu kalimat pendek
- Hindari bullet point yang terlalu singkat atau hanya berupa keywords, setiap poin harus self-explanatory
- Setiap heading slide HARUS menggunakan format seperti "OBJECTIVE:", "KONSEP:", "LANGKAH 1:", "STUDI KASUS:" agar styling hijau dapat diterapkan
- Konten harus kaya akan detail praktis, contoh konkret, dan penjelasan yang memudahkan pemahaman
- Gunakan Bahasa Indonesia profesional yang natural dan engaging, hindari bahasa yang terlalu formal atau kaku

FORMAT BULLET POINTS YANG DIHARAPKAN:
Setiap bullet point harus mengikuti salah satu format berikut:

1. Sub-judul + Penjelasan Detail:
   "Definisi
   Problem analysis adalah proses berpikir sistematis untuk memahami akar penyebab dari sebuah masalah, bukan hanya mengidentifikasi gejala yang tampak di permukaan. Metode ini membantu kita untuk tidak terjebak pada solusi quick-fix yang hanya mengatasi symptom sementara, tetapi fokus pada penyelesaian fundamental yang mencegah masalah berulang. Dengan problem analysis yang baik, organisasi dapat menghemat waktu, biaya, dan resources karena masalah ditangani secara tuntas dari akarnya."

2. Poin Utama dengan Elaborasi:
   "• Fokus pada sistem, bukan individu
   Pendekatan yang efektif dalam problem analysis adalah melihat masalah sebagai hasil dari kegagalan sistem atau proses, bukan kesalahan personal seseorang. Dengan perspektif ini, kita dapat mengidentifikasi gap dalam prosedur, training, atau tools yang menyebabkan masalah terjadi. Blame culture hanya akan membuat orang defensif dan tidak mendorong perbaikan berkelanjutan, sedangkan system-focused approach menciptakan learning organization yang terus berkembang."

3. Langkah dengan Penjelasan Lengkap:
   "Langkah 1: Identifikasi Masalah Secara Spesifik
   Nyatakan masalah dalam satu kalimat yang jelas, objektif, dan berbasis fakta, hindari asumsi atau interpretasi subjektif. Pastikan definisi masalah fokus pada proses atau hasil yang tidak sesuai ekspektasi, bukan pada siapa yang melakukannya. Libatkan semua stakeholder yang relevan untuk memastikan pemahaman yang sama tentang apa yang menjadi masalah sebenarnya. Contoh yang baik: 'Pompa pendingin unit A berhenti beroperasi pada tanggal 15 Januari pukul 14:00, menyebabkan delay produksi selama 3 jam'."

DURASI DAN AKTIVITAS:
- Total durasi pelatihan: 60-90 menit dengan alokasi waktu yang realistis untuk setiap sesi
- Speaker notes untuk setiap slide: 250-400 kata dengan detailed guidance untuk fasilitator
- Sertakan 4-6 aktivitas interaktif yang engaging dengan instruksi yang sangat jelas dan time allocation yang tepat
- Buat 8-12 assessment questions yang menguji pemahaman aplikatif dengan jawaban yang komprehensif
- Referensi harus credible, up-to-date, dan relevan dengan konteks Indonesia jika memungkinkan

LARANGAN:
- JANGAN gunakan emoji dalam konten apapun
- JANGAN membuat bullet point yang hanya satu kalimat pendek tanpa elaborasi
- JANGAN gunakan jargon tanpa penjelasan yang memadai
- JANGAN membuat konten yang terlalu teoretis tanpa aplikasi praktis
- JANGAN menggunakan bahasa yang ambigu atau tidak jelas

OUTPUT FORMAT - JSON VALID:
Return ONLY valid JSON without any markdown formatting, comments, or additional text:

{
  "title": "Judul Pelatihan yang Menarik dan Deskriptif",
  "overview": {
    "goals": ["Tujuan 1 yang spesifik", "Tujuan 2 yang terukur"],
    "outcomes": ["Hasil 1 yang konkret", "Hasil 2 yang aplikatif"],
    "duration": "75 menit",
    "audience": "Target peserta dengan level kompetensi"
  },
  "slides": [
    {
      "heading": "OBJECTIVE: TUJUAN PEMBELAJARAN",
      "bullets": [
        "Sub-judul Pertama",
        "Penjelasan lengkap dalam 2-4 kalimat yang memberikan konteks, detail, dan contoh konkret untuk memudahkan pemahaman peserta. Setiap kalimat harus menambah value dan insight baru yang relevan dengan topik pembahasan.",
        "• Poin pertama dengan elaborasi",
        "Penjelasan mendalam tentang poin ini dalam beberapa kalimat yang mencakup why, how, dan what. Berikan contoh praktis yang relatable dengan pengalaman peserta di dunia kerja.",
        "• Poin kedua dengan detail lengkap",
        "Elaborasi yang substansial dengan penjelasan step-by-step atau breakdown dari konsep yang kompleks menjadi lebih mudah dipahami. Include tips, best practices, atau common mistakes to avoid."
      ],
      "speaker_notes": "Detailed guidance untuk fasilitator dalam 250-400 kata dengan interaction cues dan timing",
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

CONTOH KONTEN BERKUALITAS TINGGI:

"bullets": [
  "KONSEP: APA ITU PROBLEM ANALYSIS?",
  "",
  "Definisi Problem Analysis",
  "Problem analysis adalah metodologi sistematis untuk mengidentifikasi, menganalisis, dan memahami akar penyebab dari sebuah masalah atau deviasi yang terjadi dalam proses kerja. Berbeda dengan troubleshooting yang hanya fokus pada memperbaiki gejala, problem analysis menggali lebih dalam untuk menemukan why di balik setiap issue yang muncul. Dengan pendekatan ini, solusi yang dihasilkan bersifat sustainable dan preventive, bukan hanya reaktif terhadap symptom yang tampak di permukaan.",
  "",
  "• Perbedaan Symptom dan Problem",
  "Symptom adalah tanda atau gejala yang tampak di permukaan dan mudah diobservasi, seperti mesin yang berhenti, error message yang muncul, atau delay dalam delivery. Sementara problem adalah akar penyebab yang berada di balik symptom tersebut, yang mungkin berupa prosedur yang tidak diikuti, kurangnya maintenance, atau gap dalam training. Memahami perbedaan ini sangat critical karena mengatasi symptom saja hanya memberikan relief sementara, sedangkan menyelesaikan problem akan mencegah issue yang sama terulang di masa depan.",
  "",
  "• Tujuan Utama Problem Analysis",
  "Tujuan pertama adalah mencegah recurrence dari masalah yang sama dengan memastikan akar penyebab telah dieliminasi secara tuntas. Kedua, menemukan solusi yang efisien dari segi cost, time, dan resources, sehingga organisasi tidak perlu terus-menerus firefighting untuk issue yang seharusnya bisa dicegah. Ketiga, membangun kultur continuous improvement di mana setiap masalah dilihat sebagai opportunity untuk learning dan strengthening system, bukan sebagai blame game yang membuat orang takut untuk melaporkan issue."
]`,
		in.Kode,
		in.TopikTraining,
		in.Kompetensi,
		in.Level,
		in.Tools,
		valueOrDash(in.Referensi),
		topicType,
		s.getTopicSpecificGuidelines(topicType),
	)

	return basePrompt
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

func valueOrDash(s string) string {
	if strings.TrimSpace(s) == "" {
		return "-"
	}
	return s
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
	pdf.AddUTF8Font("DejaVu", "I", "fonts/DejaVuSans.ttf")
	pdf.AddUTF8Font("DejaVu", "BI", "fonts/DejaVuSans-Bold.ttf")

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
			pdf.SetFont("DejaVu", "I", 10)
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
			pdf.SetFont("DejaVu", "I", 11)
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

func (s *Service) GenerateAndBuildPPTX(ctx context.Context, in GenerateInput) (link string, meta GenerateMeta, err error) {
	s.log.Infof("[GenerateAndBuildPPTX] Input: %+v", in)

	prompt := s.buildPrompt(in)
	plan, err := s.callGroq(ctx, prompt)
	if err != nil {
		return "", GenerateMeta{}, err
	}

	safe := strings.ReplaceAll(strings.ToLower(in.Kode+"_"+in.TopikTraining), " ", "-")
	ts := time.Now().Format("20060102-150405")
	filename := fmt.Sprintf("%s-%s.pptx", safe, ts)
	abs := filepath.Join(s.outDir, filename)

	if err := s.buildPPTX(plan, abs); err != nil {
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
