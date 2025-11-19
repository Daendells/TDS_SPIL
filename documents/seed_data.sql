-- Seed Data for TDS Database
-- This file contains INSERT statements for the new database schema
-- Run this after migration: go run cmd/seed-sql/main.go

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- TRAINING DATA
-- =============================================
INSERT INTO `training` (`no`, `competency_type_id`, `lvl`, `deskripsi_perilaku`, `tools_training`, `kode`, `topik_training`) VALUES
(1, 16, 4, 'Menjadi panutan dalam bersikap terutama dalam bertanggung jawab terhadap pekerjaan, membangun sistem kerja yang mendorong kedisiplinan dan konsistensi, serta menanamkan budaya kerja yang bisa dipercaya.', 'The Trust Equation', 'M051', 'Building Trust'),
(2, 16, 4, 'Menjadi panutan dalam bersikap terutama dalam bertanggung jawab terhadap pekerjaan, membangun sistem kerja yang mendorong kedisiplinan dan konsistensi, serta menanamkan budaya kerja yang bisa dipercaya.', 'Culture of Accountability (Craig Hickman)', 'M052', 'Culture of Accountability (Advanced)'),
(3, 16, 3, 'Memastikan tugas tim berjalan sesuai rencana, menyesuaikan prioritas jika adaubahan, dan menyelesaikan persoalan secara bijak.', 'SMART Goals Setting: Achievable', 'M053', 'Setting Achievable Goals'),
(4, 16, 3, 'Memastikan tugas tim berjalan sesuai rencana, menyesuaikan prioritas jika ada perubahan, dan menyelesaikan persoalan secara bijak.', 'Agile Execution Mindset', 'M054', 'Rapid Execution Mindset'),
(5, 16, 2, 'Mengambil tanggung jawab atas pekerjaan tim, memperbaiki kesalahan secara aktif, menjaga konsistensi hasil kerja, dan mendorong rekan untuk bertanggung jawab.', 'The Oz Principle: Accountability Ladder', 'M055', 'Cultivating Accountability in Workplace'),
(6, 16, 2, 'Mengambil tanggung jawab atas pekerjaan tim, memperbaiki kesalahan secara aktif, menjaga konsistensi hasil kerja, dan mendorong rekan untuk bertanggung jawab.', 'GRPI Model (Goals, Roles, Processes, Interpersonal Relationships)', 'M056', 'Effective and Connected Teams'),
(7, 16, 1, 'Menyelesaikan tugas sesuai arahan, menjaga komitmen kerja, mengakui kesalahan pribadi, dan berusaha menyelesaikan masalah secara mandiri.', 'Circle of Control vs. Circle of Concern (7 Habit of Highly Effective People)', 'M057', 'Mastering Control and Focus'),
(8, 16, 1, 'Menyelesaikan tugas sesuai arahan, menjaga komitmen kerja, mengakui kesalahan pribadi, dan berusaha menyelesaikan masalah secara mandiri.', 'Time Management', 'M058', 'Task Prioritization'),
(9, 15, 4, 'Mendorong diri sendiri dan orang lain untuk mencapai hasil terbaik.', 'Driving High-Performance Culture', 'M059', 'Building High-Performance Culture'),
(10, 15, 4, 'Mendorong diri sendiri dan orang lain untuk mencapai hasil terbaik.', 'OKR Framework', 'M060', 'Mastering OKRs'),
(11, 15, 3, 'Terus-menerus berusaha mencapai target sulit dengan antusiasme dan menjadikan target sebagai tantangan pribadi.', 'Supervisory Growth Mindset', 'M061', 'Adaptive Leadership'),
(12, 15, 3, 'Terus-menerus berusaha mencapai target sulit dengan antusiasme dan menjadikan target sebagai tantangan pribadi.', '4DX – Four Disciplines of Execution', 'M062', 'Impactful Execution'),
(13, 15, 2, 'Menetapkan target mingguan yang menantang dan bekerja keras untuk memenuhi atau melebihi target yang diharapkan.', 'Kaizen Mindset 101', 'M063', 'Kaizen for Workplace Innovation'),
(14, 15, 2, 'Menetapkan target mingguan yang menantang dan bekerja keras untuk memenuhi atau melebihi target yang diharapkan.', 'SMART Goals Setting', 'M064', 'Goal Setting for Success'),
(15, 15, 1, 'Menetapkan dan menerima target harian serta memantau kemajuan pencapaian tugas.', 'Time Management', 'M065', 'Maximizing Results with Time Management'),
(16, 15, 1, 'Menetapkan dan menerima target harian serta memantau kemajuan pencapaian tugas.', 'Checklists & Work Documentation Essentials', 'M066', 'Building Consistent for Positive Work Habits'),
(17, 22, 4, 'Mengidentifikasi dan memanfaatkan peluang untuk meningkatkan efisiensi kerja melalui koordinasi lintas unit kerja.', 'SWOT Analysis for Strategic Thinking', 'M067', 'Strategic SWOT Analysis'),
(18, 22, 4, 'Mengidentifikasi dan memanfaatkan peluang untuk meningkatkan efisiensi kerja melalui koordinasi lintas unit kerja.', 'Strategic Risk Mapping', 'M068', 'Risk Mapping Strategy'),
(19, 22, 3, 'Mengelola penggunaan peralatan dan fasilitas antar unit serta menjadi penghubung dalam menyelesaikan hambatan.', 'T.H.I.N.K. Model', 'M069', 'Team Synergy'),
(20, 22, 3, 'Mengelola penggunaan peralatan dan fasilitas antar unit serta menjadi penghubung dalam menyelesaikan hambatan.', 'SMART Goals Setting', 'M070', 'Effective Goal Setting'),
(21, 22, 2, 'Mampu berkomunikasi dan berkoordinasi dengan unit lain untuk mengatasi kendala operasional rutin.', 'Shannon-Weaver Model of Communication', 'M071', 'Effective Communication for Insight'),
(22, 22, 2, 'Mampu berkomunikasi dan berkoordinasi dengan unit lain untuk mengatasi kendala operasional rutin.', 'Assertive Communication Ladder', 'M072', 'Basic Assertive Communication'),
(23, 22, 1, 'Memahami kebutuhan peralatan, material, dan informasi yang diperlukan untuk menyelesaikan tugas harian.', 'Checklists & Work Documentation Essentials', 'M073', 'Work Documentation and Checklists'),
(24, 22, 1, 'Memahami kebutuhan peralatan, material, dan informasi yang diperlukan untuk menyelesaikan tugas harian.', 'Input–Process–Output (IPO) Thinking', 'M074', 'Systematic Thinking for Work Efficiency'),
(25, 9, 4, 'Menjadi role model komunikasi yang baik, membantu menyelesaikan kesalahpahaman, dan mendorong kerja sama.', 'Nonviolent Communication', 'M075', 'Advanced Effective Communication'),
(26, 9, 4, 'Menjadi role model komunikasi yang baik, membantu menyelesaikan kesalahpahaman, dan mendorong kerja sama.', 'Advanced Communication Strategy', 'M076', 'Communication Strategy for Cross-Department'),
(27, 9, 3, 'Memberi masukan yang membangun dan menggabungkan informasi dari berbagai sumber.', 'SBI Model (Situation–Behavior–Impact)', 'M077', 'Supervisory 360° Communication'),
(28, 9, 3, 'Memberi masukan yang membangun dan menggabungkan informasi dari berbagai sumber.', 'Sandwich Feedback for Supervisory', 'M078', 'Positive Feedback for Supervisor'),
(29, 9, 2, 'Menyampaikan informasi atau pendapat dengan jelas dan terbuka, serta menerima dan memberi masukan.', 'Assertive Communication Ladder', 'M079', 'Basic Effective Communication'),
(30, 9, 2, 'Menyampaikan informasi atau pendapat dengan jelas dan terbuka, serta menerima dan memberi masukan.', 'T.H.I.N.K. Model', 'M080', 'Cross-Department Communication'),
(31, 9, 1, 'Memahami penjelasan sederhana dan mendengarkan dengan sikap sopan.', 'Shannon-Weaver Model of Communication', 'M081', 'Basic Communication'),
(32, 9, 1, 'Memahami penjelasan sederhana dan mendengarkan dengan sikap sopan.', 'Active Listening: Hearing, Listening, Understanding, Responding, Remembering', 'M082', 'Active Listening Skills'),
(33, 18, 4, 'Merancang sistem pemantauan dan evaluasi kepatuhan prosedur.', 'Compliance, Governance, and Control Systems', 'M083', 'Advanced Compliance System'),
(34, 18, 4, 'Merancang sistem pemantauan dan evaluasi kepatuhan prosedur.', 'Root Cause Analysis: Plan-Do-Check-Action', 'M084', 'Systematic PDCA Problem Solving'),
(35, 18, 3, 'Memantau kepatuhan terhadap prosedur, mengambil tindakan korektif bila perlu.', 'Corrective Action Basics', 'M085', 'Corrective Action Essentials'),
(36, 18, 3, 'Memantau kepatuhan terhadap prosedur, mengambil tindakan korektif bila perlu.', 'Creating Operational SOP & Monitoring Tools', 'M086', 'SOP & Monitoring Tools for Supervisor'),
(37, 18, 2, 'Menjalankan pekerjaan secara konsisten sesuai prosedur, memeriksa hasil kerja.', 'Time Management', 'M087', 'Effective Time Management'),
(38, 18, 2, 'Menjalankan pekerjaan secara konsisten sesuai prosedur, memeriksa hasil kerja.', 'Systematic Thinking in Daily Work', 'M088', 'Systematic Thinking for Daily Task'),
(39, 18, 1, 'Memahami aturan dan prosedur kerja, serta melaksanakan tugas sesuai arahan.', 'Basic Knowledge of 5R: Seiso', 'M089', 'Maintaining Cleanliness at Work'),
(40, 18, 1, 'Memahami aturan dan prosedur kerja, serta melaksanakan tugas sesuai arahan.', 'Checklists & Work Documentation Essentials', 'M090', 'Consistency at Work'),
(41, 3, 4, 'Mendorong orang lain dan memberi contoh perbaikan berkelanjutan atau suatu inovasi.', 'Leading Innovation and Change', 'M091', 'Innovation Leadership'),
(42, 3, 4, 'Mendorong orang lain dan memberi contoh perbaikan berkelanjutan atau suatu inovasi.', 'Kaizen Leadership: Driving Continuous Improvement', 'M092', 'Kaizen Leadership'),
(43, 3, 3, 'Mengusulkan pengembangan cara kerja atau proses yang lebih luas.', '7 Habits of Highly Effective People : Be Proactive', 'M093', 'Proactive Mindset'),
(44, 3, 3, 'Mengusulkan pengembangan cara kerja atau proses yang lebih luas.', 'After Action Review (AAR)', 'M094', 'Action Review for Task'),
(45, 3, 2, 'Mencetuskan dan menerapkan ide-ide baru dalam lingkup pekerjaannya.', 'Growth Mindset (Carol Dweck)', 'M095', 'Developing a Growth Mindset'),
(46, 3, 2, 'Mencetuskan dan menerapkan ide-ide baru dalam lingkup pekerjaannya.', 'Kaizen Mindset 101', 'M096', 'Kaizen for Innovation'),
(47, 3, 1, 'Terbuka terhadap sudut pandang baru, aktif mencari informasi.', 'Basic Emphaty: Empathy Circle (Listening Without Fixing)', 'M097', 'Building Empathy for Continuous Improvement'),
(48, 3, 1, 'Terbuka terhadap sudut pandang baru, aktif mencari informasi.', '7 Habits of Highly Effective People: Put First Things First', 'M098', 'Effective Prioritization'),
(49, 8, 4, 'Mendorong rekan kerja untuk menjaga mutu layanan.', 'Sandwich Feedback for Supervisory', 'M099', 'Effective Feedback'),
(50, 8, 4, 'Mendorong rekan kerja untuk menjaga mutu layanan.', 'Coaching & Feedback', 'M100', 'Supervisory Coaching & Development'),
(51, 8, 3, 'Secara aktif memeriksa kualitas hasil kerja.', 'Agile Mindset', 'M101', 'Agile Service Mindset'),
(52, 8, 3, 'Secara aktif memeriksa kualitas hasil kerja.', 'Assertive Communication Ladder', 'M102', 'Assertive Communication for Supervisor'),
(53, 8, 2, 'Melaksanakan tugas dengan teliti, tepat waktu.', 'Pareto Analysis (80/20)', 'M103', 'Applying the 80/20 Principle'),
(54, 8, 2, 'Melaksanakan tugas dengan teliti, tepat waktu.', 'Eisenhower Matrix', 'M104', 'Effective Daily Prioritization'),
(55, 8, 1, 'Memahami pentingnya hasil kerja yang rapi, aman, dan sesuai prosedur.', 'Checklists & Work Documentation Essentials', 'M105', 'Effective Work Checklists'),
(56, 8, 1, 'Memahami pentingnya hasil kerja yang rapi, aman, dan sesuai prosedur.', 'Basic Knowledge of 5S: Seiton', 'M106', 'Organizing Task at Workplace'),
(57, 2, 4, 'Membuat keputusan dalam situasi kritis atau tidak pasti.', 'Strategic Risk Mapping', 'M107', 'Risk Mapping'),
(58, 2, 4, 'Membuat keputusan dalam situasi kritis atau tidak pasti.', 'OODA Loop (Observe, Orient, Decide, Act)', 'M108', 'Quick Decision Making'),
(59, 2, 3, 'Mengintegrasikan informasi dari berbagai sumber untuk membuat keputusan rumit.', 'DECIDE Model (Detect, Estimate, Choose, Identify, Do, Evaluate)', 'M109', 'Complex Decision Making'),
(60, 2, 3, 'Mengintegrasikan informasi dari berbagai sumber untuk membuat keputusan rumit.', 'PDCA Cycle (Plan–Do–Check–Act)', 'M110', 'Process Improvement'),
(61, 2, 2, 'Menimbang beberapa alternatif keputusan dengan mempertimbangkan risiko.', 'SCAN Model (Situation, Choices, Action, Next Steps)', 'M111', 'Pengambilan Keputusan Berbasis Risiko'),
(62, 2, 2, 'Menimbang beberapa alternatif keputusan dengan mempertimbangkan risiko.', 'SWOT Analysis', 'M112', 'Systematic Decision Making'),
(63, 2, 1, 'Mengambil keputusan rutin berdasarkan prosedur yang ada.', 'Routine Risk-Based Decision-Making', 'M113', 'Regularly Decision Making'),
(64, 2, 1, 'Mengambil keputusan rutin berdasarkan prosedur yang ada.', 'Basic Decision-Making Skills', 'M114', 'Basic Decision Making Skills'),
(65, 14, 4, 'Mengelola pelaksanaan tugas secara menyeluruh dengan memastikan standar kinerja terpenuhi.', 'Culture of Accountability', 'M115', 'Advanced Responsible Culture'),
(66, 14, 4, 'Mengelola pelaksanaan tugas secara menyeluruh dengan memastikan standar kinerja terpenuhi.', 'Performance Management Fundamentals', 'M116', 'Performance Coaching'),
(67, 14, 3, 'Mendelegasikan tugas berdasarkan kemampuan individu.', 'Problem Solving and Barrier Removal', 'M117', 'Problem Solving Culture'),
(68, 14, 3, 'Mendelegasikan tugas berdasarkan kemampuan individu.', 'Giving and Receiving Feedback Effectively', 'M118', 'Constructive Feedback'),
(69, 14, 2, 'Menjelaskan ekspektasi, batasan, dan tanggung jawab tugas secara spesifik.', 'Delegation Matrix (Tingkat Delegasi)', 'M119', 'Effective Task Delegation'),
(70, 14, 2, 'Menjelaskan ekspektasi, batasan, dan tanggung jawab tugas secara spesifik.', 'SMART Goals Framework', 'M120', 'Setting Clear Action Plans'),
(71, 14, 1, 'Memberikan arahan atau petunjuk kerja yang jelas dan sesuai prosedur.', 'GROW Model (Goal-Reality-Options-Way Forward)', 'M121', 'Foundations of Coaching'),
(72, 14, 1, 'Memberikan arahan atau petunjuk kerja yang jelas dan sesuai prosedur.', '7 Habits of Highly Effective People: Begin with the End in Mind', 'M122', 'Basic Effective Work Strategies'),
(73, 10, 4, 'Membaca situasi sosial dengan baik dan memilih cara komunikasi yang tepat.', 'Social Intelligence at Work', 'M123', 'Workplace Social Intelligence'),
(74, 10, 4, 'Membaca situasi sosial dengan baik dan memilih cara komunikasi yang tepat.', 'Advanced Coaching for Leaders: GROW', 'M124', 'GROW Technique for Coaching'),
(75, 10, 3, 'Memahami perasaan rekan kerja dan menyampaikan pendapat dengan cara yang tidak memicu konflik.', 'Social Styles Model', 'M125', 'Empathy in Communication'),
(76, 10, 3, 'Memahami perasaan rekan kerja dan menyampaikan pendapat dengan cara yang tidak memicu konflik.', 'Three Types of Empathy (Daniel Goleman)', 'M126', 'Types of Empathy'),
(77, 10, 2, 'Merespons keluhan atau perbedaan pendapat dengan tenang.', '7 Habits of Highly Effective People: Seek First to Understand, Then to Be Understood', 'M127', 'Empathy in Communication'),
(78, 10, 2, 'Merespons keluhan atau perbedaan pendapat dengan tenang.', 'CLEAR Communication Model', 'M128', 'Openess Communication'),
(79, 10, 1, 'Menjalin hubungan kerja yang baik dengan berbagai tipe orang.', 'Social Styles Model', 'M129', 'Basic Emphaty for Effective Communication'),
(80, 10, 1, 'Menjalin hubungan kerja yang baik dengan berbagai tipe orang.', 'Basic Emphaty: Empathy Circle (Listening Without Fixing)', 'M130', 'Empathy for Active Listening'),
(81, 5, 4, 'Mendorong orang lain atau seluruh anggota unit kerja untuk menyesuaikan diri terhadap perubahan.', 'Situational Leadership Model (Hersey & Blanchard)', 'M131', 'Situational Leadership'),
(82, 5, 4, 'Mendorong orang lain atau seluruh anggota unit kerja untuk menyesuaikan diri terhadap perubahan.', 'Cynefin Framework', 'M132', 'Adaptive Decision Making'),
(83, 5, 3, 'Menganalisis kebutuhan situasi dan menentukan cara kerja yang paling sesuai.', '7 Habits of Highly Effective People : Be Proactive', 'M133', 'Proactive Leadership'),
(84, 5, 3, 'Menganalisis kebutuhan situasi dan menentukan cara kerja yang paling sesuai.', 'ADKAR Model (Prosci)', 'M134', 'ADKAR Change Management'),
(85, 5, 2, 'Menyesuaikan perilaku kerja dengan situasi atau rekan kerja yang berbeda.', 'Cognitive Flexibility Framework', 'M135', 'Cognitive Flexibility in Work'),
(86, 5, 2, 'Menyesuaikan perilaku kerja dengan situasi atau rekan kerja yang berbeda.', 'Situational Communication: Flexing Your Style', 'M136', 'Adapting Your Communication Style'),
(87, 5, 1, 'Menerima perubahan cara kerja atau pendapat orang lain.', 'Adaptability in the Workplace', 'M137', 'Adaptability in a Changing Workplace'),
(88, 5, 1, 'Menerima perubahan cara kerja atau pendapat orang lain.', 'Managing Ambiguity and Uncertainty', 'M138', 'Managing Uncertainty and Ambiguity'),
(89, 17, 4, 'Membimbing pelaksanaan instruksi dalam tim, memastikan kesesuaian dengan prosedur.', 'Standardized Work and Operational Discipline', 'M139', 'Operational Discipline'),
(90, 17, 4, 'Membimbing pelaksanaan instruksi dalam tim, memastikan kesesuaian dengan prosedur.', 'Advanced Coaching for Leaders', 'M140', 'Leadership Coaching Advanced'),
(91, 17, 3, 'Konsisten melaksanakan instruksi yang rumit atau kompleks dengan baik.', 'Error-Proofing with Poka-Yoke', 'M141', 'Error-Proofing Techniques'),
(92, 17, 3, 'Konsisten melaksanakan instruksi yang rumit atau kompleks dengan baik.', 'Job Instruction Training (JIT)', 'M142', 'Effective Job Instruction'),
(93, 17, 2, 'Melaksanakan instruksi dengan konsisten dalam tugas rutin.', 'PDCA Cycle (Plan–Do–Check–Act)', 'M143', 'Continuous Improvement with PDCA'),
(94, 17, 2, 'Melaksanakan instruksi dengan konsisten dalam tugas rutin.', '7 Habits of Highly Effective People: Be Proactive', 'M144', 'Taking Personal Responsibility'),
(95, 17, 1, 'Memahami pentingnya mengikuti instruksi dan prosedur kerja.', 'Kaizen Mindset 101', 'M145', 'Implementing Kaizen for Efficiency'),
(96, 17, 1, 'Memahami pentingnya mengikuti instruksi dan prosedur kerja.', 'Basic Knowledge of 5S: Shitsuke', 'M146', '5S for Workplace Discipline'),
(97, 20, 4, 'Menjadi role model dalam menjaga nilai dan prinsip organisasi.', 'Strategic Thinking untuk Manager', 'M147', 'Strategic Thinking for Managerial'),
(98, 20, 4, 'Menjadi role model dalam menjaga nilai dan prinsip organisasi.', 'Ethical Decision Making', 'M148', 'Ethical Leadership'),
(99, 20, 3, 'Konsisten bersikap etis dalam situasi yang rumit.', 'Postconventional Moral Thinking', 'M149', 'Moral Ethics Behavior'),
(100, 20, 3, 'Konsisten bersikap etis dalam situasi yang rumit.', 'Principled Decision-Making Framework', 'M150', 'Principled Decision Making');

-- =============================================
-- COMPETENCY PROGRAM MAPPINGS
-- =============================================
INSERT INTO `competency_program_mappings` (`id`, `competency_type_id`, `program`, `training_material_1_id`, `training_material_2_id`, `category`, `created_at`, `updated_at`) VALUES
(1, 10, 'ODP', 75, 76, 'M', NOW(), NOW()),
(2, 6, 'ODP', 121, 122, 'M', NOW(), NOW()),
(3, 2, 'ODP', 59, 60, 'M', NOW(), NOW()),
(4, 7, 'ODP', 151, 152, 'M', NOW(), NOW()),
(5, 5, 'ODP', 81, 82, 'M', NOW(), NOW()),
(6, 4, 'ODP', 169, 170, 'M', NOW(), NOW()),
(7, 13, 'ODP', 133, 134, 'M', NOW(), NOW()),
(8, 20, 'ODP', 99, 100, 'M', NOW(), NOW()),
(9, 23, 'ODP', 185, 186, 'M', NOW(), NOW()),
(10, 11, 'ODP', 175, 176, 'M', NOW(), NOW()),
(11, 1, 'ODP', 113, 114, 'M', NOW(), NOW()),
(12, 16, 'ODP', 1, 2, 'M', NOW(), NOW()),
(13, 3, 'ODP', 41, 42, 'M', NOW(), NOW()),
(14, 19, 'ODP', 145, 146, 'M', NOW(), NOW()),
(15, 21, 'ODP', 161, 162, 'M', NOW(), NOW()),
(16, 12, 'ODP', 105, 106, 'M', NOW(), NOW()),
(17, 14, 'ODP', 65, 66, 'M', NOW(), NOW()),
(18, 9, 'ODP', 25, 26, 'M', NOW(), NOW()),
(19, 22, 'ODP', 17, 18, 'M', NOW(), NOW()),
(20, 18, 'ODP', 33, 34, 'M', NOW(), NOW()),
(21, 10, 'MDP', 77, 78, 'M', NOW(), NOW()),
(22, 6, 'MDP', 123, 124, 'M', NOW(), NOW()),
(23, 2, 'MDP', 61, 62, 'M', NOW(), NOW()),
(24, 4, 'MDP', 171, 172, 'M', NOW(), NOW()),
(25, 5, 'MDP', 83, 84, 'M', NOW(), NOW()),
(26, 13, 'MDP', 135, 136, 'M', NOW(), NOW()),
(27, 20, 'MDP', 101, 102, 'M', NOW(), NOW()),
(28, 8, 'MDP', 49, 50, 'M', NOW(), NOW()),
(29, 11, 'MDP', 177, 178, 'M', NOW(), NOW()),
(30, 1, 'MDP', 115, 116, 'M', NOW(), NOW()),
(31, 7, 'MDP', 153, 154, 'M', NOW(), NOW()),
(32, 15, 'MDP', 9, 10, 'M', NOW(), NOW()),
(33, 3, 'MDP', 43, 44, 'M', NOW(), NOW()),
(34, 19, 'MDP', 147, 148, 'M', NOW(), NOW()),
(35, 21, 'MDP', 163, 164, 'M', NOW(), NOW()),
(36, 12, 'MDP', 107, 108, 'M', NOW(), NOW()),
(37, 14, 'MDP', 67, 68, 'M', NOW(), NOW()),
(38, 9, 'MDP', 27, 28, 'M', NOW(), NOW()),
(39, 22, 'MDP', 19, 20, 'M', NOW(), NOW()),
(40, 18, 'MDP', 35, 36, 'M', NOW(), NOW()),
(41, 10, 'FDP', 75, 76, 'M', NOW(), NOW()),
(42, 6, 'FDP', 124, 123, 'M', NOW(), NOW()),
(43, 2, 'FDP', 61, 62, 'M', NOW(), NOW()),
(44, 7, 'FDP', 155, 156, 'M', NOW(), NOW()),
(45, 5, 'FDP', 83, 84, 'M', NOW(), NOW()),
(46, 4, 'FDP', 171, 172, 'M', NOW(), NOW()),
(47, 11, 'FDP', 179, 180, 'M', NOW(), NOW()),
(48, 3, 'FDP', 43, 44, 'M', NOW(), NOW()),
(49, 19, 'FDP', 147, 148, 'M', NOW(), NOW()),
(50, 8, 'FDP', 51, 52, 'M', NOW(), NOW()),
(51, 15, 'FDP', 11, 12, 'M', NOW(), NOW()),
(52, 16, 'FDP', 3, 4, 'M', NOW(), NOW()),
(53, 17, 'FDP', 91, 92, 'M', NOW(), NOW()),
(54, 9, 'FDP', 29, 30, 'M', NOW(), NOW());

-- =============================================
-- ASPECTS (For Assessment Scoring)
-- =============================================
INSERT INTO `aspect` (`id`, `name`, `weight`, `assessment_id`, `question_id`) VALUES
-- COREVA Assessment (ID: 1) - 5 aspects with weights
(1, 'Integrity', 40, 1, NULL),
(2, 'Customer Oriented', 25, 1, NULL),
(3, 'Competitive', 15, 1, NULL),
(4, 'Team Work', 10, 1, NULL),
(5, 'Visioner', 10, 1, NULL),
-- AWARE Assessment (ID: 2) - Single aspect
(6, 'Awareness Score', 100, 2, NULL),
-- GRIT Assessment (ID: 3) - Single aspect
(7, 'Grit Score', 100, 3, NULL),
-- KKM Assessment (ID: 4) - Technical competency
(8, 'Technical Knowledge', 100, 4, NULL);

-- =============================================
-- SAMPLE QUESTIONS (VA1 - COREVA)
-- Questions linked to Aspects
-- =============================================
INSERT INTO `questions` (`question_id`, `role`, `question_text`, `category`, `is_image`, `image_url`, `assessment_id`, `aspect_id`) VALUES
(1, 'va_1', 'Saya selalu menyelesaikan tugas tepat waktu', 'Integrity', NULL, NULL, 1, 1),
(2, 'va_1', 'Saya tidak pernah berbohong kepada rekan kerja', 'Integrity', NULL, NULL, 1, 1),
(3, 'va_1', 'Saya menjaga rahasia perusahaan dengan baik', 'Integrity', NULL, NULL, 1, 1),
(4, 'va_1', 'Saya selalu mengutamakan kepuasan pelanggan', 'Customer Oriented', NULL, NULL, 1, 2),
(5, 'va_1', 'Saya mendengarkan keluhan pelanggan dengan sabar', 'Customer Oriented', NULL, NULL, 1, 2),
(6, 'va_1', 'Saya berusaha memberikan solusi terbaik untuk pelanggan', 'Customer Oriented', NULL, NULL, 1, 2),
(7, 'va_1', 'Saya selalu berusaha menjadi yang terbaik', 'Competitive', NULL, NULL, 1, 3),
(8, 'va_1', 'Saya tidak mudah menyerah dalam menghadapi tantangan', 'Competitive', NULL, NULL, 1, 3),
(9, 'va_1', 'Saya bekerja sama dengan baik dalam tim', 'Team Work', NULL, NULL, 1, 4),
(10, 'va_1', 'Saya menghargai pendapat rekan kerja', 'Team Work', NULL, NULL, 1, 4),
(11, 'va_1', 'Saya memiliki visi yang jelas untuk karir saya', 'Visioner', NULL, NULL, 1, 5),
(12, 'va_1', 'Saya selalu memikirkan dampak jangka panjang dari keputusan', 'Visioner', NULL, NULL, 1, 5);

-- =============================================
-- SAMPLE OPTIONS
-- =============================================
INSERT INTO `options` (`option_id`, `question_id`, `option_letter`, `option_text`, `score`, `is_image`, `image_url`) VALUES
-- Options for Question 1
(1, 1, 'A', 'Sangat Tidak Setuju', 1, NULL, NULL),
(2, 1, 'B', 'Tidak Setuju', 2, NULL, NULL),
(3, 1, 'C', 'Netral', 3, NULL, NULL),
(4, 1, 'D', 'Setuju', 4, NULL, NULL),
(5, 1, 'E', 'Sangat Setuju', 5, NULL, NULL),
-- Options for Question 2
(6, 2, 'A', 'Sangat Tidak Setuju', 1, NULL, NULL),
(7, 2, 'B', 'Tidak Setuju', 2, NULL, NULL),
(8, 2, 'C', 'Netral', 3, NULL, NULL),
(9, 2, 'D', 'Setuju', 4, NULL, NULL),
(10, 2, 'E', 'Sangat Setuju', 5, NULL, NULL),
-- Options for Question 3
(11, 3, 'A', 'Sangat Tidak Setuju', 1, NULL, NULL),
(12, 3, 'B', 'Tidak Setuju', 2, NULL, NULL),
(13, 3, 'C', 'Netral', 3, NULL, NULL),
(14, 3, 'D', 'Setuju', 4, NULL, NULL),
(15, 3, 'E', 'Sangat Setuju', 5, NULL, NULL),
-- Options for Question 4
(16, 4, 'A', 'Sangat Tidak Setuju', 1, NULL, NULL),
(17, 4, 'B', 'Tidak Setuju', 2, NULL, NULL),
(18, 4, 'C', 'Netral', 3, NULL, NULL),
(19, 4, 'D', 'Setuju', 4, NULL, NULL),
(20, 4, 'E', 'Sangat Setuju', 5, NULL, NULL),
-- Options for Question 5
(21, 5, 'A', 'Sangat Tidak Setuju', 1, NULL, NULL),
(22, 5, 'B', 'Tidak Setuju', 2, NULL, NULL),
(23, 5, 'C', 'Netral', 3, NULL, NULL),
(24, 5, 'D', 'Setuju', 4, NULL, NULL),
(25, 5, 'E', 'Sangat Setuju', 5, NULL, NULL),
-- Options for Question 6
(26, 6, 'A', 'Sangat Tidak Setuju', 1, NULL, NULL),
(27, 6, 'B', 'Tidak Setuju', 2, NULL, NULL),
(28, 6, 'C', 'Netral', 3, NULL, NULL),
(29, 6, 'D', 'Setuju', 4, NULL, NULL),
(30, 6, 'E', 'Sangat Setuju', 5, NULL, NULL);

-- =============================================
-- SAMPLE REPORTS
-- =============================================
INSERT INTO `reports` (`id`, `vessel_name`, `nama`, `jabatan`, `kondite_review`, `kpi_vessel`, `performance_score`, `value_assessment`, `assessment_center`, `potential_score`, `hav_mapping`, `competency_gap_analysis`, `talent_classified`, `idp_program`, `idp`, `created_at`, `updated_at`, `seaman_code`, `seafarer_code`, `readiness`, `certificate`, `total_gap`, `strength`, `hav_quadran2`, `talent_classified2`, `certificate_eligible`, `age`, `hav_quadran`, `tanggal_lahir`, `start_date`, `warning_letter`, `case_history`, `year_of_case`, `vessel_history`, `training_completed`, `training_planned`, `mentoring_completed`, `mentoring_planned`, `coaching_completed`, `coaching_planned`, `data_incumbent`, `succession_vessel`, `succession_rank`, `idp_start`, `idp_mentor`, `idp_coach`, `user`, `readiness_month`, `education_fulfillment_months`, `total_readiness_update_months`, `keterangan`, `tm_nm`) VALUES
(1, 'MV Test Ship', 'John Doe', 'Nahkoda', 'Baik', 90.5, 85.0, 88.0, 92.0, 90.0, 'Q1', 'Perlu pengembangan leadership', 'High Potential', 'MDP', 'Dalam proses', NOW(), NOW(), 'SM001', '6201095355', 12, 'Master Mariner', 2, 'Technical Knowledge', 'Q2', 'Key Talent', 'COC Class I', 45, 'Top Right', '1980-01-15', '2020-01-01', 'None', 'No cases', 0, 'MV Previous Ship', 5, 3, 2, 4, 1, 2, 'Senior Officer', 'MV New Ship', 'Captain', '2024-01-01', 'Capt. Smith', 'Capt. Johnson', 'admin', 12, 6, 18, 'Ready for promotion', 'NM001'),
(2, 'MV Ocean Star', 'Jane Smith', 'Mualim 1', 'Sangat Baik', 92.0, 88.0, 90.0, 94.0, 92.0, 'Q1', 'Excellent performance', 'Star Performer', 'FDP', 'Completed', NOW(), NOW(), 'SM002', '6200521998', 18, 'Chief Mate', 1, 'Communication Skills', 'Q1', 'Star Talent', 'COC Class II', 38, 'Top Right', '1987-03-20', '2018-06-15', 'None', 'No cases', 0, 'MV Sea Bird', 8, 2, 4, 2, 3, 1, 'Mid-level Officer', 'MV Ocean Star', 'Chief Officer', '2023-06-01', 'Capt. Brown', 'Capt. Williams', 'admin', 18, 12, 30, 'Excellent candidate', 'NM002');

SET FOREIGN_KEY_CHECKS = 1;
