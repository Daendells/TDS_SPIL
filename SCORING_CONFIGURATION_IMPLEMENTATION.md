# Quiz Scoring Configuration Implementation

## Overview

Implementasi sistem konfigurasi scoring yang fleksibel untuk quiz assessment. Admin dapat mengkonfigurasi bagaimana score dihitung untuk setiap assessment type.

## Features

### 1. Scoring Types

- **Default**: Nilai persentase (nilai benar / total nilai keseluruhan) × 100
- **Custom**: Menggunakan rumus matematik yang dapat dikonfigurasi

### 2. Score Output Options

- **Percentage**: Output dalam bentuk persentase (0-100)
- **Raw Score**: Output dalam bentuk score mentah

### 3. Custom Formula Support

Mendukung operasi matematik:

- Penjumlahan (+)
- Pengurangan (-)
- Perkalian (\*)
- Pembagian (/)
- Kurung ()
- Variabel: `score` (total score) dan `max_score` (maksimum score)

## Database Schema Changes

### AssessmentType Table

```sql
ALTER TABLE assessment_types ADD COLUMN scoring_type VARCHAR(50) DEFAULT 'default' NOT NULL;
ALTER TABLE assessment_types ADD COLUMN scoring_formula TEXT;
ALTER TABLE assessment_types ADD COLUMN use_percentage BOOLEAN DEFAULT true;
```

## API Endpoints

### 1. Get Scoring Configuration

```
GET /api/admin/assessment-types/{assessmentTypeId}/scoring-config
```

**Response:**

```json
{
  "code": 200,
  "status": "Success",
  "data": {
    "assessmentTypeId": 1,
    "assessmentTypeName": "Technical Assessment",
    "scoringType": "custom",
    "scoringFormula": "(score / max_score) * 100 + 10",
    "usePercentage": true
  }
}
```

### 2. Update Scoring Configuration

```
PUT /api/admin/assessment-types/scoring-config
```

**Request Body:**

```json
{
  "assessmentTypeId": 1,
  "scoringType": "custom",
  "scoringFormula": "(score / max_score) * 90 + 10",
  "usePercentage": true
}
```

**Response:**

```json
{
  "code": 200,
  "status": "Scoring configuration updated successfully",
  "data": {
    "assessmentTypeId": 1,
    "assessmentTypeName": "Technical Assessment",
    "scoringType": "custom",
    "scoringFormula": "(score / max_score) * 90 + 10",
    "usePercentage": true
  }
}
```

### 3. Validate Formula

```
POST /api/admin/assessment-types/validate-formula
```

**Request Body:**

```json
{
  "formula": "(score / max_score) * 90 + 10",
  "testScore": 80,
  "testMaxScore": 100
}
```

**Response:**

```json
{
  "code": 200,
  "status": "Formula validation completed",
  "data": {
    "isValid": true,
    "result": 82.0
  }
}
```

## Formula Examples

### 1. Default Percentage

```
Formula: (score / max_score) * 100
Example: (80 / 100) * 100 = 80%
```

### 2. Curved Scoring

```
Formula: (score / max_score) * 90 + 10
Example: (80 / 100) * 90 + 10 = 82%
```

### 3. Square Root Curve

```
Formula: ((score / max_score) * (score / max_score)) * 100
Example: ((80 / 100) * (80 / 100)) * 100 = 64%
```

### 4. Bonus Points

```
Formula: (score / max_score) * 100 + 5
Example: (80 / 100) * 100 + 5 = 85%
```

### 5. Penalty for Wrong Answers

```
Formula: (score / max_score) * 95
Example: (80 / 100) * 95 = 76%
```

## Implementation Details

### Backend Changes

1. **Domain Model**: Added scoring configuration fields to `AssessmentType`
2. **Web Models**: Created request/response models for scoring configuration
3. **Controller**: Created `ScoringConfigController` for admin management
4. **Service**: Updated `QuizService` to use scoring configuration
5. **Formula Parser**: Safe mathematical expression evaluation

### Score Calculation Flow

```
Quiz Submit → Get AssessmentType Config → Apply Formula → Store in ReportScore
```

### Safety Features

1. **Formula Validation**: Prevents unsafe expressions
2. **Error Fallback**: Falls back to default calculation if formula fails
3. **Division by Zero**: Protected against division by zero
4. **Input Sanitization**: Only allows mathematical expressions

## Usage Examples

### Admin Configuration

```javascript
// Set custom scoring for technical assessment
await api.put("/api/admin/assessment-types/scoring-config", {
  assessmentTypeId: 1,
  scoringType: "custom",
  scoringFormula: "(score / max_score) * 90 + 10",
  usePercentage: true,
});

// Validate formula before applying
const validation = await api.post(
  "/api/admin/assessment-types/validate-formula",
  {
    formula: "(score / max_score) * 90 + 10",
    testScore: 80,
    testMaxScore: 100,
  },
);
```

### Score Calculation Results

```
Original Score: 80/100

Default Scoring:
- Formula: (score / max_score) * 100
- Result: 80%

Custom Scoring with Curve:
- Formula: (score / max_score) * 90 + 10
- Result: 82%

Raw Score Output:
- usePercentage: false
- Result: 80 (raw score)
```

## Frontend Integration

### Assessment Type Manager

Add scoring configuration section:

```typescript
interface ScoringConfig {
  scoringType: "default" | "custom";
  scoringFormula?: string;
  usePercentage: boolean;
}

// Component for admin to configure scoring
function ScoringConfigForm({ assessmentTypeId }: Props) {
  const [config, setConfig] = useState<ScoringConfig>();

  const validateFormula = async (formula: string) => {
    const response = await api.post(
      "/api/admin/assessment-types/validate-formula",
      {
        formula,
        testScore: 80,
        testMaxScore: 100,
      },
    );
    return response.data.data;
  };

  // ... implementation
}
```

## Migration Script

```sql
-- Add scoring configuration columns
ALTER TABLE assessment_types
ADD COLUMN scoring_type VARCHAR(50) DEFAULT 'default' NOT NULL,
ADD COLUMN scoring_formula TEXT,
ADD COLUMN use_percentage BOOLEAN DEFAULT true;

-- Set default values for existing records
UPDATE assessment_types
SET scoring_type = 'default', use_percentage = true
WHERE scoring_type IS NULL;
```

## Testing

### Formula Validation Tests

```go
func TestFormulaValidation(t *testing.T) {
    tests := []struct {
        formula string
        score   float64
        maxScore float64
        expected float64
        shouldErr bool
    }{
        {"(score / max_score) * 100", 80, 100, 80.0, false},
        {"(score / max_score) * 90 + 10", 80, 100, 82.0, false},
        {"score / 0", 80, 100, 0, true}, // Division by zero
    }

    for _, test := range tests {
        result, err := service.ValidateFormula(test.formula, test.score, test.maxScore)
        // ... assertions
    }
}
```

### Integration Tests

- Test default scoring calculation
- Test custom formula scoring calculation
- Test formula validation endpoint
- Test scoring configuration CRUD operations
