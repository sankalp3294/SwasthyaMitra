"""Small, idempotent demo dataset used by the local SQLite setup."""
from datetime import date, datetime, timedelta
import json

from sqlalchemy.orm import Session

from app.models import (
    Appointment, ASHAWorker, Case, CaseEvent, CommunitySignal, Department, Doctor, 
    Hospital, Intervention, LabTest, MedicineInventory, Patient, Slot, StaffCredential, User
)
from app.utils.passwords import hash_password


def seed_demo_data(db: Session) -> None:
    """Create useful local hospital, patient, and appointment data once."""
    if not db.query(Hospital).first():
        hospitals = [
            Hospital(
                name="Swasthya Nagar PHC",
                hospital_type="Primary Health Centre",
                address="12 Community Road, Swasthya Nagar",
                zone="Swasthya Nagar",
                district="Demo District",
                state="India",
                latitude=28.6139,
                longitude=77.2090,
                phone_number="1800-000-1001"
            ),
            Hospital(
                name="Jan Arogya Community Hospital",
                hospital_type="Community Health Centre",
                address="8 Wellness Avenue, Demo District",
                zone="Wellness Ward",
                district="Demo District",
                state="India",
                latitude=28.6304,
                longitude=77.2177,
                phone_number="1800-000-1002"
            ),
            Hospital(
                name="Apex District Hospital & Trauma Center",
                hospital_type="District Hospital & ER",
                address="45 Hospital Ring Road, District Center",
                zone="District Center",
                district="Demo District",
                state="India",
                latitude=28.5800,
                longitude=77.2300,
                phone_number="1800-000-1003"
            ),
            Hospital(
                name="Sanjivani Rural Healthcare Clinic",
                hospital_type="Sub-District Health Centre",
                address="19 Green Valley Road, Rural Zone 2",
                zone="Green Valley",
                district="Demo District",
                state="India",
                latitude=28.6500,
                longitude=77.1800,
                phone_number="1800-000-1004"
            ),
            Hospital(
                name="Metro Care Super-Specialty ER",
                hospital_type="Super Specialty Hospital",
                address="102 Metro Expressway, Metro Central",
                zone="Metro Central",
                district="Demo District",
                state="India",
                latitude=28.6000,
                longitude=77.1900,
                phone_number="1800-000-1005"
            ),
        ]
        db.add_all(hospitals)
        db.flush()

        dept_names = [
            ("General Medicine", "General consultation and primary care"),
            ("Ophthalmology (Eye Care)", "Eye specialist OPD, cataract, vision testing"),
            ("Cardiology (Heart Care)", "Heart specialist OPD, BP, cardiac evaluation"),
            ("Orthopedics (Bone & Joint)", "Bone, joint, spine, and fracture OPD"),
            ("Dermatology (Skin Care)", "Skin, allergic rash, and skin lesion OPD"),
            ("ENT (Ear Nose Throat)", "Ear, nose, throat, and sinus specialist OPD"),
            ("Pediatrics (Child Care)", "Child specialist and infant care OPD"),
        ]

        for hospital in hospitals:
            for d_name, d_desc in dept_names:
                db.add(Department(hospital_id=hospital.id, name=d_name, description=d_desc))
            for offset in range(0, 5):
                slot_date = (date.today() + timedelta(days=offset)).isoformat()
                for start, end in (("09:00", "09:30"), ("10:00", "10:30"), ("11:00", "11:30"), ("14:00", "14:30")):
                    db.add(Slot(hospital_id=hospital.id, date=slot_date, start_time=start, end_time=end, capacity=5, available_count=5))
        db.commit()

    demo_staff = {
        "doctor@swasthyamitra.demo": ("9876543212", "doctor"),
        "asha@swasthyamitra.demo": ("9876543213", "asha"),
        "cmo@swasthyamitra.demo": ("9876543215", "chief_doctor"),
        "admin@swasthyamitra.demo": ("9876543214", "admin"),
    }
    for email, (phone_number, role) in demo_staff.items():
        user = db.query(User).filter(User.phone_number == phone_number).first()
        if not user:
            user = User(phone_number=phone_number, role=role)
            db.add(user)
            db.flush()
        if not db.query(StaffCredential).filter(StaffCredential.email == email).first():
            db.add(StaffCredential(user_id=user.id, email=email, password_hash=hash_password("Demo@123")))
        if role == "doctor" and not db.query(Doctor).filter(Doctor.user_id == user.id).first():
            hospital = db.query(Hospital).first()
            dept = db.query(Department).filter(Department.hospital_id == hospital.id, Department.name.like("%Ophthalmology%")).first() or db.query(Department).first()
            db.add(Doctor(
                user_id=user.id,
                name="Dr. Sunita Verma (Eye Specialist)",
                qualification="MBBS, MS Ophthalmology",
                specialization="Ophthalmology (Eye Specialist)",
                registration_number="EYE-98765",
                hospital_id=hospital.id if hospital else None,
                department_id=dept.id if dept else None
            ))
        if role == "asha" and not db.query(ASHAWorker).filter(ASHAWorker.user_id == user.id).first():
            hospital = db.query(Hospital).first()
            db.add(ASHAWorker(
                user_id=user.id,
                name="Demo ASHA Worker",
                phone_number=phone_number,
                zone=hospital.zone if hospital else "Demo Zone",
                assigned_hospital_id=hospital.id if hospital else None
            ))
    db.commit()

    # Seed Demo Patients & Clinical Appointments if empty
    hospital = db.query(Hospital).first()
    doctor = db.query(Doctor).first()
    slot = db.query(Slot).first()
    # Seed Demo Patients & Cases
    patients_data = [
        {
            "phone": "9876543210",
            "name": "Ramesh Kumar",
            "age": 35,
            "gender": "Male",
            "email": "ramesh.kumar@example.com",
            "address": "House 42, Swasthya Nagar, District Demo",
            "blood_group": "O+",
            "medical_history": "Hypertension (2 years), No known drug allergies",
            "complaint": "High fever, persistent cough, and mild chest discomfort for 3 days.",
            "triage": "MODERATE",
            "status": "CONFIRMED",
            "notes": None
        },
        {
            "phone": "9876543211",
            "name": "Anil Verma (Eye Patient)",
            "age": 42,
            "gender": "Male",
            "email": "anil.verma@example.com",
            "address": "House 14, Eye Care Ward, Swasthya Nagar",
            "blood_group": "B+",
            "medical_history": "Computer eye strain, uses reading glasses",
            "complaint": "Eye sight issue: Severe eye redness, blurred vision, watery eyes, and acute eye pain for 2 days.",
            "triage": "MODERATE",
            "status": "CONFIRMED",
            "notes": None
        },
        {
            "phone": "9876543216",
            "name": "Sunita Devi",
            "age": 38,
            "gender": "Female",
            "email": "sunita.devi@example.com",
            "address": "Ward 5, Wellness Ward, District Demo",
            "blood_group": "B+",
            "medical_history": "Asthma in childhood",
            "complaint": "Severe throbbing headache, dizziness, and nausea for 2 days.",
            "triage": "URGENT",
            "status": "REQUESTED",
            "notes": None
        },
        {
            "phone": "9876543216",
            "name": "Amit Patel",
            "age": 52,
            "gender": "Male",
            "email": "amit.patel@example.com",
            "address": "Plot 19, Swasthya Nagar",
            "blood_group": "A+",
            "medical_history": "Type 2 Diabetes, Regular checkup needed",
            "complaint": "Routine health checkup and joint knee stiffness.",
            "triage": "LOW",
            "status": "COMPLETED",
            "notes": json.dumps({
                "diagnosis": "Viral Fever & Fatigue",
                "clinical_notes": "Patient presented with mild fever and fatigue. Vitals normal. BP 120/80.",
                "medications": [
                    {"name": "Paracetamol 500mg", "dosage": "1 tablet", "frequency": "Twice daily after meals", "duration": "5 days"},
                    {"name": "Vitamin C 500mg", "dosage": "1 tablet", "frequency": "Once daily", "duration": "7 days"}
                ],
                "referral": "None required",
                "follow_up_date": (date.today() + timedelta(days=7)).isoformat()
            })
        },
        {
            "phone": "9876543217",
            "name": "Priya Sharma",
            "age": 28,
            "gender": "Female",
            "email": "priya.sharma@example.com",
            "address": "Flat 12, Central Zone",
            "blood_group": "AB+",
            "medical_history": "Acidity and gastritis history",
            "complaint": "Acute stomach ache, acidity, and digestive discomfort after dinner.",
            "triage": "MODERATE",
            "status": "REQUESTED",
            "notes": None
        },
        {
            "phone": "9876543218",
            "name": "Rajesh Verma",
            "age": 45,
            "gender": "Male",
            "email": "rajesh.verma@example.com",
            "address": "House 108, North District",
            "blood_group": "O-",
            "medical_history": "Seasonal bronchitis",
            "complaint": "Sudden chest tightness and shortness of breath when walking.",
            "triage": "URGENT",
            "status": "ATTENDED",
            "notes": None
        }
    ]

    for pdata in patients_data:
        patient = db.query(Patient).filter(Patient.phone_number == pdata["phone"]).first()
        if not patient:
            user = db.query(User).filter(User.phone_number == pdata["phone"]).first()
            if not user:
                user = User(phone_number=pdata["phone"], role="patient")
                db.add(user)
                db.flush()
            patient = Patient(
                user_id=user.id,
                health_id=f"SM-PAT-{pdata['phone'][-6:]}",
                name=pdata["name"],
                age=pdata["age"],
                gender=pdata["gender"],
                email=pdata["email"],
                address=pdata["address"],
                blood_group=pdata["blood_group"],
                medical_history=pdata["medical_history"],
                phone_number=pdata["phone"],
                location=hospital.zone if hospital else "Swasthya Nagar",
                is_profile_complete=True
            )
            db.add(patient)
            db.flush()

            # Create Case
            c = Case(
                patient_id=patient.id,
                presenting_complaint=pdata["complaint"],
                symptoms=pdata["complaint"],
                triage_level=pdata["triage"],
                severity=pdata["triage"],
                case_status=pdata["status"]
            )
            db.add(c)
            db.flush()

            # Create Appointment
            appt = db.query(Appointment).filter(Appointment.patient_id == patient.id).first()
            if not appt:
                appt = Appointment(
                    case_id=c.id,
                    patient_id=patient.id,
                    hospital_id=hospital.id if hospital else 1,
                    doctor_id=doctor.id if doctor else None,
                    slot_id=slot.id if slot else None,
                    appointment_date=date.today().isoformat(),
                    appointment_time="10:00",
                    appointment_status=pdata["status"],
                    check_in_status="CHECKED_IN" if pdata["status"] in ["CONFIRMED", "COMPLETED"] else "PENDING",
                    notes=pdata["notes"]
                )
                db.add(appt)
                db.flush()

            # Seed demo Lab Test for Amit Patel
            if pdata["name"] == "Amit Patel":
                if not db.query(LabTest).filter(LabTest.patient_id == patient.id).first():
                    db.add(LabTest(
                        patient_id=patient.id,
                        case_id=c.id,
                        appointment_id=appt.id,
                        test_name="Complete Blood Count (CBC)",
                        test_category="Blood Test",
                        status="COMPLETED",
                        result_summary="Hb: 14.2 g/dL (Normal) | WBC: 6,800/mcL | Platelets: 250,000/mcL",
                        result_notes="All blood parameters within normal limits.",
                        ordered_by="Dr. Demo Doctor"
                    ))

    # Seed Demo Medicine Stock Inventory
    if not db.query(MedicineInventory).first():
        meds = [
            MedicineInventory(name="Paracetamol 500mg", generic_name="Acetaminophen", category="Analgesic & Antipyretic", dosage_form="Tablet", strength="500mg", stock_quantity=450, reorder_level=50, unit="tablets", batch_number="BN-2026-01", expiry_date="2027-12-31", manufacturer="Generic Pharma", is_essential=True),
            MedicineInventory(name="Paracetamol 650mg (Dolo)", generic_name="Acetaminophen", category="Analgesic & Antipyretic", dosage_form="Tablet", strength="650mg", stock_quantity=320, reorder_level=50, unit="tablets", batch_number="BN-2026-02", expiry_date="2027-10-30", manufacturer="Micro Labs", is_essential=True),
            MedicineInventory(name="Pantoprazole 40mg", generic_name="Pantoprazole Sodium", category="Antacid / PPI", dosage_form="Capsule", strength="40mg", stock_quantity=180, reorder_level=30, unit="capsules", batch_number="BN-2026-03", expiry_date="2027-08-15", manufacturer="Sun Pharma", is_essential=True),
            MedicineInventory(name="Amoxicillin 500mg", generic_name="Amoxicillin Trihydrate", category="Antibiotic", dosage_form="Capsule", strength="500mg", stock_quantity=200, reorder_level=40, unit="capsules", batch_number="BN-2026-04", expiry_date="2027-11-20", manufacturer="Cipla", is_essential=True),
            MedicineInventory(name="Azithromycin 500mg", generic_name="Azithromycin Dihydrate", category="Antibiotic", dosage_form="Tablet", strength="500mg", stock_quantity=25, reorder_level=30, unit="tablets", batch_number="BN-2026-05", expiry_date="2027-06-30", manufacturer="Zydus Cadila", is_essential=True),
            MedicineInventory(name="Cetirizine 10mg", generic_name="Cetirizine Hydrochloride", category="Antihistamine", dosage_form="Tablet", strength="10mg", stock_quantity=500, reorder_level=50, unit="tablets", batch_number="BN-2026-06", expiry_date="2028-01-15", manufacturer="Dr. Reddy's", is_essential=True),
            MedicineInventory(name="Metformin 500mg", generic_name="Metformin Hydrochloride", category="Antidiabetic", dosage_form="Tablet", strength="500mg", stock_quantity=600, reorder_level=100, unit="tablets", batch_number="BN-2026-07", expiry_date="2027-09-30", manufacturer="Lupin", is_essential=True),
            MedicineInventory(name="Amlodipine 5mg", generic_name="Amlodipine Besylate", category="Antihypertensive", dosage_form="Tablet", strength="5mg", stock_quantity=350, reorder_level=50, unit="tablets", batch_number="BN-2026-08", expiry_date="2027-05-15", manufacturer="Torrent Pharma", is_essential=True),
            MedicineInventory(name="ORS (Oral Rehydration Salts)", generic_name="Sodium Chloride + Glucose", category="Electrolytes", dosage_form="Sachet", strength="21.8g", stock_quantity=150, reorder_level=20, unit="sachets", batch_number="BN-2026-09", expiry_date="2028-03-31", manufacturer="Government Supply", is_essential=True),
            MedicineInventory(name="Dexamethasone 4mg", generic_name="Dexamethasone", category="Corticosteroid", dosage_form="Injection", strength="4mg/ml", stock_quantity=0, reorder_level=20, unit="vials", batch_number="BN-2026-10", expiry_date="2026-12-31", manufacturer="Alkem", is_essential=True)
        ]
        db.add_all(meds)

    # Seed Demo Outbreak Signals & Pending Interventions for CMO
    if not db.query(CommunitySignal).first():
        sig1 = CommunitySignal(
            zone="Swasthya Nagar",
            symptom_group="Acute Respiratory Illness & High Fever Cluster",
            risk_level="RED",
            observed_count=48,
            baseline_count=12,
            confidence=0.92
        )
        sig2 = CommunitySignal(
            zone="Wellness Ward",
            symptom_group="Febrile Rash & Dengue Cluster",
            risk_level="ORANGE",
            observed_count=24,
            baseline_count=8,
            confidence=0.85
        )
        db.add_all([sig1, sig2])
        db.flush()

        interventions = [
            Intervention(
                signal_id=sig1.id,
                zone="Swasthya Nagar",
                intervention_type="Mobile Medical Unit & Emergency Doctor Camp Deployment",
                authorized_by="Chief Medical Officer",
                decision="PENDING",
                decision_notes="Emergency deployment of 2 mobile medical vans, 4 doctors, and 1000 fever testing kits to contain acute fever cluster.",
                start_date=date.today().isoformat()
            ),
            Intervention(
                signal_id=sig2.id,
                zone="Wellness Ward",
                intervention_type="Public Health Advisory & ASHA Vector Screening",
                authorized_by="Chief Medical Officer",
                decision="PENDING",
                decision_notes="Issue public water sanitation advisory and reassign 10 ASHA workers for door-to-door dengue screening.",
                start_date=date.today().isoformat()
            ),
            Intervention(
                signal_id=sig1.id,
                zone="Swasthya Nagar",
                intervention_type="PHC Emergency Medicine Stock Replenishment",
                authorized_by="Chief Medical Officer",
                decision="APPROVED",
                decision_notes="Approved immediate dispatch of 500 units Paracetamol, ORS sachets, and IV fluids to Swasthya Nagar PHC.",
                start_date=date.today().isoformat()
            )
        ]
        db.add_all(interventions)

    # Seed Demo ASHA Worker Profile & Assignments
    if not db.query(ASHAWorker).first():
        asha = ASHAWorker(
            name="Sunita Devi (ASHA)",
            phone_number="9876543213",
            zone="Swasthya Nagar",
            is_active=True
        )
        db.add(asha)
        db.flush()

        assignments = [
            ASHAAssignment(
                asha_worker_id=asha.id,
                case_id=1,
                task_type="Post-Consultation Recovery & Medicine Adherence Check",
                priority="URGENT",
                assignment_status="ASSIGNED",
                assigned_date=date.today().isoformat(),
                notes="Visit Ramesh Kumar at home. Check blood pressure, verify Paracetamol 500mg compliance, and inspect fever status."
            ),
            ASHAAssignment(
                asha_worker_id=asha.id,
                case_id=2,
                task_type="Maternal & Child Health Screening",
                priority="ROUTINE",
                assignment_status="ASSIGNED",
                assigned_date=date.today().isoformat(),
                notes="Visit Sunita Devi. Check infant weight, nutrition supplement intake, and schedule follow-up vaccination."
            ),
            ASHAAssignment(
                asha_worker_id=asha.id,
                case_id=3,
                task_type="Community Dengue / Fever Screening",
                priority="URGENT",
                assignment_status="COMPLETED",
                assigned_date=(date.today() - timedelta(days=2)).isoformat(),
                follow_up_date=(date.today() - timedelta(days=1)).isoformat(),
                follow_up_notes="Visited Amit Patel home. Temp 98.4 F (Normal). Patient taking prescribed Amoxicillin and recovers well.",
                outcome="RECOVERED"
            )
        ]
        db.add_all(assignments)

    db.commit()
