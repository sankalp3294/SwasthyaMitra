SwasthyaMitra — QA & Test Plan

Testing, validation and demo acceptance

# 1. Test Strategy

Unit tests

API/integration tests

Workflow/state-machine tests

Role/access tests

UI smoke tests

AI scenario tests

Community analytics tests

End-to-end demo tests

# 2. Critical Test Cases

Patient chat — Symptom message produces structured case fields.

Disease awareness — General question returns approved information and does not create appointment automatically.

Triage — Prepared Low/Moderate/Urgent cases return expected priority.

Hospital search — Suitable seeded hospital is returned.

Booking — Slot cannot be double-booked.

Confirmation — Only confirmed appointments enter active state.

No-show 1 — First no-show creates one rebooking opportunity.

No-show 2 — Second no-show creates ASHA assignment.

ASHA — ASHA update appears to hospital.

Cluster — Seeded unusual zone data generates internal signal.

Chief Doctor — Only Chief Doctor can approve intervention.

Public alert — Cluster engine alone cannot publish a public alert.

RBAC — Patient cannot access another patient's case.

Audit — Important state changes create audit events.

# 3. Demo Acceptance

Run one patient case from chat to doctor.

Run first no-show and rebooking.

Run second no-show and ASHA follow-up.

Run one community cluster scenario.

Show Chief Doctor decision.

Restart system and repeat critical demo without manual database edits.

# 4. Quality Gate

No feature is considered demo-ready unless it works through the UI/API, handles the expected failure path, and can be reset for another demo run.
