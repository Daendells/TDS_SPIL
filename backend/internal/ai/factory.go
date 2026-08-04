package ai

import (
	"fmt"

	"github.com/sirupsen/logrus"
)

// ProviderConfig menyimpan konfigurasi untuk AI provider.
type ProviderConfig struct {
	// Provider adalah nama provider: "ling" atau "nemotron"
	Provider string
	// APIKey adalah API key untuk OpenRouter
	APIKey string
	// BaseURL adalah base URL OpenRouter (opsional, default: https://openrouter.ai/api/v1)
	BaseURL string
}

// Model IDs yang didukung
const (
	ModelLing     = "inclusionai/ling-3.0-flash:free"
	ModelNemotron = "nvidia/nemotron-3-ultra-550b-a55b:free"

	ProviderLing     = "ling"
	ProviderNemotron = "nemotron"
)

// NewProvider membuat AIProvider berdasarkan konfigurasi.
// Jika Nemotron dipilih sebagai primary dan gagal/empty, secara otomatis fallback ke Ling.
func NewProvider(log *logrus.Logger, cfg ProviderConfig) (AIProvider, error) {
	if cfg.APIKey == "" {
		log.Warn("OPENROUTER_API_KEY kosong — panggilan AI akan gagal")
	}

	lingProvider := NewOpenRouterProvider(log, cfg.APIKey, ModelLing, ProviderLing, cfg.BaseURL)
	nemotronProvider := NewOpenRouterProvider(log, cfg.APIKey, ModelNemotron, ProviderNemotron, cfg.BaseURL)

	switch cfg.Provider {
	case ProviderNemotron:
		log.Infof("AI Provider: Nemotron (%s) dengan Fallback ke Ling (%s)", ModelNemotron, ModelLing)
		return NewFallbackProvider(log, nemotronProvider, lingProvider), nil

	case ProviderLing, "":
		// Default: Ling-3.0 Flash
		log.Infof("AI Provider: Ling (%s)", ModelLing)
		return lingProvider, nil

	default:
		return nil, fmt.Errorf("unknown AI provider: %q (supported: ling, nemotron)", cfg.Provider)
	}
}
