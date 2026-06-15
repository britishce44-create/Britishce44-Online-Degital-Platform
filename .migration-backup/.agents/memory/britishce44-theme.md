---
name: Britishce44 brand theme
description: Brand palette and the rules to follow when recoloring the Britishce44 web app
---

# Britishce44 brand theme

Brand comes from the britishce4.com logo (المركز البريطاني الأول): deep indigo **#150D79** (primary), sky blue **#3FBAEB** (secondary), green **#00AE74** (accent / links), on white with #333 body text. This replaced an older dark-navy / gold theme.

## Rules when recoloring
- **The brand green needs a DARK (deep-indigo) foreground, never white.** White text on the green fails WCAG AA (~2.9:1); deep indigo (~#17125c) passes (~5.8:1). Apply in both light and dark modes.
  **Why:** the green is too light to carry white text accessibly.
- **Never run a global color find/replace over the whiteboard pen palette.** Its drawing colors must stay full-spectrum, not brand colors.
- **Preserve semantic color meaning through any sweep.** warning / pending / maintenance = amber, critical = red, high-risk = orange, success = green. A blind gold→green replace silently turns warnings into "safe" green, so always re-check status / risk / payment configs afterward.
