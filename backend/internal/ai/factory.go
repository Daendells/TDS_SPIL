package ai

import (
	"github.com/sirupsen/logrus"
)

// ProviderConfig menyimpan konfigurasi untuk AI provider.
type ProviderConfig struct {
	// Provider adalah nama provider: "poolside"
	Provider string
	// APIKey adalah API key untuk OpenRouter
	APIKey string
	// BaseURL adalah base URL OpenRouter (opsional, default: https://openrouter.ai/api/v1)
	BaseURL string
}

// Model IDs yang didukung
const (
	ModelPoolside    = "poolside/laguna-s-2.1:free"
	ProviderPoolside = "poolside"
)

// NewProvider membuat AIProvider berdasarkan konfigurasi.
func NewProvider(log *logrus.Logger, cfg ProviderConfig) (AIProvider, error) {
	if cfg.APIKey == "" {
		log.Warn("OPENROUTER_API_KEY kosong — panggilan AI akan gagal")
	}

	poolsideProvider := NewOpenRouterProvider(log, cfg.APIKey, ModelPoolside, ProviderPoolside, cfg.BaseURL)

	switch cfg.Provider {
	case ProviderPoolside, "laguna", "openrouter", "":
		// Default: Poolside (poolside/laguna-s-2.1:free)
		log.Infof("AI Provider: Poolside (%s)", ModelPoolside)
		return poolsideProvider, nil

	default:
		log.Infof("AI Provider: Poolside (%s) [requested: %s]", ModelPoolside, cfg.Provider)
		return poolsideProvider, nil
	}
}
