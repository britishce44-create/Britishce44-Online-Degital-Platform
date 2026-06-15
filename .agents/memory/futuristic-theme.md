---
name: Futuristic Theme Color System
description: Space navy + electric indigo + vivid amber-gold theme; CSS var conventions and utility classes
---

# Futuristic Theme

## Core colors (CSS custom props in :root)
- `--navy`: `#080f22` (deep space background)
- `--gold`: `#f0a500` (vivid amber-gold; was `#c8a84e` before this redesign)
- `--royal-blue`: `#1a2e5c`
- `--accent-indigo`: `#6366f1`
- `--accent-violet`: `#7c3aed`
- `--accent-emerald`: `#059669`
- `--accent-rose`: `#e11d48`
- `--accent-cyan`: `#0891b2`

## Key CSS classes
- `.cosmic-gradient` / `.aurora-gradient` — dark space backgrounds
- `.glass-dark` — `rgba(13,20,37,0.80)` + `backdrop-filter: blur(20px)` + indigo border
- `.premium-card` / `.stat-card` — white cards with color-glow on hover
- `.text-gradient-gold` / `.text-gradient-indigo` / `.text-gradient-aurora` — gradient text
- `.bg-futuristic` — main content radial gradient background
- `.shimmer-text` — animated gold shimmer

## Typography
Default font: `Inter, DM Sans, system-ui`. Managed via `--app-font-sans` CSS var; Design Studio Kit can swap it live.

**Why:** Previous navy/champagne theme was too muted. User asked for futuristic + elegant + colorful. Indigo electric accents on deep space backgrounds give the premium feel without losing the British school formality (gold stays as brand anchor).
