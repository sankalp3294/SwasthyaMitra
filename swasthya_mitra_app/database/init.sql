-- SwasthyaMitra Database Schema
-- Complete database initialization

-- ===== USERS =====
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'patient',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== PATIENTS =====
CREATE TABLE IF NOT EXISTS patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(20),
    language_preference VARCHAR(50) DEFAULT 'en',
    location VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_phone (phone_number),
    INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== PATIENT SESSIONS =====
CREATE TABLE IF NOT EXISTS patient_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6),
    otp_attempts INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    session_token VARCHAR(500) UNIQUE,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_phone (phone_number),
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== CASES =====
CREATE TABLE IF NOT EXISTS cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    case_status VARCHAR(50) DEFAULT 'NEW',
    symptoms LONGTEXT,
    presenting_complaint LONGTEXT,
    duration VARCHAR(100),
    severity VARCHAR(20),
    triage_level VARCHAR(20),
    ai_confidence FLOAT,
    extracted_entities LONGTEXT,
    conversation_history LONGTEXT,
    notes LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_status (case_status),
    INDEX idx_triage (triage_level),
    INDEX idx_patient (patient_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== CASE EVENTS =====
CREATE TABLE IF NOT EXISTS case_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    event_type VARCHAR(100),
    event_data LONGTEXT,
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case (case_id),
    INDEX idx_type (event_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== HOSPITALS =====
CREATE TABLE IF NOT EXISTS hospitals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT,
    address LONGTEXT,
    zone VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_zone (zone),
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== DEPARTMENTS =====
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT NOT NULL,
    name VARCHAR(255),
    description LONGTEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    INDEX idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== DOCTORS =====
CREATE TABLE IF NOT EXISTS doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    hospital_id INT NOT NULL,
    department_id INT NOT NULL,
    name VARCHAR(255),
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    registration_number VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_hospital (hospital_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== SLOTS =====
CREATE TABLE IF NOT EXISTS slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT NOT NULL,
    date VARCHAR(20),
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    capacity INT DEFAULT 5,
    available_count INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    INDEX idx_hospital (hospital_id),
    INDEX idx_date (date),
    INDEX idx_available (available_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== APPOINTMENTS =====
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    patient_id INT NOT NULL,
    hospital_id INT NOT NULL,
    doctor_id INT,
    slot_id INT,
    appointment_status VARCHAR(50) DEFAULT 'REQUESTED',
    appointment_date VARCHAR(20),
    appointment_time VARCHAR(20),
    check_in_status VARCHAR(50) DEFAULT 'PENDING',
    check_in_time DATETIME,
    notes LONGTEXT,
    no_show_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (slot_id) REFERENCES slots(id),
    INDEX idx_status (appointment_status),
    INDEX idx_patient (patient_id),
    INDEX idx_date (appointment_date),
    INDEX idx_check_in (check_in_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ASHA WORKERS =====
CREATE TABLE IF NOT EXISTS asha_workers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255),
    phone_number VARCHAR(20),
    zone VARCHAR(100),
    assigned_hospital_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id),
    INDEX idx_zone (zone),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ASHA ASSIGNMENTS =====
CREATE TABLE IF NOT EXISTS asha_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    asha_worker_id INT,
    case_id INT,
    assignment_reason VARCHAR(100),
    assignment_status VARCHAR(50) DEFAULT 'ASSIGNED',
    follow_up_date VARCHAR(20),
    follow_up_notes LONGTEXT,
    outcome VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (asha_worker_id) REFERENCES asha_workers(id),
    FOREIGN KEY (case_id) REFERENCES cases(id),
    INDEX idx_status (assignment_status),
    INDEX idx_worker (asha_worker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== COMMUNITY SIGNALS =====
CREATE TABLE IF NOT EXISTS community_signals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    zone VARCHAR(100),
    symptom_group VARCHAR(255),
    observed_count INT DEFAULT 0,
    baseline_count INT DEFAULT 0,
    time_window_start VARCHAR(20),
    time_window_end VARCHAR(20),
    anomaly_score FLOAT DEFAULT 0.0,
    severity_indicators LONGTEXT,
    risk_level VARCHAR(20) DEFAULT 'GREEN',
    confidence FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_zone (zone),
    INDEX idx_symptom (symptom_group),
    INDEX idx_risk (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== INTERVENTIONS =====
CREATE TABLE IF NOT EXISTS interventions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    signal_id INT,
    zone VARCHAR(100),
    intervention_type VARCHAR(100),
    decision VARCHAR(50),
    authorized_by VARCHAR(100),
    decision_notes LONGTEXT,
    intervention_details LONGTEXT,
    start_date VARCHAR(20),
    end_date VARCHAR(20),
    outcomes LONGTEXT,
    status VARCHAR(50) DEFAULT 'PLANNED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_zone (zone),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== AUDIT LOGS =====
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id INT,
    performed_by VARCHAR(255),
    old_value LONGTEXT,
    new_value LONGTEXT,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
