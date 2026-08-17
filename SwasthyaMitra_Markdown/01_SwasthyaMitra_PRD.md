SwasthyaMitra — Product Requirements Document

PRD | Product definition and user requirements

# 1. Product Vision

SwasthyaMitra evolves the original AI public-health chatbot into a closed-loop healthcare-access and community-health intelligence platform.

# 2. Goals

Make reliable health information easier to access.

Understand patient-reported symptoms through conversation.

Route patients toward appropriate professional evaluation.

Connect patients with suitable government hospitals and appointments.

Reduce care loss caused by missed appointments through rebooking and ASHA follow-up.

Help the Chief Doctor review unusual aggregated symptom patterns at zone level.

Support targeted, human-approved health interventions and outcome monitoring.

# 3. Target Users

Patient

Doctor/hospital staff

ASHA worker

Chief Doctor/public-health authority

System administrator

# 4. Core User Journeys

Patient asks a general health question → receives disease-awareness information.

Patient reports symptoms → AI collects structured information → priority triage.

Patient enters care pathway → suitable government hospital and slots shown → appointment confirmed.

First no-show → one rebooking opportunity.

Second no-show → ASHA follow-up → hospital receives status.

Aggregated symptom activity becomes unusual → internal Chief Doctor signal → human decision → optional intervention/camp → outcome monitoring.

# 5. Functional Requirements

FR-01: Support patient registration/verified session.

FR-02: Support multilingual conversational input for selected prototype languages.

FR-03: Detect intent and extract relevant symptom information.

FR-04: Provide approved disease-awareness and prevention information.

FR-05: Produce Low/Moderate/Urgent workflow priority without diagnosing.

FR-06: Find suitable government hospitals using location/service/availability data.

FR-07: Display and book available appointment slots.

FR-08: Confirm appointment and support check-in.

FR-09: Detect first no-show and offer one rebooking.

FR-10: Escalate second no-show to ASHA.

FR-11: Allow ASHA to submit follow-up status.

FR-12: Allow hospital staff to review cases and outcomes.

FR-13: Aggregate zone-level symptom signals.

FR-14: Detect unusual symptom patterns and assign internal risk levels.

FR-15: Notify the Chief Doctor internally for review.

FR-16: Record Chief Doctor intervention decisions.

FR-17: Record health-camp/intervention outcomes and support reassessment.

FR-18: Maintain audit events for important workflow actions.

# 6. Non-Functional Requirements

Security and role-based access

Privacy-conscious aggregation

Usable mobile-first interface

Reliable workflow state transitions

Explainable triage/cluster rules for prototype

Auditability

Responsive dashboards

Graceful failure and demo fallback

# 7. Out of Scope for Hackathon

Autonomous diagnosis

Automatic outbreak declaration

Automatic public alerts

Full EMR integration

Production government-data integration

Large model training from scratch

Real-world ASHA dispatch integration

# 8. Success Metrics

End-to-end case can be completed without database editing

Appointment/no-show/rebooking flow works

ASHA escalation works

Chief Doctor can review a seeded cluster

One intervention can be recorded

Demo survives a clean restart
