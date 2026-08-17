SwasthyaMitra — 5-Person Team Work Division

Ownership, interfaces, milestones and integration rules

# 1. Team Principle

Each person owns a vertical area but must expose stable APIs/interfaces so modules can be integrated without rewriting each other's work.

Person 1 — AI/NLP Lead

Own: chat pipeline, intent detection, symptom/entity extraction, multilingual handling, triage rules. Deliver: /chat/message, /triage, structured case JSON. Dependency: backend contract.

Person 2 — Backend & Workflow Lead

Own: FastAPI/Flask, auth, case state machine, appointment/no-show/rebooking logic, ASHA assignment APIs. Deliver: core APIs and workflow engine. Dependency: database schema.

Person 3 — Database & Community Intelligence Lead

Own: MySQL schema, migrations/seed data, event logging, zone aggregation, baseline/risk logic, Chief Doctor signal APIs. Deliver: database + analytics service.

Person 4 — Frontend Lead

Own: patient UI, hospital dashboard, ASHA dashboard. Deliver: responsive screens connected to APIs; no fake hard-coded workflow after integration.

Person 5 — Integration, QA & Chief Doctor/Demo Lead

Own: Chief Doctor dashboard, integration, deployment, testing, seeded demo scenarios, presentation and fallback recording. Deliver: end-to-end working build.

# 2. Shared Contracts

Agree database schema before coding.

Agree API request/response JSON before frontend integration.

Use Git branches and pull requests.

Never change shared fields silently.

Every feature must include success and failure states.

Use fictional demo data only.

# 3. Parallel Build Plan

Hour 0–1: all five — freeze scope, schema, UI flow, API contract.

Hour 1–6: P1 AI; P2 backend; P3 database; P4 patient UI; P5 Chief Doctor wireframe + deployment.

Hour 6–12: P1 triage; P2 appointment workflow; P3 zone analytics; P4 hospital UI; P5 ASHA UI + integration.

Hour 12–17: all teams integrate patient→hospital→ASHA flow.

Hour 17–20: community cluster→Chief Doctor→intervention flow.

Hour 20–22: full QA and bug fixing.

Hour 22–24: demo rehearsal, backup recording, final polish.

# 4. Definition of Done Per Person

P1: three prepared patient scenarios produce correct structured outputs and priority.

P2: complete appointment/no-show/rebooking/ASHA state machine works through APIs.

P3: database resets cleanly and seeded zone signal produces expected risk level.

P4: all dashboards display real API data and handle empty/error states.

P5: full demo runs from clean start; Chief Doctor intervention is recorded; fallback demo exists.

# 5. Git/Integration Rules

main = stable demo branch

feature/* = individual work

No direct unreviewed changes to main

Commit frequently

Pull/rebase before integration

Use .env.example; never commit secrets

Keep a seeded demo database script

Tag the final demo release

# 6. What Gets Cut First

If time is running out: cut advanced analytics, extra languages, extra disease coverage and visual polish before cutting the core patient→appointment→no-show→ASHA or Chief Doctor decision flow.
