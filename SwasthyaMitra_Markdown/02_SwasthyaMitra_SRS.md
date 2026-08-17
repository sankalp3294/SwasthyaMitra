SwasthyaMitra — Software Requirements Specification

SRS | Detailed functional and technical requirements

# 1. System Scope

The system contains patient, AI/NLP, appointment, hospital, ASHA, community analytics, Chief Doctor and administration modules.

# 2. Functional Requirements by Module

## Patient & Auth

OTP/session verification

profile and language

chat

appointments

follow-up status

## AI/NLP

intent classification

symptom/entity extraction

conversation state

retrieval response

triage support

## Hospital

case queue

appointment schedule

check-in/no-show

doctor review status

ASHA updates

## ASHA

assigned cases

follow-up form

escalation

outcome submission

## Community

aggregated symptom counts

baseline comparison

trend analysis

zone risk signal

## Chief Doctor

signal review

evidence view

decision recording

intervention/camp management

## Admin

roles

hospital/ASHA mapping

configuration

audit

# 3. State Machines

Case: NEW → AI_ASSESSED → TRIAGED → APPOINTMENT_REQUESTED → CONFIRMED → ATTENDED → DOCTOR_REVIEW → FOLLOW_UP → RESOLVED/REFERRED.

No-show path: CONFIRMED → NO_SHOW_1 → REBOOKED → NO_SHOW_2 → ASHA_ASSIGNED → ASHA_FOLLOWUP → HOSPITAL_REVIEW → OUTCOME.

# 4. Business Rules

General information requests do not automatically create appointments.

Patients entering the medical-care pathway can receive professional evaluation opportunities; triage controls priority.

AI does not diagnose.

Urgent warning signs must not be placed into an ordinary routine queue when urgent professional care is appropriate.

First no-show receives one rebooking opportunity.

Second no-show can trigger ASHA follow-up.

AI community signals are internal decision support only.

Only the Chief Doctor/authorized authority decides community intervention or public advisory.

Zone analytics use aggregated/privacy-protected data.

# 5. Acceptance Criteria

Patient can complete intake.

AI returns expected intent and triage for prepared scenarios.

Hospital slot can be booked and confirmed.

First no-show creates rebooking.

Second no-show creates ASHA assignment.

ASHA update appears in hospital dashboard.

Seeded zone cluster creates internal Chief Doctor signal.

Chief Doctor decision is recorded.

Public alert is never generated automatically by the cluster engine.
