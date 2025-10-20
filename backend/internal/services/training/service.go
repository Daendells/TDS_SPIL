package training

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

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

func NewTrainingService(log *logrus.Logger) *Service {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		log.Warn("GROQ_API_KEY kosong — panggilan LLM akan gagal")
	}
	model := os.Getenv("GROQ_MODEL")
	if model == "" {
		model = "llama-3.1-8b-instant"
	}
	base := os.Getenv("BACKEND_PUBLIC_URL")
	if base == "" {
		base = "http://localhost:8080"
	}

	outDir := "./public/materi"
	_ = os.MkdirAll(outDir, 0o755)

	return &Service{
		log:     log,
		http:    &http.Client{Timeout: 90 * time.Second},
		apiKey:  apiKey,
		model:   model,
		pubBase: strings.TrimRight(base, "/"),
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
// Prompt Builder
// ========================
func (s *Service) buildPrompt(in GenerateInput) string {
	return fmt.Sprintf(`You are a professional instructional designer. Create a high-quality, instructor-led training plan in JSON for Indonesian learners.

CONTEXT:
- KODE: %s
- TOPIK: %s
- KOMPETENSI: %s
- LEVEL: %d
- TOOLS/MODEL: %s
- REFERENSI TAMBAHAN (opsional): %s

REQUIREMENTS:
1) Bahasa Indonesia profesional, ringkas namun padat makna.
2) Durasi total ±60–90 menit (cantumkan di overview.duration).
3) Format JSON wajib sesuai dan hanya berisi JSON, tanpa teks lain:
{
 "title": string,
 "overview": { "goals": string[], "outcomes": string[], "duration": string, "audience": string },
 "slides": [
   {"heading": string, "bullets": string[3..5], "speaker_notes": string}
 ],
 "activities": [
   {"title": string, "instructions": string, "time": string}
 ],
 "assessment": [
   {"question": string, "answer": string}
 ],
 "references": string[]
}
4) Gunakan 8–12 slide dengan bullet singkat (≤14 kata).
5) "speaker_notes" berisi poin fasilitator (1–3 kalimat informatif).
6) Jika REFERENSI diberikan, gunakan ide, teori, atau istilah dari referensi tersebut di beberapa slide dan kegiatan.
7) Jangan ulangi isi antar slide. Setiap slide harus membangun topik secara progresif dan praktikal.
8) Tambahkan contoh konkret di slide yang relevan.

OUTPUT: JSON valid tanpa markdown fences. 
Isi harus konkret, bervariasi, dan relevan untuk pelatihan nyata.`, in.Kode, in.TopikTraining, in.Kompetensi, in.Level, valueOrDash(in.Tools), valueOrDash(in.Referensi))
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

    // ✅ Cover
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

    // ✅ Slides
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
// Orchestration
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