package utils

import (
	"regexp"
	"strings"
)

// CleanJSONResponse membersihkan, merapikan, dan memulihkan string JSON dari respons AI.
// Menggunakan LIFO Stack untuk menutup '{' dan '[' dalam urutan terbalik yang valid,
// serta merapikan quote gantung dan menyanitasi karakter kontrol.
func CleanJSONResponse(raw string) string {
	clean := strings.TrimSpace(raw)

	// 1. Ekstrak dari markdown codeblock ```json ... ``` jika ada
	reMarkdown := regexp.MustCompile(`(?s)\x60\x60\x60(?:json)?\s*(.*?)\s*\x60\x60\x60`)
	if matches := reMarkdown.FindStringSubmatch(clean); len(matches) > 1 {
		clean = strings.TrimSpace(matches[1])
	} else {
		clean = strings.ReplaceAll(clean, "```json", "")
		clean = strings.ReplaceAll(clean, "```", "")
		clean = strings.TrimSpace(clean)
	}

	// 2. Temukan '{' pertama
	firstBrace := strings.Index(clean, "{")
	if firstBrace == -1 {
		return clean
	}
	clean = clean[firstBrace:]

	// 3. Lacak kedalaman kurung kurawal (depth) dari firstBrace
	depth := 0
	inString := false
	escaped := false
	lastOuterBrace := -1

	for i := 0; i < len(clean); i++ {
		ch := clean[i]
		if escaped {
			escaped = false
			continue
		}
		if ch == '\\' && inString {
			escaped = true
			continue
		}
		if ch == '"' {
			inString = !inString
			continue
		}
		if inString {
			continue
		}

		if ch == '{' {
			depth++
		} else if ch == '}' {
			depth--
			if depth == 0 {
				lastOuterBrace = i
				break
			}
		}
	}

	// Jika ditemukan penutup terluar yang lengkap (depth == 0)
	if lastOuterBrace != -1 {
		clean = clean[:lastOuterBrace+1]
		return sanitizeJSONStrings(clean)
	}

	// Jika respons terpotong di tengah jalan (depth > 0):
	// Rapikan quote string yang menggantung
	if inString {
		clean += `"`
	}

	// 4. Gunakan LIFO Stack untuk melacak urutan penutupan '{' dan '[' secara presisi
	var stack []byte
	inString = false
	escaped = false

	for i := 0; i < len(clean); i++ {
		ch := clean[i]
		if escaped {
			escaped = false
			continue
		}
		if ch == '\\' && inString {
			escaped = true
			continue
		}
		if ch == '"' {
			inString = !inString
			continue
		}
		if inString {
			continue
		}

		if ch == '{' || ch == '[' {
			stack = append(stack, ch)
		} else if ch == '}' {
			if len(stack) > 0 && stack[len(stack)-1] == '{' {
				stack = stack[:len(stack)-1]
			}
		} else if ch == ']' {
			if len(stack) > 0 && stack[len(stack)-1] == '[' {
				stack = stack[:len(stack)-1]
			}
		}
	}

	// Hapus koma/titik dua/titik gantung di akhir string
	clean = strings.TrimRight(strings.TrimSpace(clean), ",: \t\r\n")

	// Pop dari Stack secara terbalik (LIFO Order) untuk urutan penutupan JSON yang 100% valid
	for i := len(stack) - 1; i >= 0; i-- {
		if stack[i] == '{' {
			clean += "}"
		} else if stack[i] == '[' {
			clean += "]"
		}
	}

	return sanitizeJSONStrings(clean)
}

// sanitizeJSONStrings melakukan sanitasi karakter kontrol (newline, carriage return, tab)
// di dalam string literal JSON agar json.Unmarshal tidak melempar error syntax.
func sanitizeJSONStrings(s string) string {
	var sb strings.Builder
	inString := false
	escaped := false

	for i := 0; i < len(s); i++ {
		ch := s[i]
		if escaped {
			sb.WriteByte(ch)
			escaped = false
			continue
		}
		if ch == '\\' && inString {
			sb.WriteByte(ch)
			escaped = true
			continue
		}
		if ch == '"' {
			inString = !inString
			sb.WriteByte(ch)
			continue
		}
		if inString {
			if ch == '\n' {
				sb.WriteString("\\n")
				continue
			}
			if ch == '\r' {
				sb.WriteString("\\r")
				continue
			}
			if ch == '\t' {
				sb.WriteString("\\t")
				continue
			}
		}
		sb.WriteByte(ch)
	}
	return sb.String()
}
