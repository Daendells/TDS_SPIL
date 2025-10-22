package web

type OptionData struct {
	OptionID     int    `json:"optionId"`
	QuestionID   int    `json:"questionId"`
	OptionLetter string `json:"optionLetter"`
	OptionText   string `json:"optionText"`
	Score        int    `json:"score"`
	IsImage      int    `json:"isImage"`
	ImageUrl     string `json:"imageUrl"`
}

type OptionResponse struct {
	OptionID     int    `json:"optionId"`
	OptionLetter string `json:"optionLetter"`
	OptionText   string `json:"optionText"`
	Score        int    `json:"score"`
	IsImage      int    `json:"isImage"`
	ImageUrl     string `json:"imageUrl"`
}

// Public response untuk assessment public (tanpa score dan questionId)
type OptionPublicResponse struct {
	OptionID     int    `json:"optionId"`
	OptionLetter string `json:"optionLetter"`
	OptionText   string `json:"optionText"`
	IsImage      int    `json:"isImage"`
	ImageUrl     string `json:"imageUrl"`
}