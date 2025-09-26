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

func MapIDPProgram(idp string) string {
	if SliceContains([]string{"MUALIM III", "MASINIS IV"}, idp) {
		return "FDP"
	} else if SliceContains([]string{"MUALIM II", "MASINIS III"}, idp) {
		return "MDP"
	} else if SliceContains([]string{"MUALIM I", "MASINIS II"}, idp) {
		return "SDP"
	} else {
		return "UNKNOWN"
	}
}