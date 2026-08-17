-- SwasthyaMitra Database Seeding
-- Seed data for development and testing

-- ===== HOSPITALS (Seeded Government Hospitals) =====
INSERT INTO hospitals (name, hospital_type, latitude, longitude, address, zone, district, state, phone_number) VALUES
('Metro Government Hospital', 'District Hospital', 28.7041, 77.1025, '123 Main Street, Central Zone', 'Central', 'Delhi', 'Delhi', '011-12345678'),
('North Medical Center', 'CHC', 28.7500, 77.1200, '456 North Avenue, North Zone', 'North', 'Delhi', 'Delhi', '011-87654321'),
('South Community Health Center', 'PHC', 28.6500, 77.1500, '789 South Road, South Zone', 'South', 'Delhi', 'Delhi', '011-55555555'),
('East Primary Health Center', 'PHC', 28.6100, 77.2700, '321 East Boulevard, East Zone', 'East', 'Delhi', 'Delhi', '011-66666666'),
('West Hospital Complex', 'CHC', 28.6700, 76.9800, '654 West Street, West Zone', 'West', 'Delhi', 'Delhi', '011-77777777');

-- ===== DEPARTMENTS =====
INSERT INTO departments (hospital_id, name, description) VALUES
(1, 'General Medicine', 'General medical services and consultations'),
(1, 'Pediatrics', 'Children health services'),
(1, 'Emergency', 'Emergency and critical care'),
(2, 'General Medicine', 'General medical services'),
(2, 'Obstetrics', 'Pregnancy and childbirth services'),
(3, 'General Medicine', 'Primary health care'),
(4, 'General Medicine', 'Community health services'),
(5, 'General Medicine', 'General medical consultation');

-- ===== SAMPLE USERS (for testing) =====
INSERT INTO users (phone_number, role) VALUES
('9876543210', 'patient'),
('9876543211', 'patient'),
('9876543212', 'doctor'),
('9876543213', 'asha'),
('9876543214', 'admin'),
('9876543215', 'chief_doctor');

-- ===== SAMPLE PATIENTS =====
INSERT INTO patients (user_id, name, age, gender, language_preference, location, latitude, longitude, phone_number) VALUES
(1, 'Rajesh Kumar', 45, 'M', 'en', 'Central', 28.7041, 77.1025, '9876543210'),
(2, 'Priya Singh', 32, 'F', 'en', 'North', 28.7500, 77.1200, '9876543211');

-- ===== SAMPLE DOCTORS =====
INSERT INTO doctors (user_id, hospital_id, department_id, name, qualification, specialization, registration_number) VALUES
(3, 1, 1, 'Dr. Amit Patel', 'MBBS, MD', 'Internal Medicine', 'REG123456');

-- ===== SAMPLE ASHA WORKERS =====
INSERT INTO asha_workers (user_id, name, phone_number, zone, assigned_hospital_id) VALUES
(4, 'Sunita Devi', '9876543213', 'Central', 1);

-- ===== APPOINTMENT SLOTS (Next 7 days) =====
INSERT INTO slots (hospital_id, date, start_time, end_time, capacity, available_count) VALUES
-- Metro Government Hospital
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '10:00', 5, 5),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00', '11:00', 5, 5),
(1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00', '10:00', 5, 5),
(1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00', '15:00', 5, 5),
-- North Medical Center
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '10:00', 4, 4),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00', '12:00', 4, 4),
(2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00', '10:00', 4, 4),
-- South Community Health Center
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00', '11:00', 3, 3),
(3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00', '11:00', 3, 3),
-- East Primary Health Center
(4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '10:00', 4, 4),
-- West Hospital Complex
(5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '10:00', 5, 5);

-- ===== SAMPLE CASES (for testing) =====
INSERT INTO cases (patient_id, case_status, presenting_complaint, symptoms, duration, severity, triage_level) VALUES
(1, 'TRIAGED', 'Fever and cough', 'High fever, persistent dry cough', '3 days', 'moderate', 'MODERATE'),
(2, 'TRIAGED', 'Headache and fatigue', 'Severe headache, body ache', '2 days', 'mild', 'LOW');

-- ===== SAMPLE COMMUNITY SIGNALS =====
INSERT INTO community_signals (zone, symptom_group, observed_count, baseline_count, risk_level, confidence) VALUES
('Central', 'Fever', 8, 2, 'ORANGE', 0.85),
('North', 'Cough', 5, 2, 'YELLOW', 0.75),
('South', 'Fever', 3, 3, 'GREEN', 0.9);
