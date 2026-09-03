package services

import (
	_ "embed"
	"backend/internal/models/domain"
	"backend/internal/repositories"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

//go:embed seeds/rec_disc.csv
var defaultDISCCSV string

type DISCService interface {
	GetCandidates(search, dominant, consistency string, page, pageSize int) ([]domain.DISCAssessment, int64, error)
	GetCandidateByID(id uint) (*domain.DISCAssessment, error)
	GetSummary() (*repositories.DISCPopulationSummary, error)
	ImportCSV(csvContent string) (int, error)
	ImportCSVIncremental(csvContent string) (int, int, int, error)
	SyncFromGoogleSheet(sheetURL string) (int, int, int, error)
	SyncFromGoogleSheetWithAuth(sheetURL, accessToken string) (int, int, int, error)
	GetGoogleAuthURL(redirectURI string) string
	ExchangeGoogleCode(code, redirectURI string) (string, error)
	ResetToDefault() (int, error)
}

type discService struct {
	DB   *gorm.DB
	Log  *logrus.Logger
	Repo repositories.DISCRepository
}

func NewDISCService(db *gorm.DB, log *logrus.Logger, repo repositories.DISCRepository) DISCService {
	return &discService{
		DB:   db,
		Log:  log,
		Repo: repo,
	}
}

func (s *discService) GetCandidates(search, dominant, consistency string, page, pageSize int) ([]domain.DISCAssessment, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	return s.Repo.FindAll(s.DB, search, dominant, consistency, offset, pageSize)
}

func (s *discService) GetCandidateByID(id uint) (*domain.DISCAssessment, error) {
	return s.Repo.FindByID(s.DB, id)
}

func (s *discService) GetSummary() (*repositories.DISCPopulationSummary, error) {
	return s.Repo.GetSummary(s.DB)
}

func parseSafeNumeric(val string, fallback float64) float64 {
	sanitized := strings.TrimSpace(strings.ReplaceAll(val, ",", "."))
	if sanitized == "" {
		return fallback
	}
	num, err := strconv.ParseFloat(sanitized, 64)
	if err != nil {
		return fallback
	}
	return num
}

// RFC 4180 lexer character by character
func parseRFC4180CSV(rawText string) [][]string {
	text := strings.TrimPrefix(rawText, "\uFEFF") // Strip BOM
	var rows [][]string
	var currentRow []string
	var currentField strings.Builder
	inQuotes := false
	runes := []rune(text)
	n := len(runes)

	for i := 0; i < n; i++ {
		ch := runes[i]
		var nextCh rune
		if i+1 < n {
			nextCh = runes[i+1]
		}

		if ch == '"' {
			if inQuotes && nextCh == '"' {
				currentField.WriteRune('"')
				i++
				continue
			}
			inQuotes = !inQuotes
			continue
		}

		if ch == ',' && !inQuotes {
			currentRow = append(currentRow, strings.TrimSpace(currentField.String()))
			currentField.Reset()
			continue
		}

		if (ch == '\r' || ch == '\n') && !inQuotes {
			if ch == '\r' && nextCh == '\n' {
				i++
			}
			currentRow = append(currentRow, strings.TrimSpace(currentField.String()))
			currentField.Reset()
			if len(currentRow) > 0 && hasNonEmpty(currentRow) {
				rows = append(rows, currentRow)
			}
			currentRow = nil
			continue
		}

		currentField.WriteRune(ch)
	}

	if currentField.Len() > 0 || len(currentRow) > 0 {
		currentRow = append(currentRow, strings.TrimSpace(currentField.String()))
		if len(currentRow) > 0 && hasNonEmpty(currentRow) {
			rows = append(rows, currentRow)
		}
	}

	return rows
}

func hasNonEmpty(arr []string) bool {
	for _, s := range arr {
		if strings.TrimSpace(s) != "" {
			return true
		}
	}
	return false
}

func parseCSVItems(csvContent string) ([]domain.DISCAssessment, error) {
	rows := parseRFC4180CSV(csvContent)
	if len(rows) < 2 {
		return nil, fmt.Errorf("file CSV tidak memiliki data yang valid (kurang dari 2 baris)")
	}

	headerMap := make(map[string]int)
	for idx, h := range rows[0] {
		headerMap[strings.ToLower(strings.TrimSpace(h))] = idx
	}

	findIdx := func(keys ...string) int {
		for _, key := range keys {
			for h, idx := range headerMap {
				if strings.Contains(h, key) {
					return idx
				}
			}
		}
		return -1
	}

	nameIdx := findIdx("nama")
	nikIdx := findIdx("identitas", "ktp", "nik")
	emailIdx := findIdx("email")
	dateIdx := findIdx("timestamp", "date")

	traitIdx := findIdx("traitm", "trait_m", "trait m", "trait")
	traitLIdx := findIdx("traitl", "trait_l")
	traitPkIdx := findIdx("traitp-k", "traitp", "trait_pk")

	konsIdx := -1
	for h, idx := range headerMap {
		if strings.Contains(h, "kons fin") || strings.Contains(h, "kons_fin") || strings.Contains(h, "consistency") {
			konsIdx = idx
			break
		}
	}
	if konsIdx == -1 {
		konsIdx = findIdx("kons")
	}

	grmdIdx := findIdx("grmd")
	grmiIdx := findIdx("grmi")
	grmsIdx := findIdx("grms")
	grmcIdx := findIdx("grmc")
	grldIdx := findIdx("grld")
	grliIdx := findIdx("grli")
	grlsIdx := findIdx("grls")
	grlcIdx := findIdx("grlc")
	pkdIdx := findIdx("grp-kd")
	pkiIdx := findIdx("grp-ki")
	pksIdx := findIdx("grp-ks")
	pkcIdx := findIdx("grp-kc")

	descWordsIdx := findIdx("desc. words", "desc words", "desc")
	charIdx := findIdx("character")
	motivIdx := findIdx("motivation")
	jobIdx := findIdx("job emphasis")
	g1Idx := findIdx("graph i")
	g2Idx := findIdx("graph ii")

	var items []domain.DISCAssessment
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		name := ""
		if nameIdx != -1 && nameIdx < len(row) {
			name = strings.TrimSpace(row[nameIdx])
		}
		if name == "" {
			continue
		}

		nik := "-"
		if nikIdx != -1 && nikIdx < len(row) && strings.TrimSpace(row[nikIdx]) != "" {
			nik = strings.TrimSpace(row[nikIdx])
		}

		email := "-"
		if emailIdx != -1 && emailIdx < len(row) && strings.TrimSpace(row[emailIdx]) != "" {
			email = strings.TrimSpace(row[emailIdx])
		}

		testDate := "-"
		if dateIdx != -1 && dateIdx < len(row) && strings.TrimSpace(row[dateIdx]) != "" {
			testDate = strings.TrimSpace(row[dateIdx])
		}

		kons := "Still Consistent"
		if konsIdx != -1 && konsIdx < len(row) && strings.TrimSpace(row[konsIdx]) != "" {
			kons = strings.TrimSpace(row[konsIdx])
		} else if konsIdx != -1 && (konsIdx >= len(row) || strings.TrimSpace(row[konsIdx]) == "") {
			kons = "Incomplete"
		}

		trait := "D / C"
		if traitIdx != -1 && traitIdx < len(row) && strings.TrimSpace(row[traitIdx]) != "" {
			trait = strings.TrimSpace(row[traitIdx])
		}

		dominant := "D"
		if strings.HasPrefix(trait, "I") || strings.Contains(trait, "/ I") {
			dominant = "I"
		} else if strings.HasPrefix(trait, "S") || strings.Contains(trait, "/ S") {
			dominant = "S"
		} else if strings.HasPrefix(trait, "C") || strings.Contains(trait, "/ C") {
			dominant = "C"
		}

		traitL := "-"
		if traitLIdx != -1 && traitLIdx < len(row) {
			traitL = strings.TrimSpace(row[traitLIdx])
		}

		traitPk := "-"
		if traitPkIdx != -1 && traitPkIdx < len(row) {
			traitPk = strings.TrimSpace(row[traitPkIdx])
		}

		getVal := func(idx int, fallback float64) float64 {
			if idx != -1 && idx < len(row) {
				return parseSafeNumeric(row[idx], fallback)
			}
			return fallback
		}

		getStr := func(idx int, fallback string) string {
			if idx != -1 && idx < len(row) && strings.TrimSpace(row[idx]) != "" {
				return strings.TrimSpace(row[idx])
			}
			return fallback
		}

		items = append(items, domain.DISCAssessment{
			CandidateCode:    fmt.Sprintf("DISC-%04d", i),
			Name:             name,
			NIK:              nik,
			Email:            email,
			TestDate:         testDate,
			DominantType:     dominant,
			TraitM:           trait,
			TraitL:           traitL,
			TraitPK:          traitPk,
			Consistency:      kons,
			G1D:              getVal(grmdIdx, 2),
			G1I:              getVal(grmiIdx, 1),
			G1S:              getVal(grmsIdx, 0),
			G1C:              getVal(grmcIdx, 3),
			G2D:              getVal(grldIdx, 1),
			G2I:              getVal(grliIdx, 0),
			G2S:              getVal(grlsIdx, 2),
			G2C:              getVal(grlcIdx, 2),
			G3D:              getVal(pkdIdx, 1),
			G3I:              getVal(pkiIdx, 1),
			G3S:              getVal(pksIdx, -1),
			G3C:              getVal(pkcIdx, 1),
			DescWords:        getStr(descWordsIdx, "-"),
			CharacterSummary: getStr(charIdx, "-"),
			SelfMotivation:   getStr(motivIdx, "-"),
			JobEmphasis:      getStr(jobIdx, "-"),
			WorkMask:         getStr(g1Idx, "-"),
			UnderPressure:    getStr(g2Idx, "-"),
		})
	}

	if len(items) == 0 {
		return nil, fmt.Errorf("tidak ada baris data kandidat yang berhasil diparsing")
	}

	return items, nil
}

func (s *discService) ImportCSV(csvContent string) (int, error) {
	items, err := parseCSVItems(csvContent)
	if err != nil {
		return 0, err
	}

	if err := s.Repo.TruncateAndBatchCreate(s.DB, items); err != nil {
		return 0, err
	}

	return len(items), nil
}

func (s *discService) ImportCSVIncremental(csvContent string) (int, int, int, error) {
	items, err := parseCSVItems(csvContent)
	if err != nil {
		return 0, 0, 0, err
	}

	return s.Repo.UpsertIncremental(s.DB, items)
}

func convertToGoogleSheetCSVURL(rawURL string) string {
	u := strings.TrimSpace(rawURL)
	if u == "" {
		return ""
	}
	if strings.Contains(u, "export?format=csv") || strings.Contains(u, "output=csv") {
		return u
	}
	if strings.Contains(u, "docs.google.com/spreadsheets/d/") {
		parts := strings.Split(u, "/edit")
		if len(parts) >= 1 {
			baseDoc := parts[0]
			gid := "0"
			if strings.Contains(u, "gid=") {
				gidParts := strings.Split(u, "gid=")
				if len(gidParts) >= 2 {
					gid = strings.Split(gidParts[1], "&")[0]
					gid = strings.Split(gid, "#")[0]
				}
			}
			return fmt.Sprintf("%s/export?format=csv&gid=%s", baseDoc, gid)
		}
	}
	return u
}

func (s *discService) GetGoogleAuthURL(redirectURI string) string {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	if clientID == "" {
		clientID = "717811013815-8e9eplq85bmocouomrgkivnjlkn041qk.apps.googleusercontent.com"
	}

	scope := url.QueryEscape("https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly")
	return fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&prompt=consent",
		clientID,
		url.QueryEscape(redirectURI),
		scope,
	)
}

func (s *discService) ExchangeGoogleCode(code, redirectURI string) (string, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	req, err := http.NewRequest("POST", "https://oauth2.googleapis.com/token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal menghubungi server otentikasi Google: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("google OAuth error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var res struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		TokenType    string `json:"token_type"`
		ExpiresIn    int    `json:"expires_in"`
	}
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		return "", err
	}

	return res.AccessToken, nil
}

func (s *discService) SyncFromGoogleSheet(sheetURL string) (int, int, int, error) {
	return s.SyncFromGoogleSheetWithAuth(sheetURL, "")
}

func (s *discService) SyncFromGoogleSheetWithAuth(sheetURL, accessToken string) (int, int, int, error) {
	targetURL := convertToGoogleSheetCSVURL(sheetURL)
	if targetURL == "" {
		return 0, 0, 0, fmt.Errorf("URL Google Spreadsheet tidak valid")
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("gagal membuat request HTTP: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	if accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+accessToken)
	}

	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("gagal mengambil data dari Google Spreadsheet: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return 0, 0, 0, fmt.Errorf("Google Spreadsheet merespon dengan status HTTP %d. Spreadsheet ini privat; silakan gunakan tombol 'Hubungkan Google SPIL' untuk otorisasi akses", resp.StatusCode)
	}

	if resp.StatusCode != http.StatusOK {
		return 0, 0, 0, fmt.Errorf("Google Spreadsheet merespon dengan status HTTP %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("gagal membaca data dari Google Spreadsheet: %w", err)
	}

	content := string(bodyBytes)
	if strings.Contains(content, "<!DOCTYPE html>") || strings.Contains(content, "<html") {
		return 0, 0, 0, fmt.Errorf("Google Spreadsheet terkunci / memerlukan otorisasi. Silakan login akun Google SPIL melalui dialog sinkronisasi")
	}

	return s.ImportCSVIncremental(content)
}

func (s *discService) ResetToDefault() (int, error) {
	if strings.TrimSpace(defaultDISCCSV) == "" {
		return 0, fmt.Errorf("default embedded CSV dataset is empty")
	}
	return s.ImportCSV(defaultDISCCSV)
}
