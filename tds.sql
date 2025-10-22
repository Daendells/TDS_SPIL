-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 08, 2025 at 08:32 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tds`
--

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` bigint(20) NOT NULL,
  `vessel_name` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `jabatan` varchar(255) DEFAULT NULL,
  `kondite_review` int(11) DEFAULT NULL,
  `kpi_vessel` int(11) DEFAULT NULL,
  `performance_score` int(11) DEFAULT NULL,
  `value_assessment` int(11) DEFAULT NULL,
  `assessment_center` int(11) DEFAULT NULL,
  `potential_score` int(11) DEFAULT NULL,
  `hav_mapping` varchar(255) DEFAULT NULL,
  `competency_gap_analysis` varchar(255) DEFAULT NULL,
  `talent_classified` varchar(255) DEFAULT NULL,
  `idp_program` varchar(100) DEFAULT NULL,
  `idp` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `seaman_code` varchar(50) NOT NULL,
  `seafarer_code` varchar(50) DEFAULT NULL,
  `readiness` varchar(50) NOT NULL,
  `certificate` varchar(255) DEFAULT NULL,
  `total_gap` int(11) DEFAULT NULL,
  `strength` int(11) DEFAULT NULL,
  `hav_quadran2` int(11) DEFAULT NULL,
  `talent_classified2` varchar(100) DEFAULT NULL,
  `certificate_eligible` varchar(100) DEFAULT NULL,
  `age` varchar(25) DEFAULT NULL,
  `hav_quadran` int(11) DEFAULT NULL,
  `tanggal_lahir` varchar(20) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `warning_letter` text DEFAULT NULL,
  `case_history` text DEFAULT NULL,
  `year_of_case` varchar(50) DEFAULT NULL,
  `vessel_history` text DEFAULT NULL,
  `training_completed` text DEFAULT NULL,
  `training_planned` text DEFAULT NULL,
  `mentoring_completed` text DEFAULT NULL,
  `mentoring_planned` text DEFAULT NULL,
  `coaching_completed` text DEFAULT NULL,
  `coaching_planned` text DEFAULT NULL,
  `data_incumbent` varchar(255) DEFAULT NULL,
  `succession_vessel` varchar(255) DEFAULT NULL,
  `succession_rank` varchar(255) DEFAULT NULL,
  `idp_start` date DEFAULT NULL,
  `idp_mentor` varchar(255) DEFAULT NULL,
  `idp_coach` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `vessel_name`, `nama`, `jabatan`, `kondite_review`, `kpi_vessel`, `performance_score`, `value_assessment`, `assessment_center`, `potential_score`, `hav_mapping`, `competency_gap_analysis`, `talent_classified`, `idp_program`, `idp`, `created_at`, `updated_at`, `seaman_code`, `seafarer_code`, `readiness`, `certificate`, `total_gap`, `strength`, `hav_quadran2`, `talent_classified2`, `certificate_eligible`, `age`, `hav_quadran`, `tanggal_lahir`, `start_date`, `warning_letter`, `case_history`, `year_of_case`, `vessel_history`, `training_completed`, `training_planned`, `mentoring_completed`, `mentoring_planned`, `coaching_completed`, `coaching_planned`, `data_incumbent`, `succession_vessel`, `succession_rank`, `idp_start`, `idp_mentor`, `idp_coach`) VALUES
(1, 'KM. Armada Segara', 'BUDI SANTOSO', 'MUALIM I', 4, 5, 4, 5, 4, 5, 'High Performer', '0', 'Talent', 'MDP', 'Foundational Development Program', '2025-09-25 07:37:56', '2025-09-25 08:53:31', '20030001', '1234567890', 'Ready Now', 'ANT-II', 2, 3, 1, 'Talent', 'Eligible', '45 tahun 4 bulan 13 hari', 2, '1980-05-12', '2000-02-01', '-', '-', '-', 'KM. Armada Segara|MUALIM II; KM. Laut Hijau|MUALIM I; KM. Nusantara|NAHKODA', 'Integrated Safety and Security; Corp. Knowledge Organization; SMK Familiarization; Ballast Water Mngmt; Security Awareness; Risk Assessment; Hot Work; Fire Fighting; Safety Drill; Toxic Employee; Near Miss; Survival Technique; Marpol Compliance; GMDSS; Operation of Generator; Lashing Container; Incenerator; Handling Difficult Cargo; IMDG Code; Emergency Response; BRM; Teamwork & Communication', '-', '-', '-', '-', '-', 'Capt. Surya Dharma', 'KM. Armada Segara', 'MUALIM II', '2025-09-01', 'Port Captain', 'Nahkoda KM. Hijau Segara'),
(2, 'KM. HIJAU SAMUDRA', 'EDDY HARI WIBOWO', 'MUALIM I', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20170398', NULL, 'Ready Now', 'ANT-I', 0, 0, 5, 'No Talent', 'Eligible', '56 tahun 1 bulan 3 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'KM. ORIENTAL EMERALD', 'MAD KAINI', 'MUALIM I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; CSO; SIO; TOR; CIO; ACH; EMP; RSC; RSF; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20040002', NULL, '7-12 Months', 'ANT-II', 11, 0, 8, 'Talent', 'Not Eligible', '54 tahun 6 bulan 25 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'KM. ORIENTAL GALAXY', 'FRANGKY MULALINDA', 'MUALIM I', 3, 2, 3, 2, 2, 2, 'High Performer', 'LAG; DCM; ING; SIO; CIO; FLX; COM', 'Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20110444', NULL, '6 Months', 'ANT-II', 7, 0, 8, 'Talent', 'Not Eligible', '35 tahun 6 bulan 18 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'KM. ORIENTAL GOLD', 'IDHAM FEBRIASYAH', 'MUALIM I', 3, 2, 3, 1, 2, 2, 'High Performer', 'PSG; CSO; CIO; EMP; FLX', 'Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180264', NULL, '6 Months', 'ANT-II', 5, 0, 7, 'No Talent', 'Not Eligible', '38 tahun 6 bulan 9 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'KM. ORIENTAL PACIFIC', 'LANDUNG AHMADA', 'MUALIM I', 3, 1, 2, 0, 0, 0, '-', '0', '-', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20050041', NULL, 'Ready Now', 'ANT-I', 0, 0, 0, '-', 'Eligible', '47 tahun 11 bulan 12 hari', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'KM. ORIENTAL RUBY', 'CATUR MUKTI WIBOWO', 'MUALIM I', 3, 2, 3, 3, 2, 2, 'High Performer', 'LAG; CSO; SIO; TOR; IDS; CIO; EMP; RSC; COM; LDC', 'Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20100112', NULL, '7-12 Months', 'ANT-II', 10, 0, 9, 'Talent', 'Not Eligible', '41 tahun 7 bulan 19 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'KM. ORIENTAL SAMUDERA', 'ANGGA PARADEWA', 'MUALIM I', 3, 2, 3, 2, 2, 2, 'High Performer', 'DCM; ING; SIO; CIO;ACH; FLX; LDP; LDC', 'Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20121090', NULL, '6 Months', 'ANT-II', 8, 0, 8, 'Talent', 'Not Eligible', '36 tahun 6 bulan 13 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'KM. PULAU NUNUKAN', 'SUAY BATUL ULUM', 'MUALIM I', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20040229', NULL, 'Ready Now', 'ANT-I', 0, 0, 5, 'No Talent', 'Eligible', '51 tahun 6 bulan 6 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'KM. SELILI BARU', 'WAHYUDI', 'MUALIM I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; CSO; SIO; CFO; TOR; CIO; ACH; RSC; FLX; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20130766', NULL, '7-12 Months', 'ANT-III', 11, 0, 8, 'Talent', 'Not Eligible', '57 tahun 2 bulan 2 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'KM. SPIL HANA', 'MUCHLISIN', 'MUALIM I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; ACT; SIO; CFO; IDS; CIO; PNO; RSC; FLX; LDP; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20110785', NULL, '13-18 Months', 'ANT-II', 12, 0, 8, 'Talent', 'Not Eligible', '36 tahun 7 bulan 2 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'KM. SPIL HAPSRI', 'AGUS WAHYUDI', 'MUALIM I', 3, 2, 3, 2, 2, 2, 'High Performer', 'LAG; DCM; ACT; SIO; CFO; CIO; ACH; PNO; FLX; LDC', 'Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20040505', NULL, '7-12 Months', 'ANT-II', 10, 0, 8, 'Talent', 'Not Eligible', '49 tahun 0 bulan 13 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'KM. SPIL HAYU', 'ARIF FIRDIAN SYAH', 'MUALIM I', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20140768', NULL, 'Ready Now', 'ANT-II', 0, 0, 5, 'No Talent', 'Not Eligible', '34 tahun 8 bulan 7 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'KM. SPIL RAHAYU', 'PAULUS PASULU', 'MUALIM I', 3, 1, 2, 2, 1, 1, 'Inconsistent', 'LAG; DCM; CFO; TOR; CIO; PNP; EMP; RBG; COM; DIR; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20040469', NULL, '7-12 Months', 'ANT-I', 11, 0, 5, 'No Talent', 'Eligible', '49 tahun 6 bulan 18 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 'KM. SPIL RENATA', 'TOAR SANTOSO', 'MUALIM I', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20100252', NULL, 'Ready Now', 'ANT-I', 0, 0, 5, 'No Talent', 'Eligible', '43 tahun 5 bulan 19 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 'KM. TELUK FLAMINGGO', 'MUHLIS', 'MUALIM I', 3, 1, 2, 1, 2, 2, 'Core Contributor', 'LAG; DCM; ING; ACT; CSO; SIO; CIO; FLX; COM; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20140136', NULL, '7-12 Months', 'ANT-II', 10, 0, 4, 'No Talent', 'Not Eligible', '52 tahun 3 bulan 7 hari', 5, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'KM. TITANIUM', 'MUHAMAD SYAIFUL LATIEF', 'MUALIM I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; ACT; CSO; SIO; CIO; ACH; PNO; EMP; RSC; FLX; COM; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20130268', NULL, '13-18 Months', 'ANT-II', 13, 0, 8, 'Talent', 'Not Eligible', '35 tahun 8 bulan 22 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'KM. HIJAU JELITA', 'ANANG LESTIONO', 'MUALIM II', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20120562', NULL, 'Ready Now', 'ANT-III', 0, 0, 5, 'No Talent', 'Not Eligible', '33 tahun 7 bulan 14 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'KM. LUZON', 'PRASETYA SURYAATMAJA', 'MUALIM II', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20160507', NULL, 'Ready Now', 'ANT-II', 0, 0, 5, 'No Talent', 'Eligible', '29 tahun 9 bulan 16 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 'KM. ORIENTAL DIAMOND', 'VICKY NAZARIO SYUKUR', 'MUALIM II', 3, 2, 3, 2, 0, 1, 'Solid Professional', '0', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20190087', NULL, 'Ready Now', 'ANT-III', 0, 0, 8, 'Talent', 'Not Eligible', '27 tahun 3 bulan 1 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 'KM. ORIENTAL PACIFIC', 'NURROHMAN', 'MUALIM II', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20080226', NULL, 'Ready Now', 'ANT-II', 0, 0, 5, 'No Talent', 'Eligible', '35 tahun 8 bulan 21 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 'KM. ORIENTAL RUBY', 'MOH. IMAN SYAFII TAUFIQ', 'MUALIM II', 3, 2, 3, 2, 1, 1, 'Solid Professional', 'LAG; DCM;CSO; SIO; TOR; CIO; ACH; EMP; RSC; RBGL FLX; COM; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20160200', NULL, '13-18 Months', 'ANT-III', 13, 0, 8, 'Talent', 'Not Eligible', '29 tahun 4 bulan 7 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 'KM. ORIENTAL SAMUDERA', 'AGUSTINUS RAHAJAAN', 'MUALIM II', 3, 2, 3, 3, 2, 2, 'High Performer', 'LAG; DCM; CSO; SIO; TOR; CIO; EMP; RBG; FLX; LDC', 'Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20120294', NULL, '7-12 Months', 'ANT-II', 10, 0, 9, 'Talent', 'Eligible', '41 tahun 3 bulan 7 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 'KM. PEKAN RIAU', 'EKKY SAPUTRA', 'MUALIM II', 3, 3, 3, 3, 0, 1, 'Solid Professional', 'LAG; DCM; CSO; SIO; TOR; EMP; RSC; RBG; FLX', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20100534', NULL, '7-12 Months', 'ANT-III', 9, 0, 9, 'Talent', 'Not Eligible', '40 tahun 4 bulan 2 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 'KM. SELILI BARU', 'AULI SAPRIADI', 'MUALIM II', 3, 2, 3, 2, 1, 1, 'Solid Professional', 'LAG; DCM; CSO; SIO; TOR; ACH; EMP; RSC; RBG; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20150567', NULL, '7-12 Months', 'ANT-II', 11, 0, 8, 'Talent', 'Eligible', '31 tahun 0 bulan 15 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'KM. SPIL HANA', 'GITA SETYA GALIH', 'MUALIM II', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; SIO; CFO; ACH; EMP; RSC; RSF; RBG; FLX; LDP; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20121309', NULL, '13-18 Months', 'ANT-III', 12, 0, 8, 'Talent', 'Not Eligible', '37 tahun 10 bulan 10 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 'KM. SPIL HASYA', 'ANDIKA VALENTIAN ADITYA', 'MUALIM II', 3, 2, 3, 3, 0, 1, 'Solid Professional', 'LAG; DCM; SIO; EMP; RSC; LDP; DIR; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180284', NULL, '6 Months', 'ANT-III', 8, 0, 9, 'Talent', 'Not Eligible', '27 tahun 6 bulan 26 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 'KM. SPIL HAYU', 'FERIS SETYO PAMBUDI', 'MUALIM II', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20170602', NULL, 'Ready Now', 'ANT-II', 0, 0, 5, 'No Talent', 'Eligible', '31 tahun 11 bulan 28 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 'KM. SPIL RAHAYU', 'JANY SUITELA', 'MUALIM II', 3, 1, 2, 2, 2, 2, 'Core Contributor', 'LAG; DCM; ING; CSO; SIO; FLX; LDP; DIR; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20111101', NULL, '7-12 Months', 'ANT-III', 9, 0, 5, 'No Talent', 'Not Eligible', '45 tahun 8 bulan 8 hari', 5, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'KM. SPIL RUMI', 'MARIO JEVIN WAANG', 'MUALIM II', 3, 2, 3, 1, 0, 0, '-', '0', '-', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180018', NULL, 'Ready Now', 'ANT-III', 0, 0, 7, 'No Talent', 'Not Eligible', '30 tahun 5 bulan 25 hari', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 'KM. TELUK BINTUNI', 'KARIMUL ARIF', 'MUALIM II', 3, 3, 3, 2, 1, 1, 'Solid Professional', 'LAG; DCM; CSO; SIO; CIO; ACH;RSC; RSF; FLX; DIR; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180296', NULL, '7-12 Months', 'ANT-III', 11, 0, 8, 'Talent', 'Not Eligible', '30 tahun 4 bulan 23 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'KM. TELUK FLAMINGGO', 'ERWANDI EFENDI', 'MUALIM II', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20150408', NULL, 'Ready Now', 'ANT-III', 0, 0, 5, 'No Talent', 'Not Eligible', '31 tahun 7 bulan 19 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 'KM. TITANIUM', 'DICKY SURYA SYAHPUTRA', 'MUALIM II', 3, 2, 3, 2, 0, 1, 'Solid Professional', '0', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180380', NULL, 'Ready Now', 'ANT-II', 0, 0, 8, 'Talent', 'Eligible', '27 tahun 7 bulan 16 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 'KM. HIJAU SAMUDRA', 'DZIYAN ALFEIN MUBARAK', 'MUALIM III', 3, 1, 2, 3, 3, 3, 'Emerging Leader', 'LAG; CIO; EMP; RSC', 'Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20200441', NULL, '6 Months', 'ANT-III', 4, 0, 6, 'Talent', 'Eligible', '25 tahun 7 bulan 8 hari', 6, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 'KM. LUZON', 'MUHAMMAD BAYU FIRMANDANU', 'MUALIM III', 3, 3, 3, 2, 0, 1, 'Solid Professional', 'CSO; CIO; EMP; RSC: RBG: FLX', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20200349', NULL, '6 Months', 'ANT-III', 5, 0, 8, 'Talent', 'Eligible', '25 tahun 4 bulan 19 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 'KM. ORIENTAL PACIFIC', 'MUHAMMAD REZA', 'MUALIM III', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20220030', NULL, 'Ready Now', 'ANT-III', 0, 0, 5, 'No Talent', 'Eligible', '24 tahun 10 bulan 16 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 'KM. ORIENTAL RUBY', 'MUSA ALJABAR', 'MUALIM III', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; SIO; EMP; RSC; FLX', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20190427', NULL, '6 Months', 'ANT-II', 5, 0, 8, 'Talent', 'Not Eligible', '27 tahun 1 bulan 15 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 'KM. PULAU WETAR', 'AFDAL FERDI ANAS', 'MUALIM III', 3, 2, 3, 1, 0, 0, '-', '0', '-', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20210056', NULL, 'Ready Now', 'ANT-III', 0, 0, 7, 'No Talent', 'Eligible', '25 tahun 9 bulan 28 hari', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 'KM. SPIL HANA', 'RACHMAD HIDAYAD (SPARTAN)', 'MUALIM III', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'EMP; RSC', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20210075', NULL, 'Ready Now', 'ANT-III', 2, 0, 8, 'Talent', 'Eligible', '28 tahun 3 bulan 20 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 'KM. SPIL RAHAYU', 'YOSUA HP MARBUN', 'MUALIM III', 3, 1, 2, 2, 2, 2, 'Core Contributor', 'LAG; ING; TOR; CIO; EMP; RBG; FLX', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20200222', NULL, '6 Months', 'ANT-II', 7, 0, 5, 'No Talent', 'Not Eligible', '26 tahun 11 bulan 7 hari', 5, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 'KM. TELUK FLAMINGGO', 'LUKMANUL HAKIM', 'MUALIM III', 3, 1, 2, 3, 3, 3, 'Emerging Leader', 'LAG; CIO; EMP; FLX', 'Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180558', NULL, '6 Months', 'ANT-III', 4, 0, 6, 'Talent', 'Eligible', '28 tahun 9 bulan 16 hari', 6, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 'KM. KALIMANTAN LEADER', 'SYAMUDRA KUHON', 'MASINIS I', 3, 2, 3, 0, 0, 0, '-', '0', '-', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20190044', NULL, 'Ready Now', 'ATT-II', 0, 0, 0, '-', 'Not Eligible', '53 tahun 1 bulan 29 hari', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 'KM. LUZON', 'BUDIYANTO', 'MASINIS I', 3, 3, 3, 2, 0, 1, 'Solid Professional', 'DCM; CSO; SIO; CFO; TOR; IDS; PNO; RSC; COM; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180084', NULL, '7-12 Months', 'ATT-II', 10, 0, 8, 'Talent', 'Not Eligible', '43 tahun 7 bulan 22 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 'KM. MULIANIM', 'MUHAMMAD YAMIN', 'MASINIS I', 3, 1, 2, 2, 2, 2, 'Core Contributor', 'LAG; DCM; CSO; SIO; CIO; PNO; EMP; FLX; COM; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20130547', NULL, '7-12 Months', 'ATT-II', 10, 0, 5, 'No Talent', 'Not Eligible', '32 tahun 6 bulan 25 hari', 5, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 'KM. ORIENTAL DIAMOND', 'WAHYU EFENDI', 'MASINIS I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; BAC; DCM; ACT; SIO; CIO; ACH; PNO; RSC; RSF; FLX; LDP; DIR; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20160269', NULL, '13-18 Months', 'ATT-II', 14, 0, 8, 'Talent', 'Not Eligible', '32 tahun 3 bulan 24 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 'KM. ORIENTAL EMERALD', 'VINKY ARIJONA SIMANJUNTAK', 'MASINIS I', 3, 2, 3, 3, 0, 1, 'Solid Professional', 'DCM; ACT; CSO; SIO; TOR; CIO; PNO; FLX; LDP; DIR; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20120710', NULL, '7-12 Months', 'ATT-II', 11, 0, 9, 'Talent', 'Not Eligible', '38 tahun 11 bulan 16 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 'KM. ORIENTAL PACIFIC', 'KARSENO', 'MASINIS I', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20190307', NULL, 'Ready Now', 'ATT-II', 0, 0, 5, 'No Talent', 'Not Eligible', '46 tahun 5 bulan 20 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 'KM. PEKAN FAJAR', 'DONA SETIAWAN', 'MASINIS I', 3, 3, 3, 2, 0, 1, 'Solid Professional', 'DCM; ACT; CSO; CFO; IDS; ACH; PNO; RSC; FLX; LDP; DIR; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20150582', NULL, '13-18 Months', 'ATT-II', 12, 0, 8, 'Talent', 'Not Eligible', '32 tahun 10 bulan 10 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(49, 'KM. PULAU WETAR', 'EKO SETIASMONO', 'MASINIS I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; ACT; CSO; SIO; TOR; PNO; EMP; RSC; RBG; FLX; COM; DIR; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20130838', NULL, '13-18 Months', 'ATT-II', 14, 0, 8, 'Talent', 'Not Eligible', '45 tahun 7 bulan 15 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(50, 'KM. SELILI BARU', 'DIKDIK KUSDIANA', 'MASINIS I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'TOR; IDS; CIO; EMP; RBG; COM; LDP; DIR; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20120395', NULL, '7-12 Months', 'ATT-II', 9, 0, 8, 'Talent', 'Not Eligible', '40 tahun 9 bulan 29 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(51, 'KM. SPIL HANA', 'MOCHAMMAD FAHMI', 'MASINIS I', 3, 2, 3, 2, 2, 2, 'High Performer', 'LAG; DCM; CSO; CFO; CIO; PNO; EMP; RSC; FLX; COM', 'Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20140672', NULL, '7-12 Months', 'ATT-II', 10, 0, 8, 'Talent', 'Not Eligible', '40 tahun 9 bulan 20 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(52, 'KM. SPIL HAPSRI', 'MUKHTAR BAGUS MANTRA', 'MASINIS I', 3, 2, 3, 2, 0, 1, 'Solid Professional', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20130095', NULL, 'Ready Now', 'ATT-II', 0, 0, 8, 'Talent', 'Not Eligible', '37 tahun 1 bulan 28 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(53, 'KM. SPIL HAYU', 'EL JUNAIDI', 'MASINIS I', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180320', NULL, 'Ready Now', 'ATT-II', 0, 0, 5, 'No Talent', 'Not Eligible', '48 tahun 2 bulan 9 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 'KM. SPIL RUMI', 'YATEMAN', 'MASINIS I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; ING; ACT; SIO; CFO; IDS; CIO; ACH; PNO', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20040186', NULL, '7-12 Months', 'ATT-III', 10, 0, 8, 'Talent', 'Not Eligible', '54 tahun 10 bulan 30 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 'KM. TELUK FLAMINGGO', 'MUCHAMMAD MUJIB', 'MASINIS I', 3, 1, 2, 2, 2, 2, 'Core Contributor', 'LAG; DCM; SIO; CIO; EMP; FLX; COM', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20110285', NULL, '6 Months', 'ATT-II', 7, 0, 5, 'No Talent', 'Not Eligible', '39 tahun 7 bulan 6 hari', 5, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 'KM. TITANIUM', 'AHMAD ARWANI', 'MASINIS I', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; SIO; TOR; CIO; ACH; EMP; RSC; COM; LDC', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20130326', NULL, '7-12 Months', 'ATT-II', 9, 0, 8, 'Talent', 'Not Eligible', '33 tahun 4 bulan 13 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 'KM. VERTIKAL', 'AGUNG SUKOWIBOWO', 'MASINIS I', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'SDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20160740', NULL, 'Ready Now', 'ATT-II', 0, 0, 5, 'No Talent', 'Not Eligible', '30 tahun 0 bulan 13 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 'KM. ORIENTAL EMERALD', 'DWI HANGGARA', 'MASINIS II', 3, 2, 3, 3, 2, 2, 'High Performer', 'LAG; DCM; SIO; RSC; RBG; FLX', 'Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180030', NULL, '6 Months', 'ATT-II', 6, 0, 9, 'Talent', 'Not Eligible', '33 tahun 11 bulan 9 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 'KM. PEKAN FAJAR', 'RISKI TAUFANI SUTOPO', 'MASINIS II', 3, 3, 3, 2, 0, 1, 'Solid Professional', 'LAG; CSO; SIO; TOR; CIO; EMP; RSF; FLX; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20170039', NULL, '7-12 Months', 'ATT-II', 9, 0, 8, 'Talent', 'Not Eligible', '31 tahun 7 bulan 24 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 'KM. PULAU WETAR', 'AMANNUN DAMARJATI', 'MASINIS II', 3, 2, 3, 3, 0, 1, 'Solid Professional', 'LAG; DCM; CSO; SIO; TOR; ACH; EMP; RSF; RLDP; DIR; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180286', NULL, '-', 'ATT-III', 0, 0, 9, 'Talent', 'Not Eligible', '28 tahun 2 bulan 28 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(61, 'KM. SELILI BARU', 'YULIO GOGO DARWANTO', 'MASINIS II', 3, 2, 3, 2, 0, 1, 'Solid Professional', '-', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180283', NULL, '7-12 Months', 'ATT-II', 11, 0, 8, 'Talent', 'Not Eligible', '31 tahun 3 bulan 24 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 'KM. SPIL HANA', 'ABDUL BASIR', 'MASINIS II', 3, 2, 3, 1, 1, 1, 'Solid Professional', 'LAG; DCM; ING; SIO; CFO; CIO; EMP; RSC; RBG; FLX; LDC', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20170225', NULL, '7-12 Months', 'ATT-III', 11, 0, 7, 'No Talent', 'Not Eligible', '30 tahun 5 bulan 23 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 'KM. SPIL HAPSRI', 'HARIZAL ADE RAMDHANI', 'MASINIS II', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; SIO; TOR; CIO; EMP; RSC; FLX', 'No Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20190398', NULL, '6 Months', 'ATT-III', 8, 0, 8, 'Talent', 'Not Eligible', '26 tahun 7 bulan 16 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(64, 'KM. SPIL RUMI', 'ALBERD SAMUEL MALLASAK SIMAMOR', 'MASINIS II', 3, 2, 3, 2, 2, 2, 'High Performer', 'LAG; DCM; CSO; SIO; TOR; ACH; EMP; RSF; RBG; FLX; LDC', 'Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20200053', NULL, '7-12 Months', 'ATT-II', 10, 0, 8, 'Talent', 'Not Eligible', '31 tahun 4 bulan 6 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(65, 'KM. TITANIUM', 'DENNY PANDU KUSYONO', 'MASINIS II', 3, 2, 3, 2, 2, 2, 'High Performer', 'LAG; DCM; CSO; SIO; TOR; ACH; EMP; RSC; RBG; FLX; LDC', 'Talent', 'MDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20180350', NULL, '7-12 Months', 'ATT-II', 10, 0, 8, 'Talent', 'Not Eligible', '28 tahun 7 bulan 24 hari', 8, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(66, 'KM. HIJAU JELITA', 'FEBY SETIYAWAN', 'MASINIS III', 3, 1, 2, 2, 0, 1, 'Inconsistent', '0', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20200254', NULL, 'Ready Now', 'ATT-III', 0, 0, 5, 'No Talent', 'Not Eligible', '24 tahun 6 bulan 5 hari', 4, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(67, 'KM. ORIENTAL DIAMOND', 'NANANG ARIFUDIN', 'MASINIS III', 3, 2, 3, 1, 0, 0, '-', '0', '-', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20210159', NULL, 'Ready Now', 'ATT-III', 0, 0, 7, 'No Talent', 'Not Eligible', '26 tahun 1 bulan 19 hari', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 'KM. PEKAN FAJAR', 'ADITYA NUGRAHA', 'MASINIS III', 3, 3, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; TOR; ACH; EMP; RSC; RBG; FLX', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20160102', NULL, '6 Months', 'ATT-III', 8, 0, 8, 'Talent', 'Not Eligible', '30 tahun 0 bulan 20 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 'KM. PULAU WETAR', 'SATRIA AJI PANGESTU', 'MASINIS III', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'LAG; DCM; CSO; SIO; TOR; EMP; RBG; COM', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20200332', NULL, '6 Months', 'ATT-III', 8, 0, 8, 'Talent', 'Not Eligible', '25 tahun 5 bulan 27 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(70, 'KM. SELILI BARU', 'SARIF HIDAYATULLAH', 'MASINIS III', 3, 2, 3, 2, 0, 1, 'Solid Professional', 'DCM; SIO; EMP', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20170178', NULL, 'Ready Now', 'ATT-III', 3, 0, 8, 'Talent', 'Not Eligible', '32 tahun 3 bulan 28 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(71, 'KM. SPIL RUMI', 'MOCHAMAD TEGUH FACHRIAN', 'MASINIS III', 3, 2, 3, 1, 0, 0, '-', '0', '-', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20210231', NULL, 'Ready Now', 'ATT-III', 0, 0, 7, 'No Talent', 'Not Eligible', '25 tahun 3 bulan 15 hari', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(72, 'KM. TITANIUM', 'DEVA PREZILIAN INDRA LORENZA', 'MASINIS III', 3, 2, 3, 2, 0, 1, 'Solid Professional', '0', 'No Talent', 'FDP', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '20200259', NULL, 'Ready Now', 'ATT-III', 0, 0, 8, 'Talent', 'Not Eligible', '25 tahun 8 bulan 21 hari', 7, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(73, '-', '-', '-', 0, 0, 0, 0, 0, 0, '-', '-', '-', '-', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '-', NULL, '-', '-', 0, 0, 0, '-', '-', '-', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(74, '-', '-', '-', 0, 0, 0, 0, 0, 0, '-', '-', '-', '-', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '-', NULL, '-', '-', 0, 0, 0, 'Ready Now', '-', '-', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, '-', '-', '-', 0, 0, 0, 0, 0, 0, '-', '-', '-', '-', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '-', NULL, '-', '-', 0, 0, 0, '6 Months', '-', '-', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(76, '-', '-', '-', 0, 0, 0, 0, 0, 0, '-', '-', '-', '-', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '-', NULL, '-', '-', 0, 0, 0, '7-12 Months', '-', '-', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(77, '-', '-', '-', 0, 0, 0, 0, 0, 0, '-', '-', '-', '-', NULL, '2025-09-25 04:04:07', '2025-09-25 04:04:07', '-', NULL, '-', '-', 0, 0, 0, '13-18 Months', '-', '-', 0, 'dd-mm-yyyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `standard`
--

CREATE TABLE `standard` (
  `no` int(11) NOT NULL,
  `kode_ai` varchar(3) NOT NULL,
  `nahkoda` int(11) NOT NULL,
  `kkm` int(11) NOT NULL,
  `mualim_1` int(11) NOT NULL,
  `masinis_2` int(11) NOT NULL,
  `mualim_2` int(11) NOT NULL,
  `mualim_3` int(11) NOT NULL,
  `mualim_4` int(11) NOT NULL,
  `masinis_3` int(11) NOT NULL,
  `masinis_4` int(11) NOT NULL,
  `masinis_5` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `standard`
--

INSERT INTO `standard` (`no`, `kode_ai`, `nahkoda`, `kkm`, `mualim_1`, `masinis_2`, `mualim_2`, `mualim_3`, `mualim_4`, `masinis_3`, `masinis_4`, `masinis_5`) VALUES
(1, 'ING', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(2, 'CSO', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(3, 'PSG', 3, 3, 3, 3, 3, 3, 3, 3, 3, 3),
(4, 'CFO', 4, 4, 3, 3, 3, 3, 3, 3, 3, 3),
(5, 'RSC', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(6, 'TOR', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(7, 'RBG', 3, 3, 4, 4, 3, 3, 3, 3, 3, 3),
(8, 'COM', 4, 4, 3, 3, 2, 2, 2, 2, 2, 2),
(9, 'ACH', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(10, 'BAC', 3, 3, 3, 3, 2, 2, 2, 2, 2, 2),
(11, 'PNO', 4, 4, 3, 3, 2, 2, 2, 2, 2, 2),
(12, 'ACT', 4, 4, 3, 3, 3, 3, 3, 3, 3, 3),
(13, 'SIO', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(14, 'EMP', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(15, 'LAG', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(16, 'RSF', 3, 3, 3, 3, 2, 2, 2, 2, 2, 2),
(17, 'IDS', 4, 4, 3, 3, 3, 3, 2, 2, 2, 2),
(18, 'FLX', 4, 4, 4, 4, 3, 3, 3, 3, 3, 3),
(19, 'CIO', 4, 4, 3, 3, 3, 3, 3, 3, 3, 3),
(20, 'LDP', 4, 4, 3, 3, 2, 2, 2, 2, 2, 2),
(21, 'DIR', 4, 4, 3, 3, 2, 2, 2, 2, 2, 2),
(22, 'LDC', 4, 4, 3, 3, 2, 2, 2, 2, 2, 2),
(23, 'DCM', 4, 4, 3, 3, 2, 2, 2, 2, 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `training`
--

CREATE TABLE `training` (
  `no` int(11) NOT NULL,
  `kode_ai` varchar(3) NOT NULL,
  `kompetensi` varchar(28) NOT NULL,
  `lvl` int(11) NOT NULL,
  `tools_training` varchar(84) NOT NULL,
  `kode` varchar(4) NOT NULL,
  `topik_training` varchar(56) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `training`
--

INSERT INTO `training` (`no`, `kode_ai`, `kompetensi`, `lvl`, `tools_training`, `kode`, `topik_training`) VALUES
(1, 'ACT', 'Accountability', 4, 'The Trust Equation', 'M051', 'Building Trust'),
(2, 'ACT', 'Accountability', 4, 'Culture of Accountability (Craig Hickman)', 'M052', 'Culture of Accountability (Advanced)'),
(3, 'ACT', 'Accountability', 3, 'SMART Goals Setting: Achievable', 'M053', 'Setting Achievable Goals'),
(4, 'ACT', 'Accountability', 3, 'Agile Execution Mindset', 'M054', 'Rapid Execution Mindset'),
(5, 'ACT', 'Accountability', 2, 'The Oz Principle: Accountability Ladder', 'M055', 'Cultivating Accountability in Workplace'),
(6, 'ACT', 'Accountability', 2, 'GRPI Model (Goals, Roles, Processes, Interpersonal Relationships)', 'M056', 'Effective and Connected Teams'),
(7, 'ACT', 'Accountability', 1, 'Circle of Control vs. Circle of Concern (7 Habit of Highly Effective People)', 'M057', 'Mastering Control and Focus'),
(8, 'ACT', 'Accountability', 1, 'Time Management', 'M058', 'Task Prioritization'),
(9, 'ACH', 'Achivement Orientation', 4, 'Driving High-Performance Culture', 'M059', 'Building High-Performance Culture'),
(10, 'ACH', 'Achivement Orientation', 4, 'OKR Framework', 'M060', 'Mastering OKRs'),
(11, 'ACH', 'Achivement Orientation', 3, 'Supervisory Growth Mindset', 'M061', 'Adaptive Leadership'),
(12, 'ACH', 'Achivement Orientation', 3, '4DX – Four Disciplines of Execution', 'M062', 'Impactful Execution'),
(13, 'ACH', 'Achivement Orientation', 2, 'Kaizen Mindset 101', 'M063', 'Kaizen for Workplace Innovation'),
(14, 'ACH', 'Achivement Orientation', 2, 'SMART Goals Setting', 'M064', 'Goal Setting for Success'),
(15, 'ACH', 'Achivement Orientation', 1, 'Time Management', 'M065', 'Maximizing Results with Time Management'),
(16, 'ACH', 'Achivement Orientation', 1, 'Checklists & Work Documentation Essentials', 'M066', 'Building Consistent for Positive Work Habits'),
(17, 'BAC', 'Business Acumen', 4, 'SWOT Analysis for Strategic Thinking', 'M067', 'Strategic SWOT Analysis'),
(18, 'BAC', 'Business Acumen', 4, 'Strategic Risk Mapping', 'M068', 'Risk Mapping Strategy'),
(19, 'BAC', 'Business Acumen', 3, 'T.H.I.N.K. Model', 'M069', 'Team Synergy'),
(20, 'BAC', 'Business Acumen', 3, 'SMART Goals Setting', 'M070', 'Effective Goal Setting'),
(21, 'BAC', 'Business Acumen', 2, 'Shannon-Weaver Model of Communication', 'M071', 'Effective Communication for Insight'),
(22, 'BAC', 'Business Acumen', 2, 'Assertive Communication Ladder', 'M072', 'Basic Assertive Communication'),
(23, 'BAC', 'Business Acumen', 1, 'Checklists & Work Documentation Essentials', 'M073', 'Work Documentation and Checklists'),
(24, 'BAC', 'Business Acumen', 1, 'Input–Process–Output (IPO) Thinking', 'M074', 'Systematic Thinking for Work Efficiency'),
(25, 'COM', 'Communication', 4, 'Nonviolent Communication', 'M075', 'Advanced Effective Communication'),
(26, 'COM', 'Communication', 4, 'Advanced Communication Strategy', 'M076', 'Communication Strategy for Cross-Department'),
(27, 'COM', 'Communication', 3, 'SBI Model (Situation–Behavior–Impact)', 'M077', 'Supervisory 360° Communication'),
(28, 'COM', 'Communication', 3, 'Sandwich Feedback for Supervisory', 'M078', 'Positive Feedback for Supervisor'),
(29, 'COM', 'Communication', 2, 'Assertive Communication Ladder', 'M079', 'Basic Effective Communication'),
(30, 'COM', 'Communication', 2, 'T.H.I.N.K. Model', 'M080', 'Cross-Department Communication'),
(31, 'COM', 'Communication', 1, 'Shannon-Weaver Model of Communication', 'M081', 'Basic Communication'),
(32, 'COM', 'Communication', 1, 'Active Listening: Hearing, Listening, Understanding, Responding, Remembering', 'M082', 'Active Listening Skills'),
(33, 'CFO', 'Concern for Order', 4, 'Compliance, Governance, and Control Systems', 'M083', 'Advanced Compliance System'),
(34, 'CFO', 'Concern for Order', 4, 'Root Cause Analysis: Plan-Do-Check-Action', 'M084', 'Systematic PDCA Problem Solving'),
(35, 'CFO', 'Concern for Order', 3, 'Corrective Action Basics', 'M085', 'Corrective Action Essentials'),
(36, 'CFO', 'Concern for Order', 3, 'Creating Operational SOP & Monitoring Tools', 'M086', 'SOP & Monitoring Tools for Supervisor'),
(37, 'CFO', 'Concern for Order', 2, 'Time Management', 'M087', 'Effective Time Management'),
(38, 'CFO', 'Concern for Order', 2, 'Systematic Thinking in Daily Work', 'M088', 'Systematic Thinking for Daily Task'),
(39, 'CFO', 'Concern for Order', 1, 'Basic Knowledge of 5R: Seiso', 'M089', 'Maintaining Cleanliness at Work'),
(40, 'CFO', 'Concern for Order', 1, 'Checklists & Work Documentation Essentials', 'M090', 'Consistency at Work'),
(41, 'CIO', 'Continous Improvement', 4, 'Leading Innovation and Change', 'M091', 'Innovation Leadership'),
(42, 'CIO', 'Continous Improvement', 4, 'Kaizen Leadership: Driving Continuous Improvement', 'M092', 'Kaizen Leadership'),
(43, 'CIO', 'Continous Improvement', 3, '7 Habits of Highly Effective People : Be Proactive', 'M093', 'Proactive Mindset'),
(44, 'CIO', 'Continous Improvement', 3, 'After Action Review (AAR)', 'M094', 'Action Review for Task'),
(45, 'CIO', 'Continous Improvement', 2, 'Growth Mindset (Carol Dweck)', 'M095', 'Developing a Growth Mindset'),
(46, 'CIO', 'Continous Improvement', 2, 'Kaizen Mindset 101', 'M096', 'Kaizen for Innovation'),
(47, 'CIO', 'Continous Improvement', 1, 'Basic Emphaty: Empathy Circle (Listening Without Fixing)', 'M097', 'Building Empathy for Continuous Improvement'),
(48, 'CIO', 'Continous Improvement', 1, '7 Habits of Highly Effective People: Put First Things First', 'M098', 'Effective Prioritization'),
(49, 'CSO', 'Customer Orientation', 4, 'Sandwich Feedback for Supervisory', 'M099', 'Effective Feedback'),
(50, 'CSO', 'Customer Orientation', 4, 'Coaching & Feedback', 'M100', 'Supervisory Coaching & Development'),
(51, 'CSO', 'Customer Orientation', 3, 'Agile Mindset', 'M101', 'Agile Service Mindset'),
(52, 'CSO', 'Customer Orientation', 3, 'Assertive Communication Ladder', 'M102', 'Assertive Communication for Supervisor'),
(53, 'CSO', 'Customer Orientation', 2, 'Pareto Analysis (80/20)', 'M103', 'Applying the 80/20 Principle'),
(54, 'CSO', 'Customer Orientation', 2, 'Eisenhower Matrix', 'M104', 'Effective Daily Prioritization'),
(55, 'CSO', 'Customer Orientation', 1, 'Checklists & Work Documentation Essentials', 'M105', 'Effective Work Checklists'),
(56, 'CSO', 'Customer Orientation', 1, 'Basic Knowledge of 5S: Seiton', 'M106', 'Organizing Task at Workplace'),
(57, 'DCM', 'Decision Making', 4, 'Strategic Risk Mapping', 'M107', 'Risk Mapping'),
(58, 'DCM', 'Decision Making', 4, 'OODA Loop (Observe, Orient, Decide, Act)', 'M108', 'Quick Decision Making'),
(59, 'DCM', 'Decision Making', 3, 'DECIDE Model (Detect, Estimate, Choose, Identify, Do, Evaluate)', 'M109', 'Complex Decision Making'),
(60, 'DCM', 'Decision Making', 3, 'PDCA Cycle (Plan–Do–Check–Act)', 'M110', 'Process Improvement'),
(61, 'DCM', 'Decision Making', 2, 'SCAN Model (Situation, Choices, Action, Next Steps)', 'M111', 'Pengambilan Keputusan Berbasis Risiko di Pekerjaan Rutin'),
(62, 'DCM', 'Decision Making', 2, 'SWOT Analysis', 'M112', 'Systematic Decision Making'),
(63, 'DCM', 'Decision Making', 1, 'Routine Risk-Based Decision-Making', 'M113', 'Regularly Decision Making'),
(64, 'DCM', 'Decision Making', 1, 'Basic Decision-Making Skills', 'M114', 'Basic Decision Making Skills'),
(65, 'DIR', 'Directiveness', 4, 'Culture of Accountability', 'M115', 'Advanced Responsible Culture'),
(66, 'DIR', 'Directiveness', 4, 'Performance Management Fundamentals', 'M116', 'Performance Coaching'),
(67, 'DIR', 'Directiveness', 3, 'Problem Solving and Barrier Removal', 'M117', 'Problem Solving Culture'),
(68, 'DIR', 'Directiveness', 3, 'Giving and Receiving Feedback Effectively', 'M118', 'Constructive Feedback'),
(69, 'DIR', 'Directiveness', 2, 'Delegation Matrix (Tingkat Delegasi)', 'M119', 'Effective Task Delegation'),
(70, 'DIR', 'Directiveness', 2, 'SMART Goals Framework', 'M120', 'Setting Clear Action Plans'),
(71, 'DIR', 'Directiveness', 1, 'GROW Model (Goal-Reality-Options-Way Forward)', 'M121', 'Foundations of Coaching'),
(72, 'DIR', 'Directiveness', 1, '7 Habits of Highly Effective People: Begin with the End in Mind', 'M122', 'Basic Effective Work Strategies'),
(73, 'EMP', 'Empathy', 4, 'Social Intelligence at Work', 'M123', 'Workplace Social Intelligence'),
(74, 'EMP', 'Empathy', 4, 'Advanced Coaching for Leaders: GROW', 'M124', 'GROW Technique for Coaching'),
(75, 'EMP', 'Empathy', 3, 'Social Styles Model', 'M125', 'Empathy in Communication'),
(76, 'EMP', 'Empathy', 3, 'Three Types of Empathy (Daniel Goleman)', 'M126', 'Types of Empathy'),
(77, 'EMP', 'Empathy', 2, '7 Habits of Highly Effective People: Seek First to Understand, Then to Be Understood', 'M127', 'Empathy in Communication'),
(78, 'EMP', 'Empathy', 2, 'CLEAR Communication Model', 'M128', 'Openess Communication'),
(79, 'EMP', 'Empathy', 1, 'Social Styles Model', 'M129', 'Basic Emphaty for Effective Communication'),
(80, 'EMP', 'Empathy', 1, 'Basic Emphaty: Empathy Circle (Listening Without Fixing)', 'M130', 'Empathy for Active Listening'),
(81, 'FLX', 'Flexibility', 4, 'Situational Leadership Model (Hersey & Blanchard)', 'M131', 'Situational Leadership'),
(82, 'FLX', 'Flexibility', 4, 'Cynefin Framework', 'M132', 'Adaptive Decision Making'),
(83, 'FLX', 'Flexibility', 3, '7 Habits of Highly Effective People : Be Proactive', 'M133', 'Proactive Leadership'),
(84, 'FLX', 'Flexibility', 3, 'ADKAR Model (Prosci)', 'M134', 'ADKAR Change Management'),
(85, 'FLX', 'Flexibility', 2, 'Cognitive Flexibility Framework', 'M135', 'Cognitive Flexibility in Work'),
(86, 'FLX', 'Flexibility', 2, 'Situational Communication: Flexing Your Style', 'M136', 'Adapting Your Communication Style'),
(87, 'FLX', 'Flexibility', 1, 'Adaptability in the Workplace', 'M137', 'Adaptability in a Changing Workplace'),
(88, 'FLX', 'Flexibility', 1, 'Managing Ambiguity and Uncertainty', 'M138', 'Managing Uncertainty and Ambiguity'),
(89, 'IDS', 'Instructional Discipline', 4, 'Standardized Work and Operational Discipline', 'M139', 'Operational Discipline'),
(90, 'IDS', 'Instructional Discipline', 4, 'Advanced Coaching for Leaders', 'M140', 'Leadership Coaching Advanced'),
(91, 'IDS', 'Instructional Discipline', 3, 'Error-Proofing with Poka-Yoke', 'M141', 'Error-Proofing Techniques'),
(92, 'IDS', 'Instructional Discipline', 3, 'Job Instruction Training (JIT)', 'M142', 'Effective Job Instruction'),
(93, 'IDS', 'Instructional Discipline', 2, 'PDCA Cycle (Plan–Do–Check–Act)', 'M143', 'Continuous Improvement with PDCA'),
(94, 'IDS', 'Instructional Discipline', 2, '7 Habits of Highly Effective People: Be Proactive', 'M144', 'Taking Personal Responsibility'),
(95, 'IDS', 'Instructional Discipline', 1, 'Kaizen Mindset 101', 'M145', 'Implementing Kaizen for Efficiency'),
(96, 'IDS', 'Instructional Discipline', 1, 'Basic Knowledge of 5S: Shitsuke', 'M146', '5S for Workplace Discipline'),
(97, 'INT', 'Integrity', 4, 'Strategic Thinking untuk Manager', 'M147', 'Strategic Thinking for Managerial'),
(98, 'INT', 'Integrity', 4, 'Ethical Decision Making', 'M148', 'Ethical Leadership'),
(99, 'INT', 'Integrity', 3, 'Postconventional Moral Thinking', 'M149', 'Moral Ethics Behavior'),
(100, 'INT', 'Integrity', 3, 'Leading by Example: Supervisory Role Model', 'M150', 'Supervisory Leadership'),
(101, 'INT', 'Integrity', 2, '7 Habits of Highly Effective People : Be Proactive', 'M151', 'Taking Ownership of Actions'),
(102, 'INT', 'Integrity', 2, 'Compliance & Confidentiality', 'M152', 'Pilar Etika di Tempat Kerja'),
(103, 'INT', 'Integrity', 1, 'Basic Knowledge of Integrity', 'M153', 'A Guide to Workplace Integrity'),
(104, 'INT', 'Integrity', 1, 'T.H.I.N.K. Model', 'M154', 'Communicating with Integrity'),
(105, 'LDP', 'Leadership', 4, 'Leadership Competency in Industry 5.0', 'M155', 'Leadership on Industry 5.0'),
(106, 'LDP', 'Leadership', 4, 'Leading High-Performing Teams with Tuckman’s Model', 'M156', 'Build High-Performance Teams'),
(107, 'LDP', 'Leadership', 3, 'GRPI Model (Goals, Roles, Processes, Interpersonal)', 'M157', 'Team Development Effectivity'),
(108, 'LDP', 'Leadership', 3, 'Sandwich Feedback for Supervisory', 'M158', 'Effective Positive Feedback'),
(109, 'LDP', 'Leadership', 2, 'Leader vs Boss Comparison Model', 'M159', 'Leader vs Boss: Leadership Styles'),
(110, 'LDP', 'Leadership', 2, 'Ken Blanchard’s Situational Leadership Model', 'M160', 'Becoming an Adaptive Leader'),
(111, 'LDP', 'Leadership', 1, 'T.H.I.N.K. Model', 'M161', 'Enhancing Team Communication'),
(112, 'LDP', 'Leadership', 1, 'Kaizen Mindset 101', 'M162', 'Kaizen for Continuous Improvement'),
(113, 'LDC', 'Leading Change', 4, 'Force Field Analysis', 'M163', 'Change Force Analysis'),
(114, 'LDC', 'Leading Change', 4, 'OODA Loop (Observe, Orient, Decide, Act)', 'M164', 'Decision Making during Crisis'),
(115, 'LDC', 'Leading Change', 3, 'RACI Model for Manager', 'M165', 'RACI for Managers'),
(116, 'LDC', 'Leading Change', 3, 'ADKAR Model (Prosci)', 'M166', 'Managing Organizational Change'),
(117, 'LDC', 'Leading Change', 2, 'Strategic Problem Solving & Root Cause Analysis (Fishbone)', 'M167', 'Mastering Strategic Problem Solving'),
(118, 'LDC', 'Leading Change', 2, 'PDCA Cycle (Plan–Do–Check–Act)', 'M168', 'Optimizing Processes for Continuous Improvement'),
(119, 'LDC', 'Leading Change', 1, '7 Habits of Highly Effective People: Synergize', 'M169', 'Driving Team Collaboration and Synergy'),
(120, 'LDC', 'Leading Change', 1, 'Kotter’s 8-Step Change Model', 'M170', 'Navigating Organizational Change with Confidence'),
(121, 'LAG', 'Learning Agility', 4, 'SECI Model (Nonaka & Takeuchi)', 'M171', 'Knowledge Transformation'),
(122, 'LAG', 'Learning Agility', 4, 'Communities of Practice (Etienne Wenger)', 'M172', 'Building Collective Learning'),
(123, 'LAG', 'Learning Agility', 3, 'PDCA Cycle (Plan–Do–Check–Act)', 'M173', 'Continuous Improvement at Work'),
(124, 'LAG', 'Learning Agility', 3, 'After Action Review (AAR)', 'M174', 'Learning from Action'),
(125, 'LAG', 'Learning Agility', 2, 'Collaborative Problem Solving', 'M175', 'Effective Cross-Functional Team'),
(126, 'LAG', 'Learning Agility', 2, 'Feedback Seeking Behavior', 'M176', 'Accelerating Learning and Adaptation'),
(127, 'LAG', 'Learning Agility', 1, 'Learning Agility Framework', 'M177', 'Accelerating Learning and Adaptation'),
(128, 'LAG', 'Learning Agility', 1, 'Ikigai for Learning Agility', 'M178', 'Discovering Your Learning Methods'),
(129, 'PNO', 'Planning & Organizing', 4, 'Root Cause Analysis: Plan-Do-Check-Action', 'M179', 'PDCA for Problem Solving'),
(130, 'PNO', 'Planning & Organizing', 4, 'Strategic Thinking untuk Manager', 'M180', 'Strategic Thinking for Managers'),
(131, 'PNO', 'Planning & Organizing', 3, 'SWOT Analysis for Strategic Thinking', 'M181', 'Strategic Planning for Supervisor'),
(132, 'PNO', 'Planning & Organizing', 3, 'Strategic Problem Solving & Root Cause Analysis (Fishbone)', 'M182', 'Fishbone Problem Solving'),
(133, 'PNO', 'Planning & Organizing', 2, 'Kaizen Mindset 101', 'M183', 'Driving Efficiency at Work'),
(134, 'PNO', 'Planning & Organizing', 2, '4DX – Four Disciplines of Execution', 'M184', 'Achieving Goals with 4DX'),
(135, 'PNO', 'Planning & Organizing', 1, 'Time Management', 'M185', 'Basic Time Management'),
(136, 'PNO', 'Planning & Organizing', 1, 'Input–Process–Output (IPO) Thinking', 'M186', 'Basic Systematic Thinking'),
(137, 'PSG', 'Problem Solving', 4, 'Strategic Risk Mapping', 'M187', 'Risk Mapping Strategy for Manager'),
(138, 'PSG', 'Problem Solving', 4, 'Root Cause Analysis: Plan-Do-Check-Action', 'M188', 'Pareto Analysis for Problem Solving'),
(139, 'PSG', 'Problem Solving', 3, 'Strategic Problem Solving & Root Cause Analysis (Fishbone)', 'M189', 'Problem Solving using Root Cause'),
(140, 'PSG', 'Problem Solving', 3, 'Pareto Analysis (80/20)', 'M190', 'Prioritizing Skill for Optimal Results'),
(141, 'PSG', 'Problem Solving', 2, 'Decision-Making Sederhana untuk Pekerjaan Sehari-hari', 'M191', 'Decision-Making for Daily Tasks'),
(142, 'PSG', 'Problem Solving', 2, 'Critical Thinking', 'M192', 'Critical Thinking for Problem Solving'),
(143, 'PSG', 'Problem Solving', 1, 'Agile Mindset', 'M193', 'Agile Mindset for Daily Challenges'),
(144, 'PSG', 'Problem Solving', 1, 'Kaizen Mindset 101', 'M194', 'Implementing Kaizen for Continuous Improvement'),
(145, 'RBG', 'Relationship Building', 4, 'Alliance Lifecycle Management', 'M195', 'Building a Solid Teamwork'),
(146, 'RBG', 'Relationship Building', 4, 'RACI Model for Manager', 'M196', 'Conflict Resolution for Teams'),
(147, 'RBG', 'Relationship Building', 3, 'Sandwich Feedback for Supervisory', 'M197', 'Effective Delegation and Empowerment'),
(148, 'RBG', 'Relationship Building', 3, 'GRPI Model (Goals, Roles, Processes, Interpersonal Relationships)', 'M198', 'Task Management for Supervisor'),
(149, 'RBG', 'Relationship Building', 2, 'T.H.I.N.K. Model', 'M199', 'Ethical Communication'),
(150, 'RBG', 'Relationship Building', 2, 'Assertive Communication Ladder', 'M200', 'Speak Clearly, Stay Respectful'),
(151, 'RBG', 'Relationship Building', 1, 'Active Listening', 'M201', 'Active Listening for Relationships Building'),
(152, 'RBG', 'Relationship Building', 1, 'Johari Window', 'M202', 'Self-Awareness and Interpersonal Effectiveness'),
(153, 'RSC', 'Resilience', 4, 'COPE Model (Nina Josefowitz & David Myran)', 'M203', 'Effective Delegation Skills'),
(154, 'RSC', 'Resilience', 4, '4C of Change Readiness', 'M204', 'Building Trust in Teams'),
(155, 'RSC', 'Resilience', 3, 'Resilience in Volatility, Uncertainty, Complexity, Ambiguity', 'M205', 'Strategic Decision Making for Manager'),
(156, 'RSC', 'Resilience', 3, 'ABCDE Model of Stress Resilience', 'M206', 'Innovation Idea for Growth'),
(157, 'RSC', 'Resilience', 2, 'ABC Model of Stress (Albert Ellis – REBT)', 'M207', 'ABC Model for Stress'),
(158, 'RSC', 'Resilience', 2, 'STOP Technique of Emotional Control', 'M208', 'Emotional Control'),
(159, 'RSC', 'Resilience', 1, 'Time Management', 'M209', 'Managing Work Under Pressure'),
(160, 'RSC', 'Resilience', 1, 'Agile Mindset', 'M210', 'Agile Mindset for Workplace Resilience'),
(161, 'RSF', 'Resourcesfulness', 4, 'Visual Kanban Board', 'M211', 'Coaching for High Performance Team'),
(162, 'RSF', 'Resourcesfulness', 4, 'After Action Review (AAR)', 'M212', 'Post-Task Reflection Strategies'),
(163, 'RSF', 'Resourcesfulness', 3, 'Gantt Chart', 'M213', 'Visual Project Management Tools'),
(164, 'RSF', 'Resourcesfulness', 3, '5 Whys Identifications', 'M214', 'Root Cause Problem Identification'),
(165, 'RSF', 'Resourcesfulness', 2, 'Visual Management for Work', 'M215', 'Boosting Efficiency with Visual Management'),
(166, 'RSF', 'Resourcesfulness', 2, 'Effective Time and Task Management', 'M216', 'Effective Time on Task Management'),
(167, 'RSF', 'Resourcesfulness', 1, 'Lean Thinking Basics', 'M217', 'Lean Thinking'),
(168, 'RSF', 'Resourcesfulness', 1, 'Basic Knowledge of 5S: Shitsuke', 'M218', 'Basic Work Discipline for Productivity'),
(169, 'SIO', 'Self Improvement Orientation', 4, 'Learning Agility Framework', 'M219', 'Learning Agility for Leaders'),
(170, 'SIO', 'Self Improvement Orientation', 4, 'RACI Model for Manager', 'M220', 'RACI Model for Teams'),
(171, 'SIO', 'Self Improvement Orientation', 3, 'Career Planning Cycle', 'M221', 'Career Development Strategies'),
(172, 'SIO', 'Self Improvement Orientation', 3, 'ADKAR Model (Prosci)', 'M222', 'Effective Change Management'),
(173, 'SIO', 'Self Improvement Orientation', 2, 'Ikigai', 'M223', 'Finding Purpose and Passion in Work'),
(174, 'SIO', 'Self Improvement Orientation', 2, '70:20:10 Learning Framework', 'M224', 'Self Growth through Experience'),
(175, 'SIO', 'Self Improvement Orientation', 1, '7 Habit of Highly Effective People: Sharpen the Saw', 'M225', 'Upgrade Skill for Better Performance'),
(176, 'SIO', 'Self Improvement Orientation', 1, 'Growth Mindset (Carol Dweck)', 'M226', 'Growth Mindset: Kunci Mental Tangguh dan Bertumbuh'),
(177, 'TOR', 'Team Orientation', 4, 'The Five Behaviors of a Cohesive Team (Patrick Lencioni)', 'M227', 'Creating Effective Teamwork'),
(178, 'TOR', 'Team Orientation', 4, 'RACI Model for Manager', 'M228', 'Optimizing Project Roles'),
(179, 'TOR', 'Team Orientation', 3, 'Sandwich Feedback for Supervisory', 'M229', 'Feedback Technique for Supervisor'),
(180, 'TOR', 'Team Orientation', 3, 'GRPI Model (Goals, Roles, Processes, Interpersonal Relationships)', 'M230', 'Maximizing Team Synergy'),
(181, 'TOR', 'Team Orientation', 2, 'T.H.I.N.K. Model', 'M231', 'Komunikasi Etis dalam Tim'),
(182, 'TOR', 'Team Orientation', 2, 'Team Emotional Intelligence', 'M232', 'Emotional Intellegence for Team Development'),
(183, 'TOR', 'Team Orientation', 1, 'Tuckman\'s Team Development Model', 'M233', 'Tuckman’s Team Development Model'),
(184, 'TOR', 'Team Orientation', 1, 'Belbin Team Roles', 'M234', 'Understand Your Roles at Team');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`) VALUES
(4, 'admin', '$2a$10$i73dulm0qkkUwHfbgW80AuisPWji64sPnEwziy8mTiMOKxSOYcdMy');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `standard`
--
ALTER TABLE `standard`
  ADD PRIMARY KEY (`no`);

--
-- Indexes for table `training`
--
ALTER TABLE `training`
  ADD PRIMARY KEY (`no`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
