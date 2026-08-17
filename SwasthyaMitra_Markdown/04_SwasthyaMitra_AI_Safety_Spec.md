SwasthyaMitra — AI, Clinical Safety & Community Intelligence Specification

AI boundaries, triage, clustering and human authority

# 1. AI Responsibilities

Understand natural language

Extract intent/symptoms

Ask structured follow-up questions

Retrieve approved health information

Support workflow priority triage

Detect unusual aggregated patterns

# 2. AI Prohibitions

No autonomous diagnosis

No prescription generation as a substitute for clinicians

No automatic outbreak declaration

No automatic public alert

No autonomous Chief Doctor intervention decision

# 3. Triage Model

LOW = routine pathway; MODERATE = higher-priority evaluation; URGENT = potentially serious warning signs requiring appropriate urgent professional care.

# 4. Community Cluster Model

Use zone + symptom group + time window. Compare observed count/rate with a historical or configured baseline. Include population normalization, trend, concentration, severity indicators and data quality where available.

# 5. Zone Risk

Green: expected

Yellow: increased monitoring

Orange: significant unusual signal

Red: strong/serious signal

# 6. Human-in-the-Loop

AI creates an internal signal. The Chief Doctor reviews evidence and chooses no action, monitor, investigate, deploy team, conduct camp or authorized public advisory.

# 7. Privacy

Aggregate before community visualization

Do not expose patient identity on public maps

Use role-based access

Retain only required data

Log access to sensitive records

# 8. Evaluation

Prepared intent-classification test set

Symptom extraction accuracy checks

Triage rule test cases reviewed by a qualified domain expert

False-positive/false-negative analysis for cluster detection

Human override testing
