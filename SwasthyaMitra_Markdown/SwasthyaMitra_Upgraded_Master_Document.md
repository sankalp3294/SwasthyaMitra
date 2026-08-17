SWASTHYAMITRA

UPGRADED SIH MASTER DOCUMENT

AI-Driven Public Health, Healthcare Access & Community Health Intelligence Platform

# 1. Executive Summary

SwasthyaMitra is the upgraded evolution of the original SIH AI health-information chatbot. The original concept remains: disease awareness, health Q&A, symptom understanding, multilingual interaction, prevention, government health resources and basic triage. The upgrade turns it into a closed-loop healthcare-access system: the patient can receive priority-oriented guidance, find a suitable government hospital, book a doctor appointment, receive one rebooking opportunity after a first no-show, and be escalated to an ASHA worker after a second missed appointment or an authorized follow-up trigger. In parallel, privacy-protected aggregated symptom signals are analyzed by zone for unusual patterns. AI creates an internal signal; the Chief Doctor reviews it and decides whether to monitor, investigate, deploy a team, conduct a camp, or issue an authorized public advisory. The platform therefore connects individual care coordination with community-health intelligence.

# 2. Source Foundation and Original SIH Concept

The previous master document defines SwasthyaMitra as an AI-driven public-health platform focused on disease awareness, basic symptom guidance, prevention, health resources and government health schemes, and describes the original chatbot as supporting health Q&A, symptom checking/triage, multilingual access and emergency guidance. fileciteturn5file0L14-L30

The previous document also defines the upgraded chain as Patient → AI → Verification → Triage → Appointment → Hospital → ASHA → Follow-up → Outcome. fileciteturn5file0L44-L64

# 3. Problems Addressed

Patients may lack simple, reliable health information.

Language and accessibility barriers reduce digital-health usefulness.

Patients may not know which government facility or department to use.

Patients can receive digital guidance but fail to reach a doctor.

Missed appointments can become disconnected cases.

Community-level increases in similar symptoms can be difficult to detect from disconnected cases.

Automatic public alerts can create unnecessary panic; community intervention requires professional review.

# 4. Complete SwasthyaMitra Flow

Patient → Verification → AI Conversation → Disease Awareness OR Healthcare Pathway → Symptom/Intent Extraction → Priority Triage → Government Hospital Selection → Slot Booking → Attendance → Doctor → First No-show → One Rebooking → Second No-show → ASHA Follow-up → Hospital Outcome.

Parallel community loop: aggregated case signals → zone analysis → cluster detection → Green/Yellow/Orange/Red internal signal → Chief Doctor review → decision → optional health camp/intervention → outcome → reassessment.

# 5. Module 1 — Patient Interface

Registration/verified session

Language selection

Conversational health questions

Symptom reporting

Appointment request

Appointment status

Follow-up status

Accessibility support

Output: a verified patient interaction and, when relevant, a structured case.

# 6. Module 2 — Identity & Session Verification

Prototype: mobile OTP/session verification. Verification protects the appointment workflow; it does not prove that a person is sick.

Verified session

Patient-case linkage

Appointment ownership

Duplicate-booking checks

Role-controlled access

# 7. Module 3 — AI Conversational Engine

Intent detection

Symptom/entity extraction

Duration/severity extraction where relevant

Structured follow-up questions

Supported-language handling

Health-information retrieval/response

Conversation-state management

Example: a natural-language symptom description is converted into structured case information.

# 8. Module 4 — Disease Awareness & Health Information

This preserves the original SIH model. General questions can receive disease-awareness information without automatically creating an appointment.

Disease information

Symptoms/risk-factor awareness

Prevention

General precautions

When professional assessment may be appropriate

Government/public-health resources

Emergency guidance

Boundary: information is not a diagnosis.

# 9. Module 5 — AI Priority Triage

Triage determines workflow priority, not diagnosis and not whether a patient deserves care.

LOW — routine medical evaluation/pathway

MODERATE — higher-priority medical evaluation

URGENT — potentially serious warning signs requiring appropriate urgent professional care

All patients entering the medical-care pathway can receive an opportunity for professional evaluation; priority controls handling and urgency.

# 10. Module 6 — Government Hospital Selection

Patient location/zone

Suitable government facility

Relevant department/service

Configured availability

Priority

Optional patient preference

Prototype output: ranked suitable facilities and available slots.

# 11. Module 7 — Appointment & Slot Management

Show slots

Patient selects slot

Generate appointment ID

Link appointment to case/hospital/doctor

Confirm appointment

Reminder/status

Demo QR/OTP check-in

Core states: REQUESTED → CONFIRMED → ATTENDED or NO-SHOW → REBOOKED or ESCALATED.

# 12. Module 8 — Appointment Verification, No-Show & Rebooking

The system verifies appointment behavior rather than trying to prove illness.

Verified session

One active appointment per case unless authorized

Duplicate/rapid-booking detection

Confirmation requirement

Check-in verification

First no-show → one rebooking

Second no-show → ASHA escalation

Repeated abuse/no-shows → human review

# 13. Module 9 — Hospital / Doctor Dashboard

New cases

Priority

Appointment schedule

Attendance/check-in

No-show/rebooking status

ASHA cases

ASHA updates

Case history/events

Completed/referred/further-follow-up status

The hospital dashboard is the operational center of the individual-care workflow.

# 14. Module 10 — ASHA Assignment & Follow-up

ASHA workers are the human last-mile follow-up layer. They do not diagnose.

Receive assigned case

View authorized follow-up information

Contact/visit patient

Record reached/not reached

Record relevant barriers/status

Escalate to hospital

Submit follow-up outcome

Primary hackathon trigger: second missed appointment. Future versions can support additional authorized follow-up triggers.

# 15. Module 11 — Individual Case State Machine

Normal path: NEW → AI ASSESSED → TRIAGED → APPOINTMENT REQUESTED → CONFIRMED → ATTENDED → DOCTOR REVIEW → FOLLOW-UP → RESOLVED / REFERRED / FURTHER FOLLOW-UP.

No-show path: CONFIRMED → NO-SHOW → REBOOKED → NO-SHOW → ASHA ASSIGNED → ASHA FOLLOW-UP → HOSPITAL REVIEW → OUTCOME.

# 16. Module 12 — Community Health Intelligence

The community module uses privacy-protected, aggregated health-event signals rather than exposing individual patient identities.

Group similar symptom signals by zone/time

Compare current activity with baseline

Measure trend/rate of increase

Detect geographic concentration

Consider population and data quality

Generate internal potential-cluster signal

Example: a zone normally reporting 8 similar symptom events/week reports 27. The system flags the unusual pattern for Chief Doctor review. This is not an outbreak declaration.

# 17. Module 13 — Zone Risk Classification

GREEN — expected range; routine monitoring

YELLOW — increased signal; enhanced monitoring/review

ORANGE — significant unusual pattern; Chief Doctor review

RED — strong/serious signal; priority review

Risk should consider baseline, population, trend, time window, geographic concentration, severity indicators and data quality—not raw count alone.

# 18. Module 14 — Chief Doctor Decision Layer

AI never automatically sends a public alert or declares an outbreak. Flow: AI signal → internal Chief Doctor review → human decision.

No action/dismiss

Continue monitoring

Investigate

Deploy medical team

Approve targeted health camp

Issue public advisory only when the authorized authority decides

Principle: AI detects/recommends; the Chief Doctor decides.

# 19. Module 15 — Health Camp Management

Select affected zone

Choose approved location

Schedule camp

Assign doctors/nurses/required health staff

Coordinate ASHA/community support

Record aggregated camp outcomes

The exact team and intervention are determined by the responsible health authority.

# 20. Module 16 — Intervention Outcome & Feedback

Camp/intervention outcomes are recorded and used to reassess subsequent aggregated trends. A change from RED to ORANGE/YELLOW/GREEN is an operational monitoring signal, not proof that a disease has been eliminated.

# 21. Role-Based Access

Patient — own profile, cases, appointments, guidance and follow-up status.

AI — conversation, extraction, triage support, routing recommendations and pattern detection.

Doctor/Hospital Staff — assigned patient cases, appointments, clinical workflow and outcomes.

ASHA Worker — assigned follow-up cases and follow-up status.

Chief Doctor — aggregated zone signals and intervention decisions.

Admin — configuration, role management, hospital/ASHA mapping, audit and technical operations.

# 22. Technical Architecture

Frontend: Patient web app + Hospital dashboard + ASHA dashboard + Chief Doctor/Admin dashboard.

Backend: Python Flask or FastAPI REST APIs; authentication/session service; appointment service; case-management service; notification service.

AI/NLP: intent classification; symptom/entity extraction; conversation manager; retrieval-based health-information layer; transparent triage rules/model; aggregated anomaly/cluster detection.

Data: MySQL for transactional data; optional Redis for session/cache/queues; optional analytics/time-series store if needed.

Location: predefined Nagpur zones/hospitals or map/geocoding service for prototype.

Deployment: Docker; local LAN or simple cloud container/VM; HTTPS for remote demos.

# 23. Minimum Database Design

users — id, name, age, phone, language, location, verified_status

cases — id, user_id, symptoms, intent, urgency, status, created_at

case_events — id, case_id, actor, action, timestamp, notes

hospitals — id, name, zone, location, departments, active_status

doctors — id, hospital_id, department, availability_status

appointments — id, case_id, hospital_id, doctor_id, slot, confirmation_status, checkin_status

asha_workers — id, name, zone, contact, active_status

assignments/followups — id, case_id, asha_id, status, notes, timestamp

zone_health_signals — id, zone, symptom_group, time_window, count, baseline, risk_level, generated_at

interventions — id, zone, approved_by, type, date, status, outcome

audit_logs — id, actor, action, resource, timestamp

# 24. API / Service Sketch

POST /auth/request-otp

POST /auth/verify-otp

POST /chat/message

POST /cases

GET /cases/{id}

POST /triage

GET /hospitals/nearby

GET /appointments/slots

POST /appointments

POST /appointments/{id}/confirm

POST /appointments/{id}/checkin

POST /appointments/{id}/no-show

POST /appointments/{id}/rebook

POST /cases/{id}/assign-asha

POST /cases/{id}/asha-followup

GET /hospital/dashboard

GET /asha/dashboard

GET /chief-doctor/zone-signals

POST /chief-doctor/interventions

# 25. AI Architecture for the Prototype

Do not train a large medical model during the hackathon. Reuse the existing SIH AI foundation and combine it with deterministic workflow logic.

Conversation layer receives message

Intent classifier routes request

Entity extractor structures symptoms

Retrieval layer returns approved health information

Transparent triage layer assigns priority

Workflow engine changes case state

Community analytics uses only aggregated/authorized data

# 26. Privacy, Security & Safety

Collect only data required for the workflow.

Use role-based access.

Use privacy-protected/aggregated zone analytics.

Never expose individual patient identities on public community maps.

Use HTTPS in real deployment.

Protect secrets and authentication tokens.

Maintain audit logs.

Never present AI output as diagnosis.

Never present an AI cluster signal as a confirmed outbreak.

Real deployment requires clinical, privacy, security, regulatory and institutional validation.

# 27. Hackathon MVP Scope

Patient chatbot with 1–2 strong demo languages

Demo OTP/session verification

Structured symptom intake

Low/Moderate/Urgent prototype triage

Seeded government hospitals and doctor slots

Appointment booking/confirmation

No-show → rebook → no-show → ASHA

Hospital dashboard

ASHA dashboard

Chief Doctor dashboard

Seeded zone symptom signals

Green/Yellow/Orange/Red internal visualization

Chief Doctor intervention decision screen

One complete patient case + one community-cluster demo

# 28. What NOT to Build in 24 Hours

Real hospital EMR integration unless already available

Complex medical diagnosis

Training a large medical model from scratch

Full government database integration

Production WhatsApp integration

Every disease

Automatic public outbreak alerts

City-wide deployment infrastructure

Real-world ASHA dispatch without institutional integration

# 29. 24-Hour Development Plan

0–1 h — freeze scope, Git, database schema, API contract, demo story.

1–5 h — patient UI, verification mock, backend and database.

3–8 h — AI conversation, extraction and triage.

6–11 h — hospital selection, slots and appointments.

8–14 h — hospital dashboard.

11–16 h — ASHA dashboard.

14–18 h — Chief Doctor dashboard and community signals.

16–19 h — end-to-end integration.

19–21 h — testing and seeded demo data.

21–22.5 h — demo recording and presentation.

22.5–24 h — final fixes, backup and rehearsal.

# 30. Five-Person Team Allocation

AI/NLP — conversation, extraction, triage, multilingual handling.

Backend — APIs, authentication, appointment and case state machine.

Database + Community Intelligence — MySQL, aggregation, zone-risk logic.

Frontend — patient, hospital and ASHA interfaces.

Integration + Demo — Chief Doctor dashboard integration, deployment, testing, demo data and pitch.

# 31. Live Demo Script

Patient opens SwasthyaMitra and selects language.

Patient verifies the demo session.

Patient reports symptoms.

AI asks follow-up questions and structures the case.

AI gives non-diagnostic priority guidance.

Patient receives suitable government-hospital options.

Patient books and confirms a slot.

Hospital dashboard receives the case.

Simulate first no-show.

System offers one rebooking.

Simulate second no-show.

ASHA dashboard receives the follow-up.

ASHA updates the status.

Hospital dashboard receives the update.

Chief Doctor dashboard shows an unusual zone-level symptom signal.

AI raises an internal signal only.

Chief Doctor reviews the evidence and approves a health-camp intervention.

Show intervention record and post-intervention monitoring.

# 32. Expected Impact

Improve access to understandable health information.

Reduce friction in reaching government healthcare.

Reduce loss of patients between digital guidance and professional care.

Create a structured no-show and ASHA follow-up loop.

Give hospitals clearer case and follow-up status.

Help public-health leadership notice unusual area-level patterns earlier.

Support targeted human-approved intervention instead of indiscriminate alerts.

Create measurable feedback from patient interaction to healthcare action and outcome.

# 33. Where It Can Be Applied

Government hospitals

Urban health zones/wards

ASHA/community-health networks

Government health camps

Schools/colleges with appropriate consent and privacy controls

Large workplaces/residential communities with authorized health programs

Municipal/public-health command centers

# 34. What It Helps Prevent or Reduce

Patients being left at the chatbot stage

Missed appointments becoming forgotten cases

Duplicate/abusive appointment requests

Confusing navigation between facilities

Loss of community follow-up information

Delayed recognition of unusual symptom patterns

Unnecessary public alerts caused by automatic AI decisions

# 35. Key Differentiator

SwasthyaMitra is not another generic medical chatbot. Its differentiator is the closed loop: AI understands and guides the patient; the system connects the patient to government healthcare; missed-care loops are handled through rebooking and ASHA follow-up; aggregated signals can help the Chief Doctor notice unusual community patterns; and interventions can be tracked back into the system.

# 36. Project Identity

Project Name: SwasthyaMitra

Category: AI + Public Health + Digital Healthcare Access + Community Health Intelligence

Core Promise: From digital health guidance to real-world healthcare follow-up and human-led community health response.

# 37. One-Line Pitch

SwasthyaMitra is an AI-powered public-health platform that connects patients to government healthcare, closes missed-care loops through ASHA follow-up, and helps Chief Doctors identify and respond to unusual community health patterns.

# 38. Final Architecture Principle

AI should understand, organize, recommend and detect patterns. Doctors should assess patients clinically. ASHA workers should provide authorized community follow-up. The Chief Doctor should decide community-level interventions. This separation of responsibilities is central to the credibility, safety and deployability of SwasthyaMitra.
