---
name: Prototype auth is intentionally insecure (demo-only)
description: api-server auth is plaintext demo users + open self-registration; the code-review/validation gate flags it on every feature task — it is a separate security effort, not feature-task scope.
---

The api-server auth model is a prototype: in-memory/seeded **plaintext** passwords,
hardcoded demo credentials, and an **unauthenticated** `POST /v1/auth/register`
that accepts a caller-supplied `role` (so anyone can self-register as admin).
This is documented as intentional in `replit.md` ("api-server has in-memory demo users").

**Why this matters:** the validation / code-review gate reviews the whole codebase's
security posture, so it will REJECT feature tasks citing these auth issues
(privilege escalation via open registration, plaintext credential storage/compare,
missing object-level ownership checks e.g. notifications read-by-id) even when the
feature diff never touches auth.

**How to apply:** these findings are real but are pre-existing and app-wide
(web + mobile + api), not part of any single feature task. Do NOT bundle an auth
rewrite into a feature task — it requires password hashing (argon2/bcrypt) + user
schema migration + re-seeding + role-provisioning redesign + ownership checks +
authz tests, and risks breaking login everywhere. Treat it as a dedicated security
task. For a feature task that didn't touch auth, skip the validation finding with a
"pre-existing / out of changed surface" reason and surface it to the user as a
recommended standalone task.
