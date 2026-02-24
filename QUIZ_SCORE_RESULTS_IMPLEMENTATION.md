# Quiz Report Scores Implementation

## Overview
Implementasi untuk mengupdate tabel `report_scores` ketika pengguna melakukan submit quiz melalui endpoint `/api/quiz/submit`.

## Changes Made

### Backend Changes

#### 1. Modified `QuizService.SubmitQuiz()` function in `backend/internal/services/quiz_service.go`

**Added Features:**
- Database transaction untuk memastikan atomicity
- Logic untuk membuat/mencari `Report` record untuk seaman
- Logic untuk membuat/mengupdate `ReportScore` record
- Score update policy (mengambil score tertinggi jika ada multiple attempts)

**New Helper Functions:**
1. `createReportScores()` - Creates or updates report scores for quiz results

#### 2. Database Flow
```
Quiz Submit → QuizAttempt → UserAnswers → Report → ReportScore (per assessment type)
```

### Implementation Details

#### Transaction Management
- Menggunakan database transaction untuk memastikan atomicity
- Rollback jika ada error dalam proses create/update ReportScore
- Commit hanya jika semua operasi berhasil

#### Report and ReportScore Logic
- Find existing Report berdasarkan `seaman_code` atau `seafarer_code`
- Create basic Report record jika belum ada
- Find existing ReportScore berdasarkan `report_id` dan `assessment_type_id`
- Create new ReportScore jika belum ada
- Update ReportScore dengan score tertinggi jika sudah ada (mengambil nilai terbaik)

#### Error Handling
- Handle case ketika Report belum ada (create new)
- Handle case ketika ReportScore belum ada (create new)
- Transaction rollback pada error
- Proper error return untuk debugging

### Database Schema Impact

#### Tables Affected
1. `quiz_attempts` - Existing functionality maintained
2. `user_answers` - Existing functionality maintained  
3. `reports` - **RECORD CREATED/FOUND for seaman**
4. `report_scores` - **RECORD CREATED/UPDATED per assessment type**

#### Data Flow
```
SeamanCode submits quiz
└── QuizAttempt created (total score)
    └── UserAnswers created (per question)
        └── Report found/created (seaman profile)
            └── ReportScore created/updated (per assessment type with total score)
```

### Benefits

1. **Centralized Scoring**: Score tersimpan di report_scores untuk tracking per assessment type
2. **Historical Data**: Tracking best performance per assessment type
3. **Reporting Integration**: Langsung terintegrasi dengan sistem report yang ada
4. **Performance Tracking**: Monitor improvement per assessment type
5. **Score Policy**: Mengambil score tertinggi untuk fairness

### Future Enhancements

#### Frontend Integration (Optional)
- Add assessment type score display in user profile
- Add historical performance charts per assessment type
- Add comparison with other users or standards

#### API Response Enhancement (Optional)
```typescript
export type QuizAttemptDetailResponse = {
  // ... existing fields
  reportScore?: {
    reportId: number;
    assessmentTypeId: number;
    score: number;
    isNewBestScore: boolean;
  };
}
```

### Testing

#### Backend Testing
- Unit test for `calculateScoresByAspect()`
- Integration test for full submit flow
- Transaction rollback testing
- Edge cases (questions without aspects)

#### API Testing  
- Submit quiz with questions having different aspects
- Verify `score_results` table populated correctly
- Verify transaction atomicity

### Configuration

No additional configuration required. The implementation:
- Uses existing database connections
- Leverages existing GORM models
- Maintains backward compatibility
- No breaking changes to existing API

## Usage

The implementation is automatically triggered when:
1. User submits quiz via `/api/quiz/submit`
2. Questions have valid `aspect_id` 
3. Assessment mapping is available

No frontend changes required for basic functionality.