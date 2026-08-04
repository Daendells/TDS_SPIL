package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
)

// openRouterRequest adalah struktur request ke OpenRouter API.
type openRouterRequest struct {
	Model       string    `json:"model"`
	Messages    []message `json:"messages"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Temperature float64   `json:"temperature,omitempty"`
}

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// openRouterResponse adalah struktur response dari OpenRouter API.
type openRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// OpenRouterProvider adalah implementasi AIProvider yang menggunakan OpenRouter.
type OpenRouterProvider struct {
	log          *logrus.Logger
	apiKey       string
	model        string
	providerName string
	baseURL      string
	httpClient   *http.Client
}

// NewOpenRouterProvider membuat instance baru OpenRouterProvider.
func NewOpenRouterProvider(log *logrus.Logger, apiKey, model, providerName, baseURL string) *OpenRouterProvider {
	if baseURL == "" {
		baseURL = "https://openrouter.ai/api/v1"
	}
	return &OpenRouterProvider{
		log:          log,
		apiKey:       apiKey,
		model:        model,
		providerName: providerName,
		baseURL:      baseURL,
		httpClient:   &http.Client{Timeout: 180 * time.Second},
	}
}

// Generate mengirim request ke OpenRouter API dan mengembalikan AIResponse.
func (p *OpenRouterProvider) Generate(ctx context.Context, req AIRequest) (*AIResponse, error) {
	if req.MaxTokens == 0 {
		req.MaxTokens = 4096
	}
	if req.Temperature == 0 {
		req.Temperature = 0.3
	}

	body := openRouterRequest{
		Model:       p.model,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
		Messages: []message{
			{Role: "system", Content: req.SystemPrompt},
			{Role: "user", Content: req.UserPrompt},
		},
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)
	httpReq.Header.Set("HTTP-Referer", "https://tds-devto.local")
	httpReq.Header.Set("X-Title", "TDS AI HR System")

	start := time.Now()
	resp, err := p.httpClient.Do(httpReq)
	latencyMs := time.Since(start).Milliseconds()

	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenRouter returned status %d", resp.StatusCode)
	}

	var openResp openRouterResponse
	if err := json.NewDecoder(resp.Body).Decode(&openResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(openResp.Choices) == 0 || openResp.Choices[0].Message.Content == "" {
		return nil, fmt.Errorf("empty response from AI provider")
	}

	return &AIResponse{
		Content:      openResp.Choices[0].Message.Content,
		InputTokens:  openResp.Usage.PromptTokens,
		OutputTokens: openResp.Usage.CompletionTokens,
		TotalTokens:  openResp.Usage.TotalTokens,
		LatencyMs:    latencyMs,
		Model:        p.model,
	}, nil
}

// ModelName mengembalikan nama model yang digunakan.
func (p *OpenRouterProvider) ModelName() string {
	return p.model
}

// ProviderName mengembalikan nama provider.
func (p *OpenRouterProvider) ProviderName() string {
	return p.providerName
}
