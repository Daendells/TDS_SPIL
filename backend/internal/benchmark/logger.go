// Package benchmark menyediakan benchmark logger untuk mencatat performa setiap AI request.
// Data ini digunakan developer untuk membandingkan model (Ling vs Nemotron vs GPT, dll).
// Benchmark TIDAK ditampilkan kepada end user.
package benchmark

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// LogEntry adalah satu record benchmark untuk satu AI request.
type LogEntry struct {
	RequestID    string `json:"request_id"`
	Timestamp    string `json:"timestamp"`
	Feature      string `json:"feature"`
	PromptName   string `json:"prompt_name"`
	Provider     string `json:"provider"`
	Model        string `json:"model"`
	InputTokens  int    `json:"input_tokens"`
	OutputTokens int    `json:"output_tokens"`
	TotalTokens  int    `json:"total_tokens"`
	LatencyMs    int64  `json:"latency_ms"`
	Success      bool   `json:"success"`
	ErrorMessage string `json:"error_message,omitempty"`
}

// Logger adalah benchmark logger yang menyimpan log ke file JSONL.
type Logger struct {
	mu       sync.Mutex
	filePath string
	log      *logrus.Logger
}

// NewLogger membuat instance baru benchmark Logger.
// filePath contoh: "logs/ai_benchmark.jsonl"
func NewLogger(log *logrus.Logger, filePath string) *Logger {
	// Pastikan direktori logs ada
	if err := os.MkdirAll("logs", 0755); err != nil {
		log.Warnf("benchmark: failed to create logs directory: %v", err)
	}
	return &Logger{
		filePath: filePath,
		log:      log,
	}
}

// generateRequestID membuat ID unik untuk setiap request menggunakan crypto/rand.
func generateRequestID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// Record mencatat satu AI request ke file JSONL.
// Jika filePath kosong, log hanya ditulis ke logrus (mode development).
func (l *Logger) Record(entry LogEntry) {
	if entry.RequestID == "" {
		entry.RequestID = generateRequestID()
	}
	if entry.Timestamp == "" {
		entry.Timestamp = time.Now().UTC().Format(time.RFC3339)
	}

	// Log ke logrus untuk monitoring realtime
	fields := logrus.Fields{
		"request_id":   entry.RequestID,
		"feature":      entry.Feature,
		"provider":     entry.Provider,
		"model":        entry.Model,
		"latency_ms":   entry.LatencyMs,
		"total_tokens": entry.TotalTokens,
		"success":      entry.Success,
	}
	if entry.Success {
		l.log.WithFields(fields).Info("AI benchmark recorded")
	} else {
		l.log.WithFields(fields).Warn("AI benchmark recorded (failed request)")
	}

	// Tulis ke file JSONL
	if l.filePath == "" {
		return
	}

	line, err := json.Marshal(entry)
	if err != nil {
		l.log.Warnf("benchmark: failed to marshal entry: %v", err)
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	f, err := os.OpenFile(l.filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		l.log.Warnf("benchmark: failed to open log file: %v", err)
		return
	}
	defer f.Close()

	if _, err := fmt.Fprintf(f, "%s\n", line); err != nil {
		l.log.Warnf("benchmark: failed to write log entry: %v", err)
	}
}
