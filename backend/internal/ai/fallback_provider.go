package ai

import (
	"context"
	"fmt"

	"github.com/sirupsen/logrus"
)

// FallbackProvider adalah wrapper AIProvider yang mencoba primary provider terlebih dahulu.
// Jika primary provider gagal (error / empty response / rate limit), secara otomatis jatuh ke secondary provider.
type FallbackProvider struct {
	log       *logrus.Logger
	primary   AIProvider
	secondary AIProvider
}

// NewFallbackProvider membuat instance baru FallbackProvider.
func NewFallbackProvider(log *logrus.Logger, primary, secondary AIProvider) *FallbackProvider {
	return &FallbackProvider{
		log:       log,
		primary:   primary,
		secondary: secondary,
	}
}

// Generate mencoba primary provider dulu, lalu fallback ke secondary jika gagal.
func (p *FallbackProvider) Generate(ctx context.Context, req AIRequest) (*AIResponse, error) {
	resp, err := p.primary.Generate(ctx, req)
	if err == nil && resp != nil && resp.Content != "" {
		return resp, nil
	}

	p.log.Warnf(
		"Primary AI provider %s (%s) failed: %v. Falling back to %s (%s)...",
		p.primary.ProviderName(), p.primary.ModelName(), err,
		p.secondary.ProviderName(), p.secondary.ModelName(),
	)

	fallbackResp, fallbackErr := p.secondary.Generate(ctx, req)
	if fallbackErr != nil {
		return nil, fmt.Errorf("both primary (%s) and fallback (%s) AI providers failed. Primary err: %v | Fallback err: %w",
			p.primary.ModelName(), p.secondary.ModelName(), err, fallbackErr)
	}

	// Tandai model yang digunakan dalam response
	fallbackResp.Model = fmt.Sprintf("%s (fallback from %s)", p.secondary.ModelName(), p.primary.ModelName())
	return fallbackResp, nil
}

// ModelName mengembalikan info model primary & fallback.
func (p *FallbackProvider) ModelName() string {
	return fmt.Sprintf("%s [Fallback: %s]", p.primary.ModelName(), p.secondary.ModelName())
}

// ProviderName mengembalikan nama provider.
func (p *FallbackProvider) ProviderName() string {
	return fmt.Sprintf("%s", p.primary.ProviderName())
}
