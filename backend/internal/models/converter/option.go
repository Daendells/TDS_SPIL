package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func OptionToOptionData(option *domain.Option) web.OptionData {
	return web.OptionData{
		OptionID:     option.OptionID,
		QuestionID:   option.QuestionID,
		OptionLetter: option.OptionLetter,
		OptionText:   option.OptionText,
		Score:        option.Score,
		IsImage:      option.IsImage,
	}
}

func OptionCreateRequestToOption(request *web.OptionCreateRequest) domain.Option {
	return domain.Option{
		QuestionID:   request.QuestionID,
		OptionLetter: request.OptionLetter,
		OptionText:   request.OptionText,
		Score:        request.Score,
		IsImage:      request.IsImage,
	}
}

func OptionUpdateRequestToOption(request *web.OptionUpdateRequest) domain.Option {
	return domain.Option{
		OptionID:     request.OptionID,
		QuestionID:   request.QuestionID,
		OptionLetter: request.OptionLetter,
		OptionText:   request.OptionText,
		Score:        request.Score,
		IsImage:      request.IsImage,
	}
}
