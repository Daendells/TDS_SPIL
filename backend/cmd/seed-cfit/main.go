package main

import (
	"backend/internal/config"
	"backend/internal/models/domain"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	defer db.Exec("SET FOREIGN_KEY_CHECKS = 1")

	log.Info("Starting CFIT assessment seeding...")

	if err := seedCFIT(db); err != nil {
		log.Fatalf("Failed to seed CFIT: %v", err)
	}

	log.Info("CFIT seeding completed successfully!")
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial HTML content for each CFIT subtest
// ─────────────────────────────────────────────────────────────────────────────

const tutorialCFIT1 = `<h2>CFIT Bagian I – Deret Gambar</h2>
<p>Pada bagian ini Anda akan mengerjakan <strong>13 soal deret gambar (series)</strong>.</p>
<h3>Petunjuk Pengerjaan</h3>
<ul>
  <li>Setiap soal menampilkan deretan gambar yang mengikuti pola tertentu.</li>
  <li>Temukan gambar yang <strong>paling tepat</strong> untuk melengkapi deret tersebut.</li>
  <li>Pilih <strong>satu jawaban</strong> dari pilihan yang tersedia.</li>
  <li>Waktu pengerjaan: <strong>3 menit</strong>.</li>
</ul>
<h3>Tips</h3>
<p>Perhatikan perubahan bentuk, ukuran, jumlah elemen, atau arah rotasi pada setiap langkah deret. Pola yang sama akan berlanjut ke gambar berikutnya.</p>
<p><em>Kerjakan dengan cepat dan cermat. Jika ragu, lanjutkan ke soal berikutnya dan kembali jika waktu masih ada.</em></p>`

const tutorialCFIT2 = `<h2>CFIT Bagian II – Klasifikasi</h2>
<p>Pada bagian ini Anda akan mengerjakan <strong>14 soal klasifikasi gambar</strong>.</p>
<h3>Petunjuk Pengerjaan</h3>
<ul>
  <li>Setiap soal menampilkan lima gambar (a, b, c, d, e).</li>
  <li>Empat gambar memiliki kesamaan atau ciri tertentu, satu gambar <strong>berbeda / tidak sekelompok</strong>.</li>
  <li>Pilih gambar yang <strong>tidak termasuk dalam kelompok</strong> gambar lainnya.</li>
  <li>Waktu pengerjaan: <strong>4 menit 30 detik</strong>.</li>
</ul>
<h3>Tips</h3>
<p>Perhatikan kesamaan bentuk, ukuran, jumlah sisi, pola arsiran, atau karakteristik visual lainnya yang dimiliki oleh empat gambar. Gambar yang tidak memiliki kesamaan tersebut adalah jawaban yang benar.</p>
<p><em>Kelompokkan gambar berdasarkan logika visual, bukan hanya penampilan permukaan.</em></p>`

const tutorialCFIT3 = `<h2>CFIT Bagian III – Matriks</h2>
<p>Pada bagian ini Anda akan mengerjakan <strong>13 soal matriks gambar</strong>.</p>
<h3>Petunjuk Pengerjaan</h3>
<ul>
  <li>Setiap soal menampilkan matriks gambar berukuran 3×3 dengan satu posisi kosong (tanda tanya).</li>
  <li>Identifikasi pola yang berlaku pada baris dan kolom dalam matriks.</li>
  <li>Pilih <strong>satu jawaban</strong> yang paling tepat untuk mengisi posisi kosong tersebut.</li>
  <li>Waktu pengerjaan: <strong>5 menit</strong>.</li>
</ul>
<h3>Tips</h3>
<p>Periksa pola secara horizontal (kiri→kanan) dan vertikal (atas→bawah). Pola yang konsisten di seluruh baris dan kolom akan menentukan gambar yang tepat untuk posisi kosong.</p>
<p><em>Perhatikan rotasi, penambahan/pengurangan elemen, atau perubahan warna/ukuran secara sistematis.</em></p>`

const tutorialCFIT4 = `<h2>CFIT Bagian IV – Kondisi / Topologi</h2>
<p>Pada bagian ini Anda akan mengerjakan <strong>10 soal kondisi topologi</strong>.</p>
<h3>Petunjuk Pengerjaan</h3>
<ul>
  <li>Setiap soal menampilkan gambar dengan titik-titik yang berada di dalam, di luar, atau di tepi suatu bidang.</li>
  <li>Perhatikan <strong>kondisi spasial</strong> (posisi relatif) dari masing-masing titik.</li>
  <li>Pilih gambar lain yang memiliki <strong>konfigurasi titik yang sama</strong> secara kondisi topologi.</li>
  <li>Waktu pengerjaan: <strong>3 menit</strong>.</li>
</ul>
<h3>Tips</h3>
<p>Fokus pada apakah setiap titik berada di <em>dalam</em>, di <em>luar</em>, atau di <em>tepi</em> bidang—bukan pada ukuran atau bentuk bidangnya. Dua gambar yang secara topologi setara akan memiliki konfigurasi titik yang identik.</p>
<p><em>Abaikan perbedaan bentuk atau ukuran bidang; hanya posisi relatif titik yang penting.</em></p>`

// ─────────────────────────────────────────────────────────────────────────────
// Seeder
// ─────────────────────────────────────────────────────────────────────────────

func seedCFIT(db *gorm.DB) error {
	// ── Step 1: Assessment Type ──────────────────────────────────────────────
	var cfitType domain.AssessmentType
	if err := db.Where("assessment_type_name = ?", "CFIT").First(&cfitType).Error; err == nil {
		fmt.Printf("AssessmentType 'CFIT' sudah ada (ID: %d), melewati pembuatan.\n", cfitType.ID)
	} else {
		var maxID uint64
		db.Raw("SELECT COALESCE(MAX(id), 0) FROM assessment_types").Scan(&maxID)

		startTime := time.Date(2025, 1, 1, 8, 0, 0, 0, time.UTC)
		endTime := time.Date(2025, 12, 31, 17, 0, 0, 0, time.UTC)
		maxAttempts := 1

		cfitType = domain.AssessmentType{
			ID:                 maxID + 1,
			AssessmentTypeName: "CFIT",
			StartTime:          &startTime,
			EndTime:            &endTime,
			MaxAttempts:        &maxAttempts,
			ScoringType:        "cfit",
			UsePercentage:      false,
		}
		if err := db.Create(&cfitType).Error; err != nil {
			return fmt.Errorf("gagal membuat AssessmentType CFIT: %w", err)
		}
		fmt.Printf("AssessmentType 'CFIT' berhasil dibuat (ID: %d).\n", cfitType.ID)
	}

	// ── Step 2: Assessments ──────────────────────────────────────────────────
	type assessmentDef struct {
		role          string
		name          string
		timerMinutes  float64
		tutTimer      float64
		questionCount int
		questionType  string
		tutorial      string
	}

	defs := []assessmentDef{
		{
			role:          "cfit_1",
			name:          "CFIT - Deret",
			timerMinutes:  3.0,
			tutTimer:      2.0,
			questionCount: 13,
			questionType:  "single_choice",
			tutorial:      tutorialCFIT1,
		},
		{
			role:          "cfit_2",
			name:          "CFIT - Klasifikasi",
			timerMinutes:  4.5,
			tutTimer:      2.0,
			questionCount: 14,
			questionType:  "multiple_choice",
			tutorial:      tutorialCFIT2,
		},
		{
			role:          "cfit_3",
			name:          "CFIT - Matriks",
			timerMinutes:  5.0,
			tutTimer:      2.0,
			questionCount: 13,
			questionType:  "single_choice",
			tutorial:      tutorialCFIT3,
		},
		{
			role:          "cfit_4",
			name:          "CFIT - Kondisi",
			timerMinutes:  3.0,
			tutTimer:      2.0,
			questionCount: 10,
			questionType:  "single_choice",
			tutorial:      tutorialCFIT4,
		},
	}

	for _, def := range defs {
		var existing domain.Assessment
		err := db.Where("role = ?", def.role).First(&existing).Error

		var assessmentID uint64

		if err == nil {
			fmt.Printf("Assessment '%s' sudah ada (ID: %d), melewati pembuatan.\n", def.role, existing.AssessmentID)
			assessmentID = existing.AssessmentID
		} else {
			timer := def.timerMinutes
			tutTimer := def.tutTimer
			tutorial := def.tutorial

			a := domain.Assessment{
				AssessTypeID:         &cfitType.ID,
				Role:                 def.role,
				AssessmentName:       def.name,
				UsingTimer:           true,
				TimerLimitMinutes:    &timer,
				TutorialContent:      &tutorial,
				TutorialTimerMinutes: &tutTimer,
			}
			if err := db.Create(&a).Error; err != nil {
				return fmt.Errorf("gagal membuat assessment '%s': %w", def.role, err)
			}
			assessmentID = a.AssessmentID
			fmt.Printf("Assessment '%s' berhasil dibuat (ID: %d).\n", def.role, assessmentID)
		}

		// ── Step 3: Questions & Options ──────────────────────────────────────
		if err := seedQuestions(db, assessmentID, def.role, def.name, def.questionCount, def.questionType); err != nil {
			return err
		}
	}

	return nil
}

func seedQuestions(db *gorm.DB, assessmentID uint64, role, name string, count int, qType string) error {
	var existing int64
	db.Model(&domain.Question{}).Where("assessment_id = ?", assessmentID).Count(&existing)
	if existing > 0 {
		fmt.Printf("  Soal untuk '%s' sudah ada (%d soal), melewati.\n", role, existing)
		return nil
	}

	for i := 1; i <= count; i++ {
		q := domain.Question{
			Role:         role,
			QuestionText: fmt.Sprintf("[Placeholder] %s No. %d — Lihat gambar dan pilih jawaban yang paling tepat.", name, i),
			AssessmentID: &assessmentID,
			QuestionType: qType,
		}
		if err := db.Create(&q).Error; err != nil {
			return fmt.Errorf("gagal membuat soal %d untuk '%s': %w", i, role, err)
		}

		if err := seedOptions(db, q.QuestionID, qType); err != nil {
			return fmt.Errorf("gagal membuat pilihan untuk soal %d ('%s'): %w", q.QuestionID, role, err)
		}
	}

	fmt.Printf("  %d soal berhasil dibuat untuk '%s'.\n", count, role)
	return nil
}

func seedOptions(db *gorm.DB, questionID int, qType string) error {
	var letters []string
	if qType == "multiple_choice" {
		// Classification subtest: 5 options (a–e)
		letters = []string{"a", "b", "c", "d", "e"}
	} else {
		// Series / Matrices / Conditions: 4 options (a–d)
		letters = []string{"a", "b", "c", "d"}
	}

	for i, letter := range letters {
		score := 0
		if i == 0 {
			// Option "a" = correct placeholder (100 points)
			// Replace with actual correct answer after uploading question images.
			score = 100
		}
		opt := domain.Option{
			QuestionID:   questionID,
			OptionLetter: letter,
			OptionText:   fmt.Sprintf("Pilihan %s", strings.ToUpper(letter)),
			Score:        score,
			IsImage:      0,
		}
		if err := db.Create(&opt).Error; err != nil {
			return err
		}
	}
	return nil
}
