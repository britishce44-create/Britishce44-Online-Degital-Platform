---
name: New Student Onboarding Flow
description: How the 4-step post-registration onboarding is wired
---

After `register()` succeeds in `RegisterForm`, it calls `onRegistered(name)` which sets `onboardingName` state in `LoginPage`, showing `OnboardingFlow` (src/pages/onboarding.tsx).

Steps: 1) Complete profile form  2) Academic meeting room (live interview simulation)  3) Payment info (Al-Rajhi + Al-Kuraimi bank details, bilingual Arabic/English)  4) Success screen.

**Why:** New students need guided intake before accessing the main dashboard.
**How to apply:** When adding new student flows, trigger via `onRegistered` callback pattern.
