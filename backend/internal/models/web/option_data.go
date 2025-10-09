package web

type OptionData struct {
	OptionID     int    `json:"optionId"`
	QuestionID   int    `json:"questionId"`
	OptionLetter string `json:"optionLetter"`
	OptionText   string `json:"optionText"`
	Score        int    `json:"score"`
	IsImage      int    `json:"isImage"`
}