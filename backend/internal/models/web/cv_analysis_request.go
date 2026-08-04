package web

type CVAnalysisRequest struct {
	CVText string `json:"cv_text" binding:"required"`
	Role   string `json:"role" binding:"required"`
}

type CandidateItem struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	CVText string `json:"cv_text"`
}

type RankCandidatesRequest struct {
	JobDescription string          `json:"job_description"`
	Role           string          `json:"role"`
	Candidates     []CandidateItem `json:"candidates"`
}

type RecommendRolesRequest struct {
	CandidateName string   `json:"candidate_name"`
	CVText        string   `json:"cv_text"`
	Roles         []string `json:"roles"`
}

type TargetRoleItem struct {
	Role        string `json:"role"`
	Description string `json:"description"`
}

type UnifiedCVAnalysisRequest struct {
	Candidates  []CandidateItem  `json:"candidates"`
	TargetRoles []TargetRoleItem `json:"target_roles"`
}

// CandidateAnalysisRequest adalah request untuk Fitur 1 (Candidate Analysis).
// Satu CV dianalisis terhadap role IT yang dipilih/ditambahkan.
type CandidateAnalysisRequest struct {
	CandidateName string           `json:"candidate_name"`
	CVText        string           `json:"cv_text" binding:"required"`
	TargetRoles   []TargetRoleItem `json:"target_roles"`
}

// RoleAnalysisRequest adalah request untuk Fitur 2 (Role Analysis).
// Satu role dibandingkan dengan banyak kandidat.
type RoleAnalysisRequest struct {
	Role           string          `json:"role" binding:"required"`
	JobDescription string          `json:"job_description"`
	Candidates     []CandidateItem `json:"candidates" binding:"required"`
}

// GenerateInterviewQuestionsRequest adalah request untuk generate interview questions on-demand.
type GenerateInterviewQuestionsRequest struct {
	CandidateName  string `json:"candidate_name"`
	CVText         string `json:"cv_text" binding:"required"`
	Role           string `json:"role" binding:"required"`
	JobDescription string `json:"job_description"`
}