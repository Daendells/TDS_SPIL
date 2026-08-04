package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend/internal/models/web"
	"github.com/sirupsen/logrus"
)

type OpenRouterClient struct {
	apiKey   string
	model    string
	http     *http.Client
	baseURL  string
	log      *logrus.Logger
}

type OpenRouterRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Temperature float64   `json:"temperature,omitempty"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		TotalTokens int `json:"total_tokens"`
	} `json:"usage"`
}

func NewOpenRouterClient(log *logrus.Logger, apiKey, model, baseURL string) *OpenRouterClient {
	if apiKey == "" {
		log.Warn("OPENROUTER_API_KEY kosong - panggilan LLM akan gagal")
	}
	if model == "" {
		model = "inclusionai/ling-3.0-flash:free"
	}
	if baseURL == "" {
		baseURL = "https://openrouter.ai/api/v1"
	}
	return &OpenRouterClient{
		log:     log,
		apiKey:  apiKey,
		model:   model,
		baseURL: baseURL,
		http:    &http.Client{Timeout: 120 * time.Second},
	}
}

func (c *OpenRouterClient) AnalyzeCV(ctx context.Context, cvText, role string) (string, error) {
	systemPrompt := fmt.Sprintf(`Anda adalah seorang Senior HR Analyst & Expert Recruitment Specialist di Indonesia. Tugas Anda adalah menganalisis CV kandidat secara mendalam untuk posisi/role tertentu.

PENTING: Seluruh penjelasan, analisis, dan pertanyaan dalam JSON HARUS ditulis menggunakan BAHASA INDONESIA yang profesional, jelas, dan baku.

Berikan respons HANYA berupa objek JSON valid dengan struktur berikut:

{
  "score": <angka 0-100, skor kesesuaian keseluruhan kandidat>,
  "recommended_min_score": <angka 0-100, rekomendasi skor minimum kelulusan/standar untuk posisi %s ini, misal 70 atau 75>,
  "min_score_explanation": "<penjelasan dalam Bahasa Indonesia kenapa role ini memerlukan skor minimum tersebut dan pertimbangan kriteria utamanya>",
  "score_explanation": "<penjelasan dalam Bahasa Indonesia bahwa skor ini adalah analisis AI sebagai bahan pertimbangan HR, bukan keputusan mutlak>",
  "strengths": [
    "<kelebihan/kekuatan 1 kandidat>",
    "<kelebihan/kekuatan 2 kandidat>",
    "<kelebihan/kekuatan 3 kandidat>",
    "<kelebihan/kekuatan 4 kandidat>",
    "<kelebihan/kekuatan 5 kandidat>"
  ],
  "weaknesses": [
    "<area pengembangan/kekurangan 1 kandidat>",
    "<area pengembangan/kekurangan 2 kandidat>",
    "<area pengembangan/kekurangan 3 kandidat>",
    "<area pengembangan/kekurangan 4 kandidat>",
    "<area pengembangan/kekurangan 5 kandidat>"
  ],
  "profile_summary": "<ringkasan profil kandidat dalam Bahasa Indonesia>",
  "interview_questions": [
    {
      "category": "Teknis / Keahlian",
      "question": "<pertanyaan wawancara teknis 1 dalam Bahasa Indonesia>",
      "reason": "<alasan mendalam mengapa pertanyaan ini direkomendasikan berdasarkan isi CV>"
    },
    {
      "category": "Teknis / Keahlian",
      "question": "<pertanyaan wawancara teknis 2 dalam Bahasa Indonesia>",
      "reason": "<alasan mendalam mengapa pertanyaan ini direkomendasikan>"
    },
    {
      "category": "Pengalaman & Proyek",
      "question": "<pertanyaan seputar proyek/pengalaman 1>",
      "reason": "<alasan rekomendasi>"
    },
    {
      "category": "Pengalaman & Proyek",
      "question": "<pertanyaan seputar proyek/pengalaman 2>",
      "reason": "<alasan rekomendasi>"
    },
    {
      "category": "Problem Solving & Studi Kasus",
      "question": "<pertanyaan problem solving 1>",
      "reason": "<alasan rekomendasi>"
    },
    {
      "category": "Problem Solving & Studi Kasus",
      "question": "<pertanyaan problem solving 2>",
      "reason": "<alasan rekomendasi>"
    },
    {
      "category": "Soft Skill & Kepemimpinan",
      "question": "<pertanyaan soft skill/leadership 1>",
      "reason": "<alasan rekomendasi>"
    },
    {
      "category": "Soft Skill & Kepemimpinan",
      "question": "<pertanyaan soft skill/leadership 2>",
      "reason": "<alasan rekomendasi>"
    }
  ],
  "aspects": {
    "technical_skill": <angka 0-100>,
    "experience": <angka 0-100>,
    "education": <angka 0-100>,
    "communication": <angka 0-100>,
    "leadership": <angka 0-100>,
    "problem_solving": <angka 0-100>,
    "cultural_fit": <angka 0-100>
  }
}

Posisi/Target Role: %s

Konten CV:
%s

CATATAN: Hasilkan minimal 8 hingga 10 pertanyaan wawancara yang tajam dan relevan. Respon HARUS MURNI JSON tanpa blok kode markdown atau teks tambahan di luar JSON.`, role, role, cvText)

	reqBody := OpenRouterRequest{
		Model:       c.model,
		MaxTokens:   4096,
		Temperature: 0.3,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: "Please analyze the CV above for the role: " + role},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("HTTP-Referer", "https://tds-devto.local")
	httpReq.Header.Set("X-Title", "TDS CV Analysis")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to call OpenRouter API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenRouter API returned status %d", resp.StatusCode)
	}

	var openResp OpenRouterResponse
	if err := json.NewDecoder(resp.Body).Decode(&openResp); err != nil {
		return "", fmt.Errorf("failed to decode OpenRouter response: %w", err)
	}

	if len(openResp.Choices) == 0 || openResp.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("empty response from OpenRouter API")
	}

	return openResp.Choices[0].Message.Content, nil
}

func (c *OpenRouterClient) RankCandidates(ctx context.Context, req web.RankCandidatesRequest) (string, error) {
	candidatesJSON, _ := json.Marshal(req.Candidates)
	systemPrompt := fmt.Sprintf(`Anda adalah seorang HR Analyst Expert. Analisis dan urutkan kandidat-kandidat berdasarkan kecocokan (Job Fit Score) terhadap Job Description berikut.

PENTING:
1. Seluruh penjelasan, kelebihan, skill yang kurang, dan ringkasan HARUS ditulis menggunakan BAHASA INDONESIA yang profesional.
2. Hitung Job Fit Score (0-100) berdasarkan kombinasi: Technical Skills, Experience, Education, Projects, dan Certifications.
3. Urutkan daftar "rankings" dari skor tertinggi ke skor terendah.

Berikan respons HANYA berupa objek JSON valid dengan struktur berikut:

{
  "job_title": "%s",
  "total_candidates": %d,
  "rankings": [
    {
      "candidate_id": "<id kandidat>",
      "candidate_name": "<nama kandidat>",
      "job_fit_score": <angka 0-100>,
      "strengths": ["<kelebihan 1>", "<kelebihan 2>"],
      "missing_skills": ["<skill yang kurang 1>", "<skill yang kurang 2>"],
      "short_summary": "<ringkasan singkat kecocokan kandidat>",
      "score_breakdown": {
        "technical_skills": <0-100>,
        "experience": <0-100>,
        "education": <0-100>,
        "projects": <0-100>,
        "certifications": <0-100>
      }
    }
  ]
}

Target Role: %s

Job Description:
%s

Daftar Kandidat (CV):
%s

Hasilkan HANYA objek JSON tanpa teks ekstra atau blok kode markdown di luar JSON.`, req.Role, len(req.Candidates), req.Role, req.JobDescription, string(candidatesJSON))

	reqBody := OpenRouterRequest{
		Model:       c.model,
		MaxTokens:   4096,
		Temperature: 0.2,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: "Urutkan kandidat di atas berdasarkan Job Description."},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("HTTP-Referer", "https://tds-devto.local")
	httpReq.Header.Set("X-Title", "TDS Candidate Ranking")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to call OpenRouter API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenRouter API returned status %d", resp.StatusCode)
	}

	var openResp OpenRouterResponse
	if err := json.NewDecoder(resp.Body).Decode(&openResp); err != nil {
		return "", fmt.Errorf("failed to decode OpenRouter response: %w", err)
	}

	if len(openResp.Choices) == 0 || openResp.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("empty response from OpenRouter API")
	}

	return openResp.Choices[0].Message.Content, nil
}

func (c *OpenRouterClient) RecommendRoles(ctx context.Context, req web.RecommendRolesRequest) (string, error) {
	rolesJSON, _ := json.Marshal(req.Roles)
	systemPrompt := fmt.Sprintf(`Anda adalah seorang Senior Talent Specialist. Bandingkan CV kandidat ini dengan seluruh daftar role pekerjaan yang tersedia dan berikan rekomendasi role paling cocok.

PENTING:
1. Seluruh penjelasan, alasan, skill cocok, dan skill kurang HARUS ditulis menggunakan BAHASA INDONESIA yang profesional.
2. Hitung Job Fit Score (0-100) per role berdasarkan kombinasi: Technical Skills, Experience, Education, Projects, dan Certifications.
3. Urutkan daftar "recommended_roles" dari skor tertinggi ke skor terendah.

Berikan respons HANYA berupa objek JSON valid dengan struktur berikut:

{
  "candidate_name": "%s",
  "recommended_roles": [
    {
      "role": "<nama role>",
      "job_fit_score": <angka 0-100>,
      "brief_reason": "<alasan singkat mengapa role ini cocok/kurang cocok>",
      "matching_skills": ["<skill cocok 1>", "<skill cocok 2>"],
      "missing_skills": ["<skill kurang 1>", "<skill kurang 2>"],
      "score_breakdown": {
        "technical_skills": <0-100>,
        "experience": <0-100>,
        "education": <0-100>,
        "projects": <0-100>,
        "certifications": <0-100>
      }
    }
  ]
}

Nama Kandidat: %s
Daftar Role yang Diuji: %s

Konten CV Kandidat:
%s

Hasilkan HANYA objek JSON tanpa teks ekstra atau blok kode markdown di luar JSON.`, req.CandidateName, req.CandidateName, string(rolesJSON), req.CVText)

	reqBody := OpenRouterRequest{
		Model:       c.model,
		MaxTokens:   4096,
		Temperature: 0.2,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: "Analisis dan urutkan role paling cocok untuk kandidat ini."},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("HTTP-Referer", "https://tds-devto.local")
	httpReq.Header.Set("X-Title", "TDS Role Recommendation")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to call OpenRouter API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenRouter API returned status %d", resp.StatusCode)
	}

	var openResp OpenRouterResponse
	if err := json.NewDecoder(resp.Body).Decode(&openResp); err != nil {
		return "", fmt.Errorf("failed to decode OpenRouter response: %w", err)
	}

	if len(openResp.Choices) == 0 || openResp.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("empty response from OpenRouter API")
	}

	return openResp.Choices[0].Message.Content, nil
}

func (c *OpenRouterClient) AnalyzeUnifiedCVs(ctx context.Context, req web.UnifiedCVAnalysisRequest) (string, error) {
	candidatesJSON, _ := json.Marshal(req.Candidates)
	rolesJSON, _ := json.Marshal(req.TargetRoles)

	systemPrompt := fmt.Sprintf(`Anda adalah Senior HR Analyst di Indonesia. Tugas Anda adalah melakukan Analisis CV & AI Job Fit Unified.

PENTING:
1. Seluruh penjelasan, analisis, kelebihan, kekurangan, ringkasan, dan pertanyaan HARUS dalam BAHASA INDONESIA yang profesional.
2. Jika deskripsi role kosong/tidak diisi, gunakan pemahaman standar kecerdasan AI untuk kriteria role IT tersebut.
3. Hasilkan JSON murni dengan 2 Bagian Utama:
   - "person_best_roles": Untuk setiap kandidat CV, tentukan 1 Best Role paling cocok, job_fit_score (0-100), brief_reason, matching_skills, missing_skills.
   - "role_rankings": Untuk setiap target role, urutkan kandidat dari skor Job Fit tertinggi ke terendah. Untuk setiap kandidat per role, sertakan job_fit_score, score_explanation, min_score, min_score_explanation, strengths (3 poin), weaknesses (3 poin), profile_summary, interview_questions (4 pertanyaan terstruktur dengan category, question, reason), aspects (technical_skill, experience, education, communication, leadership, problem_solving, cultural_fit), dan score_breakdown (technical_skills, experience, education, projects, certifications).

Struktur JSON:
{
  "person_best_roles": [
    {
      "candidate_id": "c1",
      "candidate_name": "Budi",
      "best_role": "Frontend Developer",
      "job_fit_score": 85,
      "brief_reason": "alasan singkat",
      "matching_skills": ["React", "TypeScript"],
      "missing_skills": ["GraphQL"]
    }
  ],
  "role_rankings": [
    {
      "role": "Frontend Developer",
      "description": "deskripsi role atau standar AI",
      "candidates": [
        {
          "candidate_id": "c1",
          "candidate_name": "Budi",
          "job_fit_score": 85,
          "score_explanation": "penjelasan skor",
          "min_score": 70,
          "min_score_explanation": "penjelasan skor minimum",
          "strengths": ["kelebihan 1", "kelebihan 2"],
          "weaknesses": ["kekurangan 1", "kekurangan 2"],
          "profile_summary": "ringkasan profil",
          "interview_questions": [
            {
              "category": "Teknis / Keahlian",
              "question": "pertanyaan teknis",
              "reason": "alasan"
            }
          ],
          "aspects": {
            "technical_skill": 80,
            "experience": 80,
            "education": 80,
            "communication": 80,
            "leadership": 80,
            "problem_solving": 80,
            "cultural_fit": 80
          },
          "score_breakdown": {
            "technical_skills": 80,
            "experience": 80,
            "education": 80,
            "projects": 80,
            "certifications": 80
          }
        }
      ]
    }
  ]
}

Target Roles:
%s

Daftar Kandidat CV:
%s

Hasilkan HANYA JSON murni tanpa markdown codeblock.`, string(rolesJSON), string(candidatesJSON))

	reqBody := OpenRouterRequest{
		Model:       c.model,
		MaxTokens:   4096,
		Temperature: 0.2,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: "Analisis dan hasilkan JSON Unified CV Analysis & AI Job Fit."},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("HTTP-Referer", "https://tds-devto.local")
	httpReq.Header.Set("X-Title", "TDS Unified CV Analysis")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to call OpenRouter API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenRouter API returned status %d", resp.StatusCode)
	}

	var openResp OpenRouterResponse
	if err := json.NewDecoder(resp.Body).Decode(&openResp); err != nil {
		return "", fmt.Errorf("failed to decode OpenRouter response: %w", err)
	}

	if len(openResp.Choices) == 0 || openResp.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("empty response from OpenRouter API")
	}

	return openResp.Choices[0].Message.Content, nil
}
