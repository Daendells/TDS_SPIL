package training

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"

	// "encoding/xml"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/AlexGames73/unioffice-free/measurement" // <-- DITAMBAHKAN
	"github.com/AlexGames73/unioffice-free/presentation"
	"github.com/jung-kurt/gofpdf"
	"github.com/sirupsen/logrus"
)

type Service struct {
	log     *logrus.Logger
	http    *http.Client
	apiKey  string
	model   string
	pubBase string // BACKEND_PUBLIC_URL
	outDir  string // ./public/materi
}

func NewTrainingService(log *logrus.Logger, apiKey, model, pubBase string) *Service {
	if apiKey == "" {
		log.Warn("GROQ_API_KEY kosong — panggilan LLM akan gagal")
	}
	if model == "" {
		model = "llama-3.1-8b-instant"
	}
	if pubBase == "" {
		pubBase = "http://localhost:8080"
	}

	outDir := "./public/materi"
	_ = os.MkdirAll(outDir, 0o755)

	return &Service{
		log:     log,
		http:    &http.Client{Timeout: 90 * time.Second},
		apiKey:  apiKey,
		model:   model,
		pubBase: strings.TrimRight(pubBase, "/"),
		outDir:  outDir,
	}
}

// ========================
// Input & Model Structures
// ========================
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

// ========================
// Prompt Builder (Refined)
// ========================
func (s *Service) buildPrompt(in GenerateInput) string {
	// Determine topic type for specialized templates
	topicType := s.determineTopicType(in.TopikTraining, in.Tools)

	basePrompt := fmt.Sprintf(`You are a professional instructional designer. Create a high-quality, instructor-led training plan in JSON for Indonesian learners following the OBJECTIVE → KONSEP → LANGKAH → STUDI KASUS → PENUTUP structure.

KONTEKS:
KODE: %s
TOPIK: %s
KOMPETENSI: %s
LEVEL: %d (1=Beginner, 2=Intermediate, 3=Advanced)
TOOLS/MODEL: %s
REFERENSI TAMBAHAN (opsional): %s
TIPE TOPIK: %s

PERSYARATAN STRUKTUR SLIDE:
Ikuti struktur konsisten berikut untuk setiap materi pelatihan:

1. SLIDE PEMBUKA (1 slide):
	- slide_type: "opening"
	- Judul materi yang menarik dan deskriptif
	- Overview singkat yang memotivasi
	- Tujuan pembelajaran yang spesifik dan terukur

2. OBJECTIVE (1-2 slide):
	- slide_type: "objective"
	- Tujuan pembelajaran yang SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
	- Manfaat konkret yang akan diperoleh peserta
	- Ekspektasi hasil akhir pelatihan yang jelas
	- Key performance indicators untuk mengukur keberhasilan

3. KONSEP (2-3 slide):
	- slide_type: "concept"
	- Definisi dan teori dasar yang mudah dipahami dengan contoh detail
	- Prinsip-prinsip fundamental dengan ilustrasi praktis dan analogi
	- Framework atau model yang digunakan dengan penjelasan mendalam
	- Terminologi penting dengan definisi lengkap dan konteks penggunaan
	- Hubungan antar konsep yang logis dengan diagram verbal
	- Background theory dan research findings yang mendukung

4. LANGKAH (3-4 slide):
	- slide_type: "steps"
	- Prosedur step-by-step yang praktis dan actionable dengan detail implementasi
	- Checklist atau panduan operasional yang komprehensif
	- Best practices dan tips implementasi dari praktisi dengan contoh nyata
	- Tools dan teknik yang digunakan dengan tutorial penggunaan lengkap
	- Common pitfalls dan cara menghindarinya dengan solusi alternatif
	- Troubleshooting guide untuk masalah umum

5. STUDI KASUS (1-2 slide):
	- slide_type: "case_study"
	- Contoh nyata dari konteks Indonesia atau industri lokal dengan detail lengkap
	- Analisis situasi praktis dengan problem statement yang jelas dan background
	- Problem solving scenarios dengan multiple solutions dan trade-offs
	- Lessons learned dan key insights dengan actionable recommendations
	- ROI atau impact measurement dari implementasi dengan data konkret
	- Success factors dan critical success criteria

6. PENUTUP (1 slide):
	- slide_type: "closing"
	- Ringkasan key takeaways yang memorable dengan action points
	- Action items konkret untuk peserta dengan timeline dan deliverables
	- Next steps atau follow-up yang terstruktur dengan milestone
	- Resources tambahan untuk pembelajaran lanjutan dengan prioritas

%s

PERSYARATAN KONTEN:
- Gunakan Bahasa Indonesia profesional, ringkas namun komprehensif
- Setiap bullet point harus actionable, specific, dan detailed (minimal 15-25 kata per bullet)
- Berikan penjelasan mendalam dengan contoh praktis dan ilustrasi
- Durasi total 60–90 menit, cantumkan di overview.duration
- Speaker notes harus detailed dan praktis untuk instructor (minimal 50-100 kata)
- Sertakan minimal 2-3 activities yang interaktif dengan instruksi lengkap
- Buat 5-8 assessment questions yang menguji pemahaman praktis dengan scenario
- Referensi harus credible dan up-to-date
- JANGAN gunakan emoji sama sekali dalam konten
- Fokus pada substansi dan kedalaman materi

PERSYARATAN OUTPUT:
Keluarkan hanya JSON valid (tanpa komentar/teks lain), mengikuti skema persis:

{
"title": string,
"overview": { "goals": string[], "outcomes": string[], "duration": string, "audience": string },
"slides": [
{"heading": string, "bullets": string[4..6], "speaker_notes": string, "slide_type": string}
],
"activities": [
{"title": string, "instructions": string, "time": string}
],
"assessment": [
{"question": string, "answer": string}
],
"references": string[]
}

DETAIL SLIDE:
- Buat 8–12 slide total mengikuti struktur di atas
- slide_type: "pembuka", "objective", "konsep", "langkah", "studi_kasus", atau "penutup"
- Setiap slide harus memiliki 4-6 bullet points yang substantif dan informatif
- Bullet points harus berisi penjelasan lengkap, bukan hanya poin singkat
- Prioritaskan kedalaman dan praktikalitas konten`,
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

// determineTopicType categorizes the training topic for specialized templates
func (s *Service) determineTopicType(topik, tools string) string {
	topikLower := strings.ToLower(topik)
	toolsLower := strings.ToLower(tools)

	// Technical/Tools-based topics
	if strings.Contains(toolsLower, "excel") || strings.Contains(toolsLower, "powerpoint") ||
		strings.Contains(toolsLower, "word") || strings.Contains(toolsLower, "office") ||
		strings.Contains(topikLower, "teknologi") || strings.Contains(topikLower, "software") ||
		strings.Contains(topikLower, "sistem") || strings.Contains(topikLower, "digital") {
		return "technical"
	}

	// Soft Skills topics
	if strings.Contains(topikLower, "komunikasi") || strings.Contains(topikLower, "leadership") ||
		strings.Contains(topikLower, "teamwork") || strings.Contains(topikLower, "trust") ||
		strings.Contains(topikLower, "accountability") || strings.Contains(topikLower, "interpersonal") ||
		strings.Contains(topikLower, "emotional") || strings.Contains(topikLower, "motivasi") {
		return "soft_skill"
	}

	// Framework/Methodology topics
	if strings.Contains(topikLower, "framework") || strings.Contains(topikLower, "model") ||
		strings.Contains(topikLower, "methodology") || strings.Contains(topikLower, "agile") ||
		strings.Contains(topikLower, "smart") || strings.Contains(topikLower, "grpi") ||
		strings.Contains(toolsLower, "model") || strings.Contains(toolsLower, "framework") {
		return "framework"
	}

	// Management/Process topics
	if strings.Contains(topikLower, "management") || strings.Contains(topikLower, "planning") ||
		strings.Contains(topikLower, "execution") || strings.Contains(topikLower, "control") ||
		strings.Contains(topikLower, "prioritization") || strings.Contains(topikLower, "goals") {
		return "management"
	}

	return "general"
}

// getTopicSpecificGuidelines provides specialized instructions based on topic type
func (s *Service) getTopicSpecificGuidelines(topicType string) string {
	switch topicType {
	case "technical":
		return `PANDUAN KHUSUS TOPIK TEKNIS:
- Sertakan screenshot atau step-by-step visual descriptions
- Berikan shortcut keyboard dan tips efisiensi
- Cantumkan system requirements dan compatibility
- Sediakan troubleshooting common issues
- Buat hands-on exercises dengan file contoh
- Referensi harus include official documentation`

	case "soft_skill":
		return `PANDUAN KHUSUS SOFT SKILLS:
- Gunakan storytelling dan real-life scenarios
- Sertakan self-assessment tools dan reflection questions
- Berikan role-play activities dan group discussions
- Cantumkan behavioral indicators dan measurement metrics
- Fokus pada emotional intelligence dan interpersonal dynamics
- Referensi dari psychology dan organizational behavior research`

	case "framework":
		return `PANDUAN KHUSUS FRAMEWORK/MODEL:
- Jelaskan origin dan theoretical foundation
- Berikan comparison dengan framework alternatif
- Sertakan implementation roadmap yang detail
- Cantumkan success metrics dan KPIs
- Buat template dan tools untuk immediate application
- Referensi dari original authors dan case studies`

	case "management":
		return `PANDUAN KHUSUS MANAJEMEN:
- Fokus pada decision-making processes
- Sertakan delegation dan accountability structures
- Berikan performance measurement tools
- Cantumkan change management considerations
- Buat action planning templates
- Referensi dari management literature dan business cases`

	default:
		return `PANDUAN UMUM:
- Seimbangkan teori dan praktik
- Sertakan Indonesian context dan examples
- Berikan actionable takeaways
- Cantumkan follow-up resources
- Buat engaging dan interactive content`
	}
}

func valueOrDash(s string) string {
	if strings.TrimSpace(s) == "" {
		return "-"
	}
	return s
}

// ========================
// LLM API Call (Groq)
// ========================
func (s *Service) callGroq(ctx context.Context, prompt string) (*Plan, error) {
	if s.apiKey == "" {
		return nil, errors.New("GROQ_API_KEY tidak di-set")
	}

	body := map[string]any{
		"model": s.model,
		"messages": []map[string]string{
			{"role": "system", "content": "Respond ONLY with valid JSON. No markdown code fences."},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.4,
		"top_p":       0.9,
		"max_tokens":  3500,
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

	var plan Plan
	if err := json.Unmarshal([]byte(content), &plan); err != nil {
		s.log.WithError(err).Warn("JSON parse error, content:\n" + content)
		return nil, fmt.Errorf("gagal parsing JSON dari model: %w", err)
	}

	return &plan, nil
}

// ========================
// PDF Generation (No changes)
// ========================
func (s *Service) buildPDF(plan *Plan, filename string) error {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(true, 15)

	// ✅ Register UTF-8 fonts
	pdf.AddUTF8Font("DejaVu", "", "fonts/DejaVuSans.ttf")
	pdf.AddUTF8Font("DejaVu", "B", "fonts/DejaVuSans-Bold.ttf")

	// Optional — gunakan bold sebagai fallback untuk italic
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
		pdf.CellFormat(0, 10, fmt.Sprintf("Slide %d – %s", i+1, sl.Heading), "", 1, "L", false, 0, "")
		pdf.Ln(2)
		pdf.SetFont("DejaVu", "", 12)
		for _, b := range sl.Bullets {
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

	// ✅ Activities
	if len(plan.Activities) > 0 {
		pdf.AddPage()
		pdf.SetFont("DejaVu", "B", 16)
		pdf.CellFormat(0, 10, "Aktivitas/Latihan", "", 1, "L", false, 0, "")
		pdf.SetFont("DejaVu", "", 12)
		for _, a := range plan.Activities {
			pdf.SetFont("DejaVu", "B", 12)
			pdf.MultiCell(0, 6, fmt.Sprintf("- %s (%s)", a.Title, a.Time), "", "L", false)
			pdf.SetFont("DejaVu", "", 12)
			pdf.MultiCell(0, 6, a.Instructions, "", "L", false)
			pdf.Ln(2)
		}
	}

	// ✅ Assessment
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

	// ✅ References
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

// ========================
// PPTX Generation (FIXED FOR UNIOFFICE-FREE)
// ========================
func (s *Service) buildPPTX(plan *Plan, filename string) error {
	// Using measurement constants correctly - they are constants, not functions
	// Margin 0.5 inch = 0.5 * 72 points
	const margin = 0.5 * measurement.Inch
	// Content width 9.0 inch = 9.0 * 72 points
	const contentWidth = 9.0 * measurement.Inch

	ppt := presentation.New()
	defer ppt.Close()

	// --- Slide Judul ---
	titleSlide := ppt.AddSlide()

	// Box Judul Utama (Centered)
	titleTextBox := titleSlide.AddTextBox()
	// Position: X=0.5", Y=1.5"
	titleTextBox.Properties().SetPosition(margin, 1.5*measurement.Inch)
	// Size: W=9.0", H=2.0"
	titleTextBox.Properties().SetSize(contentWidth, 2.0*measurement.Inch)

	titleParagraph := titleTextBox.AddParagraph()
	titleRun := titleParagraph.AddRun()
	titleRun.SetText(plan.Title)
	titleRun.Properties().SetSize(40)
	titleRun.Properties().SetBold(true)

	// Box Overview (Centered)
	overviewTextBox := titleSlide.AddTextBox()
	// Position: X=0.5", Y=3.5"
	overviewTextBox.Properties().SetPosition(margin, 3.5*measurement.Inch)
	// Size: W=9.0", H=3.5"
	overviewTextBox.Properties().SetSize(contentWidth, 3.5*measurement.Inch)

	// Info Durasi & Audiens
	infoParagraph := overviewTextBox.AddParagraph()
	infoRun := infoParagraph.AddRun()
	infoRun.SetText(fmt.Sprintf("Durasi: %s\nAudiens: %s",
		plan.Overview.Duration,
		plan.Overview.Audience))
	infoRun.Properties().SetSize(18)

	// Info Tujuan Pembelajaran
	if len(plan.Overview.Goals) > 0 {
		overviewTextBox.AddParagraph() // Spasi

		goalsTitleParagraph := overviewTextBox.AddParagraph()
		goalsTitleRun := goalsTitleParagraph.AddRun()
		goalsTitleRun.SetText("Tujuan Pembelajaran:")
		goalsTitleRun.Properties().SetSize(18)
		goalsTitleRun.Properties().SetBold(true)

		for _, goal := range plan.Overview.Goals {
			goalParagraph := overviewTextBox.AddParagraph()
			goalRun := goalParagraph.AddRun()
			goalRun.SetText("• " + goal)
			goalRun.Properties().SetSize(16)
		}
	}

	// --- Slide Konten ---
	for _, slide := range plan.Slides {
		contentSlide := ppt.AddSlide()

		// Box Judul Slide
		titleBox := contentSlide.AddTextBox()
		// Position: X=0.5", Y=0.25"
		titleBox.Properties().SetPosition(margin, 0.25*measurement.Inch)
		// Size: W=9.0", H=1.0"
		titleBox.Properties().SetSize(contentWidth, 1.0*measurement.Inch)

		titleP := titleBox.AddParagraph()
		titleR := titleP.AddRun()
		titleR.SetText(slide.Heading)
		titleR.Properties().SetSize(32)
		titleR.Properties().SetBold(true)

		// Box Konten (Bullets) dengan spacing yang lebih baik
		contentBox := contentSlide.AddTextBox()
		// Position: X=0.5", Y=1.25"
		contentBox.Properties().SetPosition(margin, 1.25*measurement.Inch)
		// Size: W=9.0", H=5.0"
		contentBox.Properties().SetSize(contentWidth, 5.0*measurement.Inch)

		for i, bullet := range slide.Bullets {
			bulletP := contentBox.AddParagraph()
			bulletR := bulletP.AddRun()
			
			// Remove all emojis and use simple bullet points
			bulletR.SetText("• " + bullet)
			bulletR.Properties().SetSize(18) // Slightly smaller to fit more content

			if i < len(slide.Bullets)-1 {
				spacingP := contentBox.AddParagraph()
				spacingR := spacingP.AddRun()
				spacingR.SetText(" ")
				spacingR.Properties().SetSize(3) // Reduced spacing for more content
			}
		}

		// Box Catatan Fasilitator
		if strings.TrimSpace(slide.SpeakerNotes) != "" {
			notesBox := contentSlide.AddTextBox()
			// Position: X=0.5", Y=6.5"
			notesBox.Properties().SetPosition(margin, 6.5*measurement.Inch)
			// Size: W=9.0", H=1.0"
			notesBox.Properties().SetSize(contentWidth, 1.0*measurement.Inch)

			notesP := notesBox.AddParagraph()
			notesR := notesP.AddRun()
			notesR.SetText("Catatan Fasilitator: " + slide.SpeakerNotes)
			notesR.Properties().SetSize(12)
		}
	}

	// --- Slide Aktivitas ---
	if len(plan.Activities) > 0 {
		activitiesSlide := ppt.AddSlide()

		// Judul
		titleBox := activitiesSlide.AddTextBox()
		titleBox.Properties().SetPosition(margin, 0.25*measurement.Inch)
		titleBox.Properties().SetSize(contentWidth, 1.0*measurement.Inch)

		titleP := titleBox.AddParagraph()
		titleR := titleP.AddRun()
		titleR.SetText("Aktivitas & Latihan")
		titleR.Properties().SetSize(32)
		titleR.Properties().SetBold(true)

		// Konten
		contentBox := activitiesSlide.AddTextBox()
		contentBox.Properties().SetPosition(margin, 1.25*measurement.Inch)
		contentBox.Properties().SetSize(contentWidth, 5.5*measurement.Inch)

		for i, activity := range plan.Activities {
			activityTitleP := contentBox.AddParagraph()
			activityTitleR := activityTitleP.AddRun()
			activityTitleR.SetText(fmt.Sprintf("%d. %s (%s)", i+1, activity.Title, activity.Time))
			activityTitleR.Properties().SetSize(20)
			activityTitleR.Properties().SetBold(true)

			instructionsP := contentBox.AddParagraph()
			instructionsR := instructionsP.AddRun()
			instructionsR.SetText("   " + activity.Instructions)
			instructionsR.Properties().SetSize(16)

			if i < len(plan.Activities)-1 {
				spacingP := contentBox.AddParagraph()
				spacingR := spacingP.AddRun()
				spacingR.SetText(" ")
				spacingR.Properties().SetSize(6)
			}
		}
	}

	// --- Slide Assessment ---
	if len(plan.Assessment) > 0 {
		assessmentSlide := ppt.AddSlide()

		// Judul
		titleBox := assessmentSlide.AddTextBox()
		titleBox.Properties().SetPosition(margin, 0.25*measurement.Inch)
		titleBox.Properties().SetSize(contentWidth, 1.0*measurement.Inch)

		titleP := titleBox.AddParagraph()
		titleR := titleP.AddRun()
		titleR.SetText("Assessment & Evaluasi")
		titleR.Properties().SetSize(32)
		titleR.Properties().SetBold(true)

		// Konten
		contentBox := assessmentSlide.AddTextBox()
		contentBox.Properties().SetPosition(margin, 1.25*measurement.Inch)
		contentBox.Properties().SetSize(contentWidth, 5.5*measurement.Inch)

		for i, qa := range plan.Assessment {
			questionP := contentBox.AddParagraph()
			questionR := questionP.AddRun()
			questionR.SetText(fmt.Sprintf("Q%d: %s", i+1, qa.Question))
			questionR.Properties().SetSize(16)
			questionR.Properties().SetBold(true)

			answerP := contentBox.AddParagraph()
			answerR := answerP.AddRun()
			answerR.SetText(fmt.Sprintf("A: %s", qa.Answer))
			answerR.Properties().SetSize(14)

			if i < len(plan.Assessment)-1 {
				spacingP := contentBox.AddParagraph()
				spacingR := spacingP.AddRun()
				spacingR.SetText(" ")
				spacingR.Properties().SetSize(6)
			}
		}
	}

	if err := ppt.Validate(); err != nil {
		return fmt.Errorf("PPTX validation failed: %w", err)
	}

	// Save the initial PPTX
	if err := ppt.SaveToFile(filename); err != nil {
		return fmt.Errorf("failed to save PPTX: %w", err)
	}

	// Now enhance the PPTX with background image and colors
	return s.enhancePPTXWithBackgroundAndColors(filename)
}

// enhancePPTXWithBackgroundAndColors adds background image and text colors via XML manipulation
func (s *Service) enhancePPTXWithBackgroundAndColors(filename string) error {
	// Read the PPTX file as a ZIP
	reader, err := zip.OpenReader(filename)
	if err != nil {
		return fmt.Errorf("failed to open PPTX as ZIP: %w", err)
	}

	// Create a temporary file for the enhanced PPTX
	tempFile := filename + ".tmp"
	writer, err := os.Create(tempFile)
	if err != nil {
		reader.Close() // Close reader if temp file creation fails
		return fmt.Errorf("failed to create temp file: %w", err)
	}

	zipWriter := zip.NewWriter(writer)

	// Copy background image to PPTX media folder
	backgroundImagePath := "d:\\Intern\\2-dev.bryan\\backend\\public\\ppt-background.png"

	// Add background image to media folder
	mediaWriter, err := zipWriter.Create("ppt/media/image1.png")
	if err != nil {
		zipWriter.Close()
		writer.Close()
		reader.Close()
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to create media entry: %w", err)
	}

	backgroundFile, err := os.Open(backgroundImagePath)
	if err != nil {
		zipWriter.Close()
		writer.Close()
		reader.Close()
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to open background image: %w", err)
	}

	if _, err := io.Copy(mediaWriter, backgroundFile); err != nil {
		backgroundFile.Close()
		zipWriter.Close()
		writer.Close()
		reader.Close()
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to copy background image: %w", err)
	}
	backgroundFile.Close()

	// Process each file in the PPTX
	for _, file := range reader.File {
		if err := s.processZipFile(file, zipWriter); err != nil {
			zipWriter.Close()
			writer.Close()
			reader.Close()
			os.Remove(tempFile) // Clean up temp file
			return fmt.Errorf("failed to process file %s: %w", file.Name, err)
		}
	}

	// Close all resources in proper order
	if err := zipWriter.Close(); err != nil {
		writer.Close()
		reader.Close()
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to close zip writer: %w", err)
	}

	if err := writer.Close(); err != nil {
		reader.Close()
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to close temp file: %w", err)
	}

	// CRITICAL: Close the zip reader BEFORE attempting to remove the original file
	if err := reader.Close(); err != nil {
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to close zip reader: %w", err)
	}

	// Replace original file with enhanced version
	if err := os.Remove(filename); err != nil {
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to remove original file: %w", err)
	}

	if err := os.Rename(tempFile, filename); err != nil {
		return fmt.Errorf("failed to rename temp file: %w", err)
	}

	return nil
}

// processZipFile processes individual files within the PPTX ZIP
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

	// Special processing for slide XML files
	if strings.HasPrefix(file.Name, "ppt/slides/slide") && strings.HasSuffix(file.Name, ".xml") {
		return s.enhanceSlideXML(reader, writer)
	}

	// Special processing for content types
	if file.Name == "[Content_Types].xml" {
		return s.enhanceContentTypes(reader, writer)
	}

	// Special processing for slide relationships
	if strings.HasPrefix(file.Name, "ppt/slides/_rels/slide") && strings.HasSuffix(file.Name, ".xml.rels") {
		return s.enhanceSlideRels(reader, writer)
	}

	// Copy other files as-is
	_, err = io.Copy(writer, reader)
	return err
}

// enhanceSlideXML adds background image and text colors to slide XML
func (s *Service) enhanceSlideXML(reader io.Reader, writer io.Writer) error {
	content, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	xmlStr := string(content)

	// Add background image to slide with proper XML structure
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

	// Insert background after <p:cSld> opening tag
	xmlStr = strings.Replace(xmlStr, "<p:cSld>", "<p:cSld>"+backgroundXML, 1)

	// Enhanced text coloring system based on content analysis
	// Green color for titles and headings (RGB: 46, 125, 50)
	greenColorXML := `<a:solidFill><a:srgbClr val="2E7D32"/></a:solidFill>`
	// Red color for important/strong points (RGB: 198, 40, 40)  
	redColorXML := `<a:solidFill><a:srgbClr val="C62828"/></a:solidFill>`
	// Black color for regular explanations (RGB: 33, 33, 33)
	blackColorXML := `<a:solidFill><a:srgbClr val="212121"/></a:solidFill>`

	// Apply intelligent text coloring based on content patterns
	xmlStr = s.applyIntelligentTextColors(xmlStr, greenColorXML, redColorXML, blackColorXML)

	_, err = writer.Write([]byte(xmlStr))
	return err
}

// applyIntelligentTextColors applies colors based on content analysis
func (s *Service) applyIntelligentTextColors(xmlStr, greenColorXML, redColorXML, blackColorXML string) string {
	// Pattern for finding text runs with proper XML structure
	textRunPattern := `(<a:t>)([^<]+)(</a:t>)`
	re := regexp.MustCompile(textRunPattern)
	
	return re.ReplaceAllStringFunc(xmlStr, func(match string) string {
		// Extract the text content
		matches := re.FindStringSubmatch(match)
		if len(matches) != 4 {
			return match // Return original if pattern doesn't match properly
		}
		
		openTag := matches[1]
		textContent := strings.TrimSpace(matches[2])
		closeTag := matches[3]
		
		// Determine color based on content analysis
		var colorXML string
		
		// Green for titles and headings
		if s.isTitle(textContent) {
			colorXML = greenColorXML
		} else if s.isStrongPoint(textContent) {
			// Red for strong/important points
			colorXML = redColorXML
		} else {
			// Black for regular explanations
			colorXML = blackColorXML
		}
		
		// Apply color with proper XML structure
		return `<a:rPr>` + colorXML + `</a:rPr>` + openTag + textContent + closeTag
	})
}

// isTitle determines if text content should be colored as a title (green)
func (s *Service) isTitle(text string) bool {
	// Check for title indicators
	titleIndicators := []string{
		"OBJECTIVE", "KONSEP", "LANGKAH", "STUDI KASUS", "PENUTUP",
		"Tujuan", "Definisi", "Prinsip", "Framework", "Prosedur",
		"Aktivitas", "Assessment", "Evaluasi", "Ringkasan",
	}
	
	upperText := strings.ToUpper(text)
	for _, indicator := range titleIndicators {
		if strings.Contains(upperText, strings.ToUpper(indicator)) {
			return true
		}
	}
	
	// Check if it's likely a heading (short, ends with colon, all caps, etc.)
	if len(text) < 50 && (strings.HasSuffix(text, ":") || strings.ToUpper(text) == text) {
		return true
	}
	
	return false
}

// isStrongPoint determines if text content should be colored as important (red)
func (s *Service) isStrongPoint(text string) bool {
	// Check for strong point indicators
	strongIndicators := []string{
		"penting", "kritis", "utama", "key", "fundamental", "essential",
		"harus", "wajib", "perlu", "sangat", "critical", "vital",
		"best practice", "tips", "warning", "perhatian", "ingat",
		"jangan", "hindari", "pastikan", "ensure", "remember",
	}
	
	lowerText := strings.ToLower(text)
	for _, indicator := range strongIndicators {
		if strings.Contains(lowerText, strings.ToLower(indicator)) {
			return true
		}
	}
	
	// Check for emphasis patterns (text in quotes, parentheses, or with exclamation)
	if strings.Contains(text, "!") || strings.Contains(text, "\"") || 
	   (strings.Contains(text, "(") && strings.Contains(text, ")")) {
		return true
	}
	
	return false
}

// enhanceContentTypes adds PNG image type to content types
func (s *Service) enhanceContentTypes(reader io.Reader, writer io.Writer) error {
	content, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	xmlStr := string(content)

	// Add PNG extension if not present
	if !strings.Contains(xmlStr, `Extension="png"`) {
		pngType := `<Default Extension="png" ContentType="image/png"/>`
		xmlStr = strings.Replace(xmlStr, "</Types>", pngType+"</Types>", 1)
	}

	_, err = writer.Write([]byte(xmlStr))
	return err
}

// enhanceSlideRels adds relationship for background image
func (s *Service) enhanceSlideRels(reader io.Reader, writer io.Writer) error {
	content, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	xmlStr := string(content)

	// Add relationship for background image
	imageRel := `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>`
	xmlStr = strings.Replace(xmlStr, "</Relationships>", imageRel+"</Relationships>", 1)

	_, err = writer.Write([]byte(xmlStr))
	return err
}

// ========================
// Orchestration (No changes)
// ========================
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
