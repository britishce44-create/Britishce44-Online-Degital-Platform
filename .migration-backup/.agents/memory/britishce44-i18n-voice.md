---
name: Bilingual i18n + voice welcome (britishce44)
description: Durable decisions behind the EN/AR translation engine, the Basic-4+ English lock, and the login voice welcome.
---

# Decisions & constraints (not a wiring inventory — grep the code for current details)

## i18n engine
- Custom, dependency-free EN/AR provider (no react-i18next) lives in `src/lib/i18n.tsx`. `t(key)` falls back to the raw key when missing.
- **Why:** lets pages be translated incrementally without breaking — untranslated bodies just show English/keys, so partial coverage is safe.
- **Constraint:** `LanguageProvider` must nest *inside* `AuthProvider` — it reads the user to enforce the English lock. Breaking that order breaks the lock.

## Basic-4-and-above English lock
- Students at "Basic 4 and above" are forced English-only; the language switcher is hidden/disabled for them. Single tunable threshold in i18n.tsx.
- **Why:** the centre teaches Basic 4+ entirely in English.
- **Open assumption to confirm with the user:** "Basic 4" is mapped to `User.grade >= 4` (the model only has numeric `grade`). Re-check the threshold/mapping if their level numbering differs.

## Voice welcome on login
- A warm British voice plays a different inspiring welcome on every login, in the user's effective language; clips are pre-generated MP3s in `public/welcome/`, chosen at random avoiding immediate repeats.
- **Why:** the user explicitly wanted a near-human, varied welcome each login.
- **Constraints:** must fire inside the login click gesture (browser autoplay). No native Arabic TTS voice exists in the catalog — Arabic clips use the multilingual model with the same English voice. To add/replace clips, regenerate via media-generation textToSpeech to the same paths and keep the per-language clip counts in sync with the player.
