package web

type ErrorResponse struct {
	Code   int    `json="code"`
	Status string `json="status"`
	Error  string `json="error"`
}
