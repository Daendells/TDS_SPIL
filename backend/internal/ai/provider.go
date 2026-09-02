package ai

import "context"

// AIRequest adalah struktur input umum untuk semua provider AI.
type AIRequest struct {
	SystemPrompt string
	UserPrompt   string
	MaxTokens    int
	Temperature  float64
}

// AIResponse adalah struktur output umum dari semua provider AI.
type AIResponse struct {
	Content      string
	InputTokens  int
	OutputTokens int
	TotalTokens  int
	LatencyMs    int64
	Model        string
}

// AIProvider adalah interface abstraksi untuk semua provider AI.
// Business logic HANYA memanggil interface ini, tidak bergantung pada provider konkret.
type AIProvider interface {
	// Generate mengirim request ke AI provider dan mengembalikan response.
	Generate(ctx context.Context, req AIRequest) (*AIResponse, error)
	// ModelName mengembalikan nama model yang sedang digunakan.
	ModelName() string
	// ProviderName mengembalikan nama provider (e.g., "liquid").
	ProviderName() string
}
