package web

type CVAnalysisResponse struct {
	Score               int                 `json:"score"`
	RecommendedMinScore int                 `json:"recommended_min_score"`
	MinScoreExplanation string              `json:"min_score_explanation"`
	ScoreExplanation    string              `json:"score_explanation"`
	Strengths           []string            `json:"strengths"`
	Weaknesses          []string            `json:"weaknesses"`
	ProfileSummary      string              `json:"profile_summary"`
	InterviewQuestions  []InterviewQuestion `json:"interview_questions"`
	Aspects             Aspects             `json:"aspects"`
}

type InterviewQuestion struct {
	Category string `json:"category"`
	Question string `json:"question"`
	Reason   string `json:"reason"`
}

type Aspects struct {
	TechnicalSkill int `json:"technical_skill"`
	Experience     int `json:"experience"`
	Education      int `json:"education"`
	Communication  int `json:"communication"`
	Leadership     int `json:"leadership"`
	ProblemSolving int `json:"problem_solving"`
	CulturalFit    int `json:"cultural_fit"`
}

type CVAnalysisResult struct {
	ID                  uint   `json:"id" gorm:"primaryKey;autoIncrement"`
	CreatedAt           string `json:"created_at"`
	UpdatedAt           string `json:"updated_at"`
	RoleAnalyzed        string `json:"role_analyzed"`
	Score               int    `json:"score"`
	RecommendedMinScore int    `json:"recommended_min_score"`
	MinScoreExplanation string `json:"min_score_explanation"`
	ScoreExplanation    string `json:"score_explanation"`
	Strengths           string `json:"strengths"`
	Weaknesses          string `json:"weaknesses"`
	ProfileSummary      string `json:"profile_summary"`
	Aspects             string `json:"aspects"`
	InterviewQuestions  string `json:"interview_questions"`
}

type JobFitScoreBreakdown struct {
	TechnicalSkills int `json:"technical_skills"`
	Experience      int `json:"experience"`
	Education       int `json:"education"`
	Projects        int `json:"projects"`
	Certifications  int `json:"certifications"`
}

type CandidateRankItem struct {
	CandidateID   string               `json:"candidate_id"`
	CandidateName string               `json:"candidate_name"`
	JobFitScore   int                  `json:"job_fit_score"`
	Strengths     []string             `json:"strengths"`
	MissingSkills []string             `json:"missing_skills"`
	ShortSummary  string               `json:"short_summary"`
	ScoreBreakdown JobFitScoreBreakdown `json:"score_breakdown"`
}

type CandidateRankingResponse struct {
	JobTitle       string              `json:"job_title"`
	TotalCandidates int                 `json:"total_candidates"`
	Rankings       []CandidateRankItem `json:"rankings"`
}

type RoleRecommendationItem struct {
	Role           string               `json:"role"`
	JobFitScore   int                  `json:"job_fit_score"`
	BriefReason    string               `json:"brief_reason"`
	MatchingSkills []string             `json:"matching_skills"`
	MissingSkills  []string             `json:"missing_skills"`
	ScoreBreakdown JobFitScoreBreakdown `json:"score_breakdown"`
}

type RoleRecommendationResponse struct {
	CandidateName    string                   `json:"candidate_name"`
	RecommendedRoles []RoleRecommendationItem `json:"recommended_roles"`
}

type PersonBestRoleItem struct {
	CandidateID    string   `json:"candidate_id"`
	CandidateName  string   `json:"candidate_name"`
	BestRole       string   `json:"best_role"`
	JobFitScore    int      `json:"job_fit_score"`
	BriefReason    string   `json:"brief_reason"`
	MatchingSkills []string `json:"matching_skills"`
	MissingSkills  []string `json:"missing_skills"`
}

type CandidateEvaluationItem struct {
	CandidateID         string               `json:"candidate_id"`
	CandidateName       string               `json:"candidate_name"`
	JobFitScore         int                  `json:"job_fit_score"`
	ScoreExplanation    string               `json:"score_explanation"`
	MinScore            int                  `json:"min_score"`
	MinScoreExplanation string               `json:"min_score_explanation"`
	Strengths           []string             `json:"strengths"`
	Weaknesses          []string             `json:"weaknesses"`
	ProfileSummary      string               `json:"profile_summary"`
	InterviewQuestions  []InterviewQuestion  `json:"interview_questions"`
	Aspects             Aspects              `json:"aspects"`
	ScoreBreakdown      JobFitScoreBreakdown `json:"score_breakdown"`
}

type RoleCandidateRanking struct {
	Role        string                    `json:"role"`
	Description string                    `json:"description"`
	Candidates  []CandidateEvaluationItem `json:"candidates"`
}

type UnifiedCVAnalysisResponse struct {
	PersonBestRoles []PersonBestRoleItem   `json:"person_best_roles"`
	RoleRankings    []RoleCandidateRanking `json:"role_rankings"`
}

// ── Fitur 1: Candidate Analysis (1 CV vs semua role) ──────────────────────────

// RoleFitItem adalah hasil kecocokan satu kandidat terhadap satu role.
type RoleFitItem struct {
	Role       string   `json:"role"`
	FitScore   int      `json:"fit_score"`
	Strengths  []string `json:"strengths"`
	Weaknesses []string `json:"weaknesses"`
	SkillGap   []string `json:"skill_gap"`
	Reason     string   `json:"reason"`
}

// CandidateAnalysisResponse adalah output Fitur 1.
type CandidateAnalysisResponse struct {
	CandidateName  string        `json:"candidate_name"`
	ProfileSummary string        `json:"profile_summary"`
	BestFitRole    string        `json:"best_fit_role"`
	BestFitScore   int           `json:"best_fit_score"`
	RoleFits       []RoleFitItem `json:"role_fits"`
}

// ── Fitur 2: Role Analysis (1 role vs banyak kandidat) ────────────────────────

// CandidateRankingItem adalah hasil evaluasi satu kandidat dalam Role Analysis.
type CandidateRankingItem struct {
	Rank           int      `json:"rank"`
	CandidateID    string   `json:"candidate_id"`
	CandidateName  string   `json:"candidate_name"`
	FitScore       int      `json:"fit_score"`
	ProfileSummary string   `json:"profile_summary"`
	Strengths      []string `json:"strengths"`
	Weaknesses     []string `json:"weaknesses"`
	SkillGap       []string `json:"skill_gap"`
	Reason         string   `json:"reason"`
}

// RoleAnalysisResponse adalah output Fitur 2.
type RoleAnalysisResponse struct {
	Role                  string                 `json:"role"`
	TotalCandidates       int                    `json:"total_candidates"`
	RecommendedCandidate  string                 `json:"recommended_candidate"`
	RecommendationReason  string                 `json:"recommendation_reason"`
	Rankings              []CandidateRankingItem `json:"rankings"`
}

// ── On-Demand: Interview Questions ────────────────────────────────────────────

// InterviewQuestionItem adalah satu pertanyaan interview.
type InterviewQuestionItem struct {
	Number   int    `json:"number"`
	Category string `json:"category"`
	Question string `json:"question"`
	Reason   string `json:"reason"`
}

// InterviewQuestionsResponse adalah output generate interview questions.
type InterviewQuestionsResponse struct {
	CandidateName string                  `json:"candidate_name"`
	Role          string                  `json:"role"`
	Questions     []InterviewQuestionItem `json:"questions"`
}