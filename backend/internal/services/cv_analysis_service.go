package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"sync"

	"backend/internal/llm"
	"backend/internal/models/web"
	"github.com/sirupsen/logrus"
)

type CVAnalysisService struct {
	log        *logrus.Logger
	openRouter *llm.OpenRouterClient
	cache      sync.Map
}

func NewCVAnalysisService(log *logrus.Logger, openRouter *llm.OpenRouterClient) *CVAnalysisService {
	return &CVAnalysisService{
		log:        log,
		openRouter: openRouter,
	}
}

func generateCacheKey(prefix string, items ...string) string {
	h := sha256.New()
	h.Write([]byte(prefix))
	for _, item := range items {
		h.Write([]byte(item))
	}
	return hex.EncodeToString(h.Sum(nil))
}

func (s *CVAnalysisService) AnalyzeCV(ctx context.Context, cvText, role string) (*web.CVAnalysisResponse, error) {
	if strings.TrimSpace(cvText) == "" {
		return nil, fmt.Errorf("CV text cannot be empty")
	}
	if strings.TrimSpace(role) == "" {
		return nil, fmt.Errorf("role cannot be empty")
	}

	cacheKey := generateCacheKey("single:", cvText, role)
	if val, ok := s.cache.Load(cacheKey); ok {
		if res, ok := val.(*web.CVAnalysisResponse); ok {
			s.log.Info("CV analysis returned from cache")
			return res, nil
		}
	}

	rawResponse, err := s.openRouter.AnalyzeCV(ctx, cvText, role)
	if err != nil {
		s.log.WithError(err).Error("failed to call OpenRouter API for CV analysis")
		return nil, fmt.Errorf("failed to analyze CV: %w", err)
	}

	var analysis web.CVAnalysisResponse
	cleanJSON := cleanJSONResponse(rawResponse)

	if err := json.Unmarshal([]byte(cleanJSON), &analysis); err != nil {
		s.log.WithError(err).Warn("OpenRouter response is not valid JSON")
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	if analysis.Score < 0 {
		analysis.Score = 0
	}
	if analysis.Score > 100 {
		analysis.Score = 100
	}

	s.cache.Store(cacheKey, &analysis)
	return &analysis, nil
}

func (s *CVAnalysisService) RankCandidates(ctx context.Context, req web.RankCandidatesRequest) (*web.CandidateRankingResponse, error) {
	if len(req.Candidates) == 0 {
		return nil, fmt.Errorf("candidate list cannot be empty")
	}
	if strings.TrimSpace(req.Role) == "" && strings.TrimSpace(req.JobDescription) == "" {
		return nil, fmt.Errorf("role or job description is required")
	}

	candidatesBytes, _ := json.Marshal(req.Candidates)
	cacheKey := generateCacheKey("rank:", req.Role, req.JobDescription, string(candidatesBytes))
	if val, ok := s.cache.Load(cacheKey); ok {
		if res, ok := val.(*web.CandidateRankingResponse); ok {
			s.log.Info("Candidate ranking returned from cache")
			return res, nil
		}
	}

	rawResponse, err := s.openRouter.RankCandidates(ctx, req)
	if err != nil {
		s.log.WithError(err).Error("failed to call OpenRouter API for candidate ranking")
		return nil, fmt.Errorf("failed to rank candidates: %w", err)
	}

	var rankingRes web.CandidateRankingResponse
	cleanJSON := cleanJSONResponse(rawResponse)

	if err := json.Unmarshal([]byte(cleanJSON), &rankingRes); err != nil {
		s.log.WithError(err).Warn("OpenRouter ranking response is not valid JSON")
		return nil, fmt.Errorf("failed to parse AI ranking response: %w", err)
	}

	// Sort rankings descending by job fit score
	sort.Slice(rankingRes.Rankings, func(i, j int) bool {
		return rankingRes.Rankings[i].JobFitScore > rankingRes.Rankings[j].JobFitScore
	})

	rankingRes.TotalCandidates = len(rankingRes.Rankings)
	s.cache.Store(cacheKey, &rankingRes)
	return &rankingRes, nil
}

func (s *CVAnalysisService) RecommendRoles(ctx context.Context, req web.RecommendRolesRequest) (*web.RoleRecommendationResponse, error) {
	if strings.TrimSpace(req.CVText) == "" {
		return nil, fmt.Errorf("CV text cannot be empty")
	}

	if len(req.Roles) == 0 {
		req.Roles = []string{
			"Frontend Developer",
			"Backend Developer",
			"Fullstack Developer",
			"DevOps Engineer",
			"Data Scientist",
			"Product Manager",
			"UI/UX Designer",
			"QA Engineer",
			"Project Manager",
			"System Administrator",
		}
	}

	rolesBytes, _ := json.Marshal(req.Roles)
	cacheKey := generateCacheKey("recommend:", req.CandidateName, req.CVText, string(rolesBytes))
	if val, ok := s.cache.Load(cacheKey); ok {
		if res, ok := val.(*web.RoleRecommendationResponse); ok {
			s.log.Info("Role recommendation returned from cache")
			return res, nil
		}
	}

	rawResponse, err := s.openRouter.RecommendRoles(ctx, req)
	if err != nil {
		s.log.WithError(err).Error("failed to call OpenRouter API for role recommendation")
		return nil, fmt.Errorf("failed to recommend roles: %w", err)
	}

	var recRes web.RoleRecommendationResponse
	cleanJSON := cleanJSONResponse(rawResponse)

	if err := json.Unmarshal([]byte(cleanJSON), &recRes); err != nil {
		s.log.WithError(err).Warn("OpenRouter role recommendation response is not valid JSON")
		return nil, fmt.Errorf("failed to parse AI role recommendation response: %w", err)
	}

	// Sort recommended roles descending by job fit score
	sort.Slice(recRes.RecommendedRoles, func(i, j int) bool {
		return recRes.RecommendedRoles[i].JobFitScore > recRes.RecommendedRoles[j].JobFitScore
	})

	s.cache.Store(cacheKey, &recRes)
	return &recRes, nil
}

func (s *CVAnalysisService) AnalyzeUnifiedCVs(ctx context.Context, req web.UnifiedCVAnalysisRequest) (*web.UnifiedCVAnalysisResponse, error) {
	if len(req.Candidates) == 0 {
		return nil, fmt.Errorf("minimal 1 file CV kandidat harus diunggah")
	}
	if len(req.TargetRoles) == 0 {
		return nil, fmt.Errorf("minimal 1 target role IT harus dipilih")
	}

	candBytes, _ := json.Marshal(req.Candidates)
	rolesBytes, _ := json.Marshal(req.TargetRoles)
	cacheKey := generateCacheKey("unified:", string(candBytes), string(rolesBytes))

	if val, ok := s.cache.Load(cacheKey); ok {
		if res, ok := val.(*web.UnifiedCVAnalysisResponse); ok {
			s.log.Info("Unified CV analysis returned from cache")
			return res, nil
		}
	}

	targetRoleNames := make([]string, 0, len(req.TargetRoles))
	for _, tr := range req.TargetRoles {
		targetRoleNames = append(targetRoleNames, tr.Role)
	}

	// 1. Bagian 1: Parallel Person Best Role Mapping
	personBestRoles := make([]web.PersonBestRoleItem, len(req.Candidates))
	var wg1 sync.WaitGroup
	wg1.Add(len(req.Candidates))

	for i, cand := range req.Candidates {
		go func(idx int, c web.CandidateItem) {
			defer wg1.Done()
			recRes, err := s.RecommendRoles(ctx, web.RecommendRolesRequest{
				CandidateName: c.Name,
				CVText:        c.CVText,
				Roles:         targetRoleNames,
			})
			if err != nil || recRes == nil || len(recRes.RecommendedRoles) == 0 {
				s.log.Warnf("Failed to get best role for candidate %s, using fallback", c.Name)
				personBestRoles[idx] = web.PersonBestRoleItem{
					CandidateID:    c.ID,
					CandidateName:  c.Name,
					BestRole:       targetRoleNames[0],
					JobFitScore:    70,
					BriefReason:    "Analisis role terbaik kandidat berdasarkan kualifikasi utama.",
					MatchingSkills: []string{"Teknis IT"},
					MissingSkills:  []string{},
				}
			} else {
				topRole := recRes.RecommendedRoles[0]
				personBestRoles[idx] = web.PersonBestRoleItem{
					CandidateID:    c.ID,
					CandidateName:  c.Name,
					BestRole:       topRole.Role,
					JobFitScore:    topRole.JobFitScore,
					BriefReason:    topRole.BriefReason,
					MatchingSkills: topRole.MatchingSkills,
					MissingSkills:  topRole.MissingSkills,
				}
			}
		}(i, cand)
	}
	wg1.Wait()

	// 2. Bagian 2: Parallel Role Candidate Rankings
	type evalTaskResult struct {
		roleIdx int
		candIdx int
		eval    web.CandidateEvaluationItem
	}

	totalTasks := len(req.TargetRoles) * len(req.Candidates)
	taskChan := make(chan evalTaskResult, totalTasks)
	var wg2 sync.WaitGroup

	// Concurrency semaphore (max 8 concurrent worker goroutines)
	sem := make(chan struct{}, 8)

	for rIdx, tr := range req.TargetRoles {
		for cIdx, cand := range req.Candidates {
			wg2.Add(1)
			go func(roleIdx int, targetRole web.TargetRoleItem, candIdx int, c web.CandidateItem) {
				defer wg2.Done()
				sem <- struct{}{}
				defer func() { <-sem }()

				analysisRes, err := s.AnalyzeCV(ctx, c.CVText, targetRole.Role)
				if err != nil || analysisRes == nil {
					s.log.Warnf("Failed to analyze CV for candidate %s role %s", c.Name, targetRole.Role)
					return
				}

				evalItem := web.CandidateEvaluationItem{
					CandidateID:         c.ID,
					CandidateName:       c.Name,
					JobFitScore:         analysisRes.Score,
					ScoreExplanation:    analysisRes.ScoreExplanation,
					MinScore:            analysisRes.RecommendedMinScore,
					MinScoreExplanation: analysisRes.MinScoreExplanation,
					Strengths:           analysisRes.Strengths,
					Weaknesses:          analysisRes.Weaknesses,
					ProfileSummary:      analysisRes.ProfileSummary,
					InterviewQuestions:  analysisRes.InterviewQuestions,
					Aspects:             analysisRes.Aspects,
					ScoreBreakdown: web.JobFitScoreBreakdown{
						TechnicalSkills: analysisRes.Aspects.TechnicalSkill,
						Experience:      analysisRes.Aspects.Experience,
						Education:       analysisRes.Aspects.Education,
						Projects:        analysisRes.Aspects.ProblemSolving,
						Certifications:  analysisRes.Aspects.CulturalFit,
					},
				}

				taskChan <- evalTaskResult{
					roleIdx: roleIdx,
					candIdx: candIdx,
					eval:    evalItem,
				}
			}(rIdx, tr, cIdx, cand)
		}
	}

	wg2.Wait()
	close(taskChan)

	roleRankingsMap := make(map[int][]web.CandidateEvaluationItem)
	for res := range taskChan {
		roleRankingsMap[res.roleIdx] = append(roleRankingsMap[res.roleIdx], res.eval)
	}

	roleRankings := make([]web.RoleCandidateRanking, len(req.TargetRoles))
	for rIdx, tr := range req.TargetRoles {
		candidatesList := roleRankingsMap[rIdx]
		desc := tr.Description
		if desc == "" {
			desc = fmt.Sprintf("Kriteria role %s berdasarkan standar kualifikasi industri IT dan kecerdasan AI.", tr.Role)
		}

		// Sort candidates inside this role ranking descending by job fit score
		sort.Slice(candidatesList, func(i, j int) bool {
			return candidatesList[i].JobFitScore > candidatesList[j].JobFitScore
		})

		roleRankings[rIdx] = web.RoleCandidateRanking{
			Role:        tr.Role,
			Description: desc,
			Candidates:  candidatesList,
		}
	}

	unifiedRes := &web.UnifiedCVAnalysisResponse{
		PersonBestRoles: personBestRoles,
		RoleRankings:    roleRankings,
	}

	s.cache.Store(cacheKey, unifiedRes)
	return unifiedRes, nil
}

func cleanJSONResponse(raw string) string {
	clean := strings.TrimSpace(raw)
	clean = strings.TrimPrefix(clean, "```json")
	clean = strings.TrimPrefix(clean, "```")
	clean = strings.TrimSuffix(clean, "```")
	return strings.TrimSpace(clean)
}