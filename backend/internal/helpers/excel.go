package helpers

import "strings"

func SanitizeCell(val string) string {
	val = strings.TrimSpace(val)
	switch val {
	case "#N/A", "#VALUE!", "#REF!", "#DIV/0!", "#NAME?", "#NULL!":
		return "-"
	}
	if val == "" {
		return "-"
	}
	return val
}

func GetCell(row []string, idx int) string {
	if idx < len(row) {
		return row[idx]
	}

	return "-"
}
