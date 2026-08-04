# 🏗️ TDS (Talent Development System) — Flow Diagram

Sistem manajemen talent development untuk evaluasi dan penilaian crew kapal.

> [!NOTE]
> Tech Stack: **Go (Gin)** backend · **Next.js 16 / React 19** frontend · **MySQL 8.0** · Docker

---

## 1. Arsitektur Sistem (System Architecture)

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer"]
        BROWSER["Browser / User"]
    end

    subgraph FRONTEND["⚛️ Frontend — Next.js 16 :3000/:3001"]
        FE_AUTH["(auth) — Login / SSO"]
        FE_DASH["dashboard"]
        FE_ADMIN["admin-panel"]
        FE_ASSESS["assessment-manager"]
        FE_ASSESS_TYPE["assessment-type-manager"]
        FE_ASSESS_RESULT["assessment-results"]
        FE_CREW["crew-evaluation-system"]
        FE_QUIZ["quiz / quiz-history"]
        FE_ASSIGN["assignments"]
        FE_BATCH["batch-control"]
        FE_MASTER["master-report"]
        FE_NEW_REC["new-recruiter / report"]
        FE_MENTOR["report-mentoring"]
        FE_VALUE["value-assessment"]
    end

    subgraph BACKEND["🐹 Backend — Go Gin :8080/:8081"]
        BE_ROUTER["Router / Middleware"]
        subgraph CONTROLLERS["Controllers"]
            C_USER["UserController"]
            C_ASSESS["AssessmentController"]
            C_ASSESS_TYPE["AssessmentTypeController"]
            C_ASSESS_RESULT["AssessmentResultController"]
            C_QUIZ["QuizController"]
            C_SEAFARER["SeafarerAssessmentController"]
            C_REPORT["ReportController"]
            C_MASTER["MasterController"]
            C_TRAINING["TrainingController + LLM Gen"]
            C_TRAINING_PLAN["TrainingPlanController"]
            C_MENTORING["MentoringReportController"]
            C_COACHING["CoachingReportController"]
            C_ASSIGN["AssignmentController"]
            C_BATCH["BatchController"]
            C_NEW_REC["NewRecruiterController"]
            C_SCORING["ScoringConfigController"]
            C_COMP["CompetencyMappingController"]
            C_IDP["IDPTrackingController"]
        end
        subgraph SERVICES["Services / Business Logic"]
            S_USER["UserService"]
            S_ASSESS["AssessmentService + ResultService"]
            S_QUIZ["QuizService"]
            S_SEAFARER["SeafarerAssessmentService"]
            S_REPORT["ReportService"]
            S_MASTER["MasterService"]
            S_TRAINING["TrainingService + TrainingPlanService"]
            S_MENTORING["MentoringReportService"]
            S_COACHING["CoachingReportService"]
            S_ASSIGN["AssignmentService"]
            S_BATCH["BatchService + SnapshotService"]
            S_NEW_REC["NewRecruiterService"]
            S_IDP["IDPCalculationService"]
            S_SCORING["ScoringConfigService (via AssessmentType)"]
            S_COMP["CompetencyMappingService"]
            S_SSO["SSOService"]
            S_GROQ["GroqLLM / Training AI Generator"]
            S_APOLLO["ApolloAPIService (External)"]
            S_NANIKA["NanikaAPIService (External)"]
            S_CRON["CronService (Auto-refresh)"]
        end
    end

    subgraph DB["🗄️ Database — MySQL 8.0 :3306"]
        T_USER["users"]
        T_REPORT["reports"]
        T_ASSESS["assessments"]
        T_ASSESS_TYPE["assessment_types"]
        T_ASSESS_RESULT["assessment_results"]
        T_QUIZ["quiz_attempts / user_answers"]
        T_SEAFARER["seafarer_assessments"]
        T_TRAINING["trainings / training_schedules"]
        T_MENTOR["mentoring_reports"]
        T_COACH["coaching_reports"]
        T_ASSIGN["assignments"]
        T_BATCH["batches / batch_report_snapshots"]
        T_NEW_REC["new_recruiters / assignments"]
        T_IDP["idp_tracking"]
        T_COMP["competency_program_mappings / competency_types"]
        T_SCORING["scoring_configs (via assessment_types)"]
    end

    subgraph EXTERNAL["🌐 External APIs"]
        EXT_SSO["SSO Provider (SAML/OAuth)"]
        EXT_GROQ["Groq AI API (llama-3.3-70b)"]
        EXT_APOLLO["Apollo API (Seaman Data)"]
        EXT_NANIKA["Nanika API"]
    end

    BROWSER -->|"HTTP Request"| FRONTEND
    FRONTEND -->|"REST API calls\n(NEXT_PUBLIC_API_ENDPOINT)"| BE_ROUTER
    BE_ROUTER --> CONTROLLERS
    CONTROLLERS --> SERVICES
    SERVICES --> DB
    SERVICES -->|"External calls"| EXTERNAL
```

---

## 2. Alur Autentikasi (Authentication Flow)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (Next.js)
    participant BE as Backend (Go)
    participant SSO as SSO Provider
    participant DB as MySQL

    Note over User,DB: === Login Biasa ===
    User->>FE: Buka halaman login
    FE->>BE: POST /auth/login {username, password}
    BE->>DB: Cek credentials users table
    DB-->>BE: User data
    BE-->>FE: JWT Token + user info
    FE->>FE: Simpan token (cookie/localStorage)
    FE-->>User: Redirect ke Dashboard

    Note over User,DB: === SSO Login ===
    User->>FE: Klik "Login dengan SSO"
    FE->>BE: GET /api/auth/sso/initiate
    BE-->>FE: Redirect URL ke SSO
    FE->>SSO: Redirect ke SSO Provider
    SSO-->>BE: GET /api/auth/sso/callback (dengan token SSO)
    BE->>DB: Cari / buat user berdasarkan SSO identity
    BE-->>FE: JWT Token
    FE-->>User: Redirect ke Dashboard

    Note over User,DB: === Protected Request ===
    User->>FE: Akses halaman protected
    FE->>BE: Request + Authorization: Bearer JWT
    BE->>BE: AuthMiddleware — validasi JWT
    alt Token valid
        BE-->>FE: Data response
    else Token invalid/expired
        BE-->>FE: 401 Unauthorized
        FE-->>User: Redirect ke Login
    end
```

---

## 3. Alur Assessment (Penilaian Crew)

```mermaid
flowchart TD
    START([Mulai Assessment]) --> A1{Siapa yang dinilai?}

    A1 -->|Crew / Seafarer| B1[Cek assignment via\nGET /api/seafarer-assessments/check-assignment/:code/:typeId]
    A1 -->|New Recruiter| B2[Cek assignment via\nGET /api/new-recruiters/check-assignment/:token/:typeId]

    B1 --> C1{Sudah di-assign\n& assessment aktif?}
    B2 --> C1

    C1 -->|Tidak| D1[❌ Tampilkan error:\nTidak ada assignment]
    C1 -->|Ya| E1[Load soal assessment\nGET /api/assessments/public/:role]

    E1 --> F1[Load questions + options\nGET /api/questions-with-options]
    F1 --> G1[User mengerjakan soal]
    G1 --> H1[Submit jawaban]

    H1 -->|Crew| I1[POST /assessment-results/submit]
    H1 -->|New Recruiter| I2[POST /api/new-recruiters/assessment-results/submit]

    I1 --> J1[AssessmentResultService:\nHitung skor, simpan ke DB]
    I2 --> J1

    J1 --> K1[Increment attempts\nPOST /seafarer-assessments/increment-attempts]
    K1 --> L1[✅ Assessment selesai\nTampilkan hasil]

    subgraph SCORING["Kalkulasi Skor"]
        SC1[Ambil ScoringConfig\nGET /api/scoring-config/:typeId]
        SC2[Terapkan formula scoring]
        SC3[Hitung final score]
        SC1 --> SC2 --> SC3
    end

    J1 --> SCORING
```

---

## 4. Alur Quiz

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Backend
    participant LLM as Groq AI (LLM)
    participant DB as MySQL

    Note over User,DB: === Generate Quiz via AI ===
    User->>FE: Buka halaman Quiz
    FE->>BE: GET /api/quiz/:assessmentTypeId
    BE->>DB: Ambil soal quiz berdasarkan assessment type
    DB-->>BE: Questions + Options
    BE-->>FE: Quiz data
    FE-->>User: Tampilkan soal quiz

    Note over User,DB: === Submit Quiz ===
    User->>FE: Submit jawaban
    FE->>BE: POST /api/quiz/submit {answers}
    BE->>DB: Simpan QuizAttempt + UserAnswers
    BE->>BE: QuizService: Kalkulasi skor
    BE-->>FE: Hasil quiz + skor
    FE-->>User: Tampilkan hasil

    Note over User,DB: === AI Training Generator ===
    User->>FE: Generate training via AI
    FE->>BE: POST /trainings/generate {params}
    BE->>LLM: Request ke Groq API (llama-3.3-70b)
    LLM-->>BE: Generated training content
    BE->>DB: Simpan hasil generate
    BE-->>FE: Training yang di-generate
    FE-->>User: Tampilkan training baru

    Note over User,DB: === Lihat Riwayat Quiz ===
    User->>FE: Buka quiz-history
    FE->>BE: GET /api/quiz/history
    BE->>DB: Ambil semua QuizAttempts by user
    DB-->>BE: List attempts
    BE-->>FE: Quiz history data
    FE-->>User: Tampilkan riwayat
```

---

## 5. Alur Report & IDP (Individual Development Plan)

```mermaid
flowchart LR
    subgraph INPUT["📥 Input Data"]
        R1[Upload Data Crew\nPOST /reports/upload]
        R2[Refresh dari Apollo API\nPOST /reports/refresh-personal-data]
        R3[Data Seaman Sitrix]
    end

    subgraph REPORT_PROCESS["⚙️ Report Processing"]
        RP1[ReportService:\nBuat / Update Report]
        RP2[Cek completion data:\n- Assessment hasil\n- Training history\n- Competency gaps]
        RP3[IDPCalculationService:\nHitung IDP score]
        RP4[IDPTrackingController:\nRefresh readiness]
    end

    subgraph OUTPUT["📤 Output"]
        O1[Master Report\nGET /api/master-reports]
        O2[Individual Report\nGET /reports/seafarer-code/:code]
        O3[Training Summary\nGET /reports/seafarer-code/:code/training-summary]
        O4[Export Excel\nGET /api/training-plan/export-excel]
        O5[Batch Snapshot\nBatch Report per periode]
    end

    subgraph EXTERNAL_SVC["🌐 Layanan Eksternal"]
        E1[Apollo API\nData seaman aktif]
        E2[Nanika API\nData tambahan]
    end

    INPUT --> REPORT_PROCESS
    R2 --> E1
    R2 --> E2
    E1 --> RP1
    E2 --> RP1
    REPORT_PROCESS --> OUTPUT
    RP1 --> RP2 --> RP3 --> RP4
    RP4 --> O1
    RP4 --> O2
```

---

## 6. Alur Training Plan

```mermaid
flowchart TD
    TP_START([Mulai Training Plan]) --> TP1[GET /api/training-plan\nAmbil rencana training]
    TP1 --> TP2{Ada competency gap?}

    TP2 -->|Ya| TP3[GET /api/training-plan/competency-mapping\nCek mapping program]
    TP2 -->|Tidak| TP_END([Selesai])

    TP3 --> TP4[POST /api/training-plan/generate-schedules\nGenerate jadwal otomatis]
    TP4 --> TP5[TrainingPlanService:\n- Hitung prioritas\n- Assign crew ke program]

    TP5 --> TP6{Perlu swap jadwal?}
    TP6 -->|Ya| TP7[PUT /api/training-plan/swap-schedules\nTukar jadwal 2 crew]
    TP6 -->|Tidak| TP8[Toggle started\nPUT /api/training-plan/toggle-started/:id]

    TP7 --> TP8
    TP8 --> TP9[Cek overdue\nGET /api/training-plan/overdue-count]
    TP9 --> TP10[Export ke Excel\nGET /api/training-plan/export-excel]
    TP10 --> TP_END
```

---

## 7. Alur Batch & Snapshot

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend (batch-control)
    participant BE as Backend
    participant DB as MySQL

    Admin->>FE: Buka Batch Control
    FE->>BE: GET /api/batches
    BE->>DB: Ambil semua batches
    DB-->>BE: List batches
    BE-->>FE: Data batches
    FE-->>Admin: Tampilkan daftar batch

    Admin->>FE: Buat batch baru
    FE->>BE: POST /api/batches {name, period, ...}
    BE->>DB: Insert batch
    BE-->>FE: Batch baru

    Admin->>FE: Assign master report ke batch
    FE->>BE: POST /api/master-reports/bulk-assign-batch
    BE->>DB: Update report_batches
    BE-->>FE: Success

    Admin->>FE: Lihat snapshot batch
    FE->>BE: GET /api/batches/:id/snapshots
    BE->>DB: Ambil batch_report_snapshots
    DB-->>BE: Snapshot data (JSON frozen state)
    BE-->>FE: Snapshot history
    FE-->>Admin: Tampilkan snapshot
```

---

## 8. Alur New Recruiter

```mermaid
flowchart TD
    NR_START([New Recruiter]) --> NR1[Admin: Tambah recruiter\nPOST /api/new-recruiters]
    NR1 --> NR2[Generate unique token untuk recruiter]
    NR2 --> NR3[Admin: Assign ke batch\nPOST /api/new-recruiters/bulk-assign-batch]
    NR3 --> NR4[Admin: Buat assignment assessment\nPOST /api/new-recruiters/assignments]

    NR4 --> NR5[Recruiter menerima link + token]
    NR5 --> NR6[Recruiter: Cek assignment\nGET /api/new-recruiters/check-assignment/:token/:typeId]

    NR6 --> NR7{Assignment valid?}
    NR7 -->|Tidak| NR8[❌ Tampilkan error]
    NR7 -->|Ya| NR9[Recruiter mengerjakan Assessment]

    NR9 --> NR10[POST /api/new-recruiters/assessment-results/submit]
    NR10 --> NR11[NewRecruiterService:\nHitung skor, simpan hasil]

    NR11 --> NR12{Ada Quiz?}
    NR12 -->|Ya| NR13[Recruiter mengerjakan Quiz\nPOST /api/new-recruiters/quiz/submit]
    NR12 -->|Tidak| NR14[Lihat laporan\nnew-recruiter-report]
    NR13 --> NR14

    NR14 --> NR_END([Selesai])
```

---

## 9. Layer Architecture Backend (Clean Architecture)

```mermaid
graph BT
    subgraph INFRA["Infrastructure Layer"]
        DB2["MySQL Database (GORM)"]
        EXT2["External APIs (Apollo, Nanika, Groq)"]
    end

    subgraph REPO["Repository Layer"]
        R["Repositories\n(CRUD abstraction per entity)"]
    end

    subgraph SVC["Service Layer (Business Logic)"]
        S["Services\n(report, master, quiz, training,\nassessment, IDP, batch, etc.)"]
    end

    subgraph CTRL["Controller Layer (HTTP Handler)"]
        C["Controllers\n(parse request, call service, return response)"]
    end

    subgraph HTTP_LAYER["HTTP Layer"]
        MW["Middleware (JWT Auth)"]
        ROUTER["Router (Gin Groups)"]
    end

    subgraph EXT_SVC["External Service Layer"]
        LLM2["LLM (Groq AI)"]
        SSO2["SSO Service"]
        APOLLO2["Apollo / Nanika API"]
    end

    DB2 --> R
    EXT2 --> EXT_SVC
    R --> S
    EXT_SVC --> S
    S --> C
    C --> ROUTER
    MW --> ROUTER
```

---

## 10. Ringkasan Endpoint API

| Grup | Endpoint Utama | Auth |
|------|---------------|------|
| **Auth** | `POST /auth/login`, `GET /api/auth/sso/initiate` | ❌ Public |
| **Users** | `GET/POST/PUT/DELETE /api/users` | ✅ JWT |
| **Reports** | `GET /reports`, `POST /reports/upload` | ❌ Public |
| **Assessments** | `GET /api/assessments`, `POST /api/assessments` | Mixed |
| **Assessment Types** | `GET/POST/PUT/DELETE /api/assessment-types` | Mixed |
| **Assessment Results** | `POST /assessment-results/submit` | ❌ Public |
| **Seafarer Assessments** | `GET/POST /api/seafarer-assessments` | Mixed |
| **Quiz** | `GET /api/quiz/:id`, `POST /api/quiz/submit` | ❌ Public |
| **Training** | `GET/POST/PUT/DELETE /trainings` | ❌ Public |
| **Training Plan** | `GET/POST /api/training-plan` | ❌ Public |
| **Mentoring Reports** | `GET/POST/PUT/DELETE /mentoring-reports` | ❌ Public |
| **Coaching Reports** | `GET/POST/PUT/DELETE /coaching-reports` | ❌ Public |
| **Master Reports** | `GET/POST/PUT/DELETE /api/master-reports` | ❌ Public |
| **Assignments** | `GET/POST /api/assignments` | ❌ Public |
| **Batches** | `GET/POST/PUT /api/batches` | ❌ Public |
| **New Recruiters** | `GET/POST /api/new-recruiters` | Mixed |
| **Competency Mapping** | `GET/POST/PUT/DELETE /api/competency-mappings` | ❌ Public |
| **IDP Tracking** | `POST /api/idp-tracking/refresh` | ❌ Public |
| **Scoring Config** | `GET/PUT /api/scoring-config/:typeId` | ❌ Public |
