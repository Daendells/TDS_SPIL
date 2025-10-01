package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	// Test data for mentoring report creation
	testData := map[string]interface{}{
		"mentorName":      "John Doe",
		"period":          "2024-01",
		"menteeNames":     []string{"Alice Smith", "Bob Johnson"},
		"department":      "Engineering",
		"program":         "Software Development Mentoring",
		"sessionNumber":   "1",
		"date":            "2024-01-15",
		"duration":        "2 hours",
		"purpose":         "Initial mentoring session",
		"observation":     "Good progress on technical skills",
		"reflection":      "Mentee shows strong potential",
		"actionPlan":      "Focus on advanced programming concepts",
		"additionalNotes": "Schedule follow-up session",
		"reportIds":       []int{1, 2},
	}

	// Convert to JSON
	jsonData, err := json.Marshal(testData)
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		return
	}

	// Make POST request
	resp, err := http.Post("http://localhost:8080/mentoring-reports", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error making request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// Read response
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		fmt.Printf("Error decoding response: %v\n", err)
		return
	}

	fmt.Printf("Status Code: %d\n", resp.StatusCode)
	fmt.Printf("Response: %+v\n", result)
}