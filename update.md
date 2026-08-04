Saya ingin melakukan perubahan arsitektur dan fitur pada project AI HR Recruitment saya berdasarkan hasil diskusi dengan mentor.

====================================================
ATURAN PENGERJAAN
====================================================

JANGAN langsung menulis kode.

Kerjakan dengan urutan berikut:

1. Analisis struktur project yang sudah ada.
2. Identifikasi file, service, component, route, API, database, dan flow yang perlu diubah.
3. Jelaskan rencana implementasi secara rinci.
4. Setelah rencana disetujui secara logis, lakukan implementasi secara bertahap.
5. Pada setiap tahap implementasi, jelaskan:
   - file yang diubah
   - alasan perubahan
   - dampaknya terhadap project
6. Jangan merusak fitur yang sudah berjalan.
7. Pertahankan backward compatibility selama memungkinkan.

====================================================
PERUBAHAN KONSEP APLIKASI
====================================================

Sebelumnya aplikasi mendukung analisis banyak CV terhadap banyak role sekaligus.

Konsep tersebut DIHAPUS.

Sekarang aplikasi hanya memiliki DUA FITUR UTAMA.

====================================================
FITUR 1
Candidate Analysis
(Analisis Kandidat Individu)
====================================================

Input

- Upload 1 CV.
- Sistem memiliki daftar role yang tersedia.
- CV dibandingkan terhadap seluruh role (atau seluruh role aktif dalam sistem).

Output

- Candidate Summary
- Persentase kecocokan terhadap setiap role
- Ranking role berdasarkan kecocokan
- Best Fit Role
- Strength
- Weakness
- Skill Gap
- Alasan mengapa kandidat cocok atau tidak cocok untuk setiap role

Interview Question TIDAK dibuat otomatis.

Tambahkan tombol:

"Generate Interview Questions"

Ketika tombol ditekan:

- Generate 10 pertanyaan interview.
- Pertanyaan dibuat berdasarkan:
  - kandidat tersebut
  - role yang dipilih user
- Generate dilakukan secara on-demand agar menghemat waktu inferensi, biaya, dan token.

====================================================
FITUR 2
Role Analysis
(Role-Based Candidate Ranking)
====================================================

Input

- User memilih SATU role.
- User mengupload banyak CV.

Output

- Ranking kandidat
- Fit Score
- Candidate Summary
- Strength
- Weakness
- Skill Gap
- Alasan ranking

TIDAK ADA interview question pada fitur ini.

Jangan lagi mendukung analisis banyak role sekaligus pada proses ranking kandidat.

====================================================
PERUBAHAN USER INTERFACE
====================================================

Pisahkan aplikasi menjadi dua menu utama.

1.
Candidate Analysis

2.
Role Analysis

Flow lama yang melakukan analisis banyak role sekaligus harus dihapus atau di-refactor sesuai konsep baru.

====================================================
SOFTWARE ENGINEERING BEST PRACTICES
====================================================

Seluruh implementasi harus mengikuti best practice software engineering.

Gunakan prinsip:

- Separation of Concerns
- Single Responsibility Principle
- Clean Architecture
- Modular Architecture
- Dependency Injection (jika sesuai framework)
- Configuration Driven
- Clean Code
- Easy to Extend
- Easy to Maintain
- Easy to Test

Business logic TIDAK BOLEH berada pada:

- UI
- React Component
- Controller
- API Route

Business logic harus berada pada service.

====================================================
AI ARCHITECTURE
====================================================

Project menggunakan OpenRouter.

Jangan mengakses OpenRouter langsung dari controller, page, component, ataupun service.

Buat abstraction layer.

Contoh arsitektur:

AIProvider Interface

↓

LingProvider

↓

NemotronProvider

↓

Future Providers

Semua service hanya memanggil:

AIProvider.generate(...)

agar model dapat diganti tanpa mengubah business logic.

====================================================
MODEL CONFIGURATION
====================================================

Semua model harus berasal dari configuration atau environment.

Contoh:

MODEL_PROVIDER=ling

MODEL_PROVIDER=nemotron

MODEL_PROVIDER=gpt

Tidak boleh ada hardcode model di business logic.

====================================================
MODEL DEFAULT
====================================================

Gunakan Ling-3.0 Flash sebagai model default.

====================================================
EKSPERIMEN NEMOTRON
====================================================

Tambahkan dukungan untuk Nemotron.

Namun JANGAN dijadikan fallback terlebih dahulu.

Saat ini saya hanya ingin menguji:

- response time
- reasoning quality
- token usage
- stabilitas

Gunakan konfigurasi sederhana agar model mudah diganti.

Contoh:

MODEL_PROVIDER=ling

atau

MODEL_PROVIDER=nemotron

====================================================
PROMPT MANAGEMENT
====================================================

Pisahkan prompt berdasarkan fitur.

Contoh:

candidate-analysis.prompt

role-analysis.prompt

interview-question.prompt

summary.prompt

Jangan menggunakan satu prompt besar untuk seluruh aplikasi.

Prompt harus reusable.

====================================================
SERVICE ARCHITECTURE
====================================================

Pisahkan business logic menjadi service.

Contoh:

CandidateAnalysisService

RoleAnalysisService

InterviewQuestionService

PromptBuilder

RoleRepository

CandidateRepository

AIProvider

Business logic tidak boleh bercampur dengan UI.

====================================================
BENCHMARK LOGGING
====================================================

Tambahkan benchmark internal untuk setiap request AI.

Catat informasi berikut:

- request_id
- timestamp
- feature
- prompt_name
- provider
- model
- input tokens
- output tokens
- total tokens
- response time (ms)
- success / failed
- error message (jika ada)

Jika OpenRouter mengembalikan metadata tambahan,
simpan juga metadata tersebut.

====================================================
BENCHMARK STORAGE
====================================================

Simpan benchmark dalam format yang mudah dianalisis.

Contoh:

logs/ai_benchmark.jsonl

atau

database table:

ai_benchmark_logs

Setiap request menghasilkan satu record.

Benchmark TIDAK ditampilkan kepada user.

Benchmark hanya digunakan oleh developer.

====================================================
FUTURE MODEL COMPARISON
====================================================

Pastikan benchmark dapat digunakan untuk membandingkan model yang berbeda.

Contoh:

Ling

vs

Nemotron

vs

GPT

vs

Claude

tanpa mengubah kode benchmark.

====================================================
ERROR HANDLING
====================================================

Jika request AI gagal:

- Tangkap exception.
- Simpan log error.
- Jangan membuat aplikasi crash.
- Berikan pesan error yang jelas kepada user.

====================================================
TESTABILITY
====================================================

Desain AIProvider agar mudah di-mock pada unit testing.

Business logic tidak boleh bergantung langsung pada OpenRouter SDK.

====================================================
IMPLEMENTATION STYLE
====================================================

Lakukan implementasi secara bertahap.

Untuk setiap tahap:

1. Jelaskan perubahan.
2. Jelaskan alasan perubahan.
3. Jelaskan file yang diubah.
4. Baru implementasikan.

Hindari refactor besar yang tidak diperlukan.

Selalu menjaga kode tetap modular, mudah dipahami, dan mudah dikembangkan.

====================================================
TARGET HASIL
====================================================

Setelah seluruh perubahan selesai, aplikasi memiliki dua workflow utama:

Workflow 1

Candidate Analysis

Upload 1 CV

↓

Analisis terhadap seluruh role

↓

Candidate Summary

↓

Fit Score setiap role

↓

Strength

↓

Weakness

↓

Skill Gap

↓

Best Fit Role

↓

(Tombol)

Generate Interview Questions

↓

Generate 10 pertanyaan interview khusus untuk kandidat dan role yang dipilih.

----------------------------------------------------

Workflow 2

Role Analysis

Pilih 1 Role

↓

Upload banyak CV

↓

Analisis seluruh kandidat terhadap role tersebut

↓

Fit Score

↓

Strength

↓

Weakness

↓

Ranking Kandidat

↓

Rekomendasi kandidat terbaik

Tanpa interview question.

====================================================
TUJUAN
====================================================

Refactor project agar menjadi lebih modular, scalable, maintainable, dan siap untuk pengembangan jangka panjang.

Prioritaskan kualitas arsitektur dibandingkan kecepatan implementasi.

Jika terdapat keputusan desain yang ambigu, jelaskan trade-off setiap opsi dan pilih solusi yang paling sesuai dengan best practice software engineering modern.