package utils

import (
	"bytes"
	"io"
	"regexp"
	"strings"
)

// ExtractTextFromPDF meng-ekstrak teks asli dari file PDF binary stream.
// Bekerja langsung pada PDF stream tanpa ketergantungan library eksternal.
func ExtractTextFromPDF(r io.Reader) (string, error) {
	buf := new(bytes.Buffer)
	_, err := buf.ReadFrom(r)
	if err != nil {
		return "", err
	}

	content := buf.String()
	var textPieces []string

	// Pattern 1: Teks di dalam tanda kurung diikuti Tj atau TJ: (Teks) Tj
	reTj := regexp.MustCompile(`\(([^()]*)\)\s*T[jJ]`)
	matchesTj := reTj.FindAllStringSubmatch(content, -1)
	for _, m := range matchesTj {
		if len(m) > 1 {
			cleaned := cleanPDFString(m[1])
			if cleaned != "" {
				textPieces = append(textPieces, cleaned)
			}
		}
	}

	// Pattern 2: Array teks di dalam kurung siku: [(Teks1) -10 (Teks2)] TJ
	reTJArray := regexp.MustCompile(`\[\s*((?:\([^()]*\)\s*|-?\d+\s*)+)\]\s*TJ`)
	matchesTJArray := reTJArray.FindAllStringSubmatch(content, -1)
	reSub := regexp.MustCompile(`\(([^()]*)\)`)
	for _, m := range matchesTJArray {
		if len(m) > 1 {
			subs := reSub.FindAllStringSubmatch(m[1], -1)
			for _, sub := range subs {
				if len(sub) > 1 {
					cleaned := cleanPDFString(sub[1])
					if cleaned != "" {
						textPieces = append(textPieces, cleaned)
					}
				}
			}
		}
	}

	result := strings.Join(textPieces, " ")
	result = regexp.MustCompile(`\s+`).ReplaceAllString(result, " ")
	return strings.TrimSpace(result), nil
}

// cleanPDFString membersihkan karakter escape pada string PDF
func cleanPDFString(s string) string {
	s = strings.ReplaceAll(s, "\\(", "(")
	s = strings.ReplaceAll(s, "\\)", ")")
	s = strings.ReplaceAll(s, "\\n", " ")
	s = strings.ReplaceAll(s, "\\r", " ")
	s = strings.ReplaceAll(s, "\\t", " ")
	return strings.TrimSpace(s)
}
