---
name: Maintenance Mode System
description: Admin-only maintenance mode with Design Studio Kit; how provider, topbar, sidebar, and layout wire together
---

# Maintenance Mode System

## Architecture
- `artifacts/britishce44/src/components/maintenance/maintenance-provider.tsx` — React context (`MaintenanceContext`) wrapping the entire dashboard
- `artifacts/britishce44/src/components/maintenance/design-studio-kit.tsx` — Floating 8-tab draggable panel (framer-motion), rendered inside `DashboardInner`
- `DashboardLayout` splits into `MaintenanceProvider` → `DashboardInner` so the context is available to all children

## How it works
- `isMaintenanceMode` + `showDesignKit` state lives in `MaintenanceProvider`
- Topbar: admin-only "🔧 Maintenance" toggle + "🎨 Design Studio" button (conditionally shown)
- Sidebar: "Design Studio Kit" button when `isMaintenanceMode` + admin role
- Save: 14-step deploy animation, persists theme to `localStorage` keys `b44_theme`, `b44_element_overrides`, `b44_save_state`
- Discard: removes CSS vars via `document.documentElement.style.removeProperty`, clears localStorage

## Theme vars updated in real-time
Nine CSS vars: `--navy`, `--gold`, `--royal-blue`, `--champagne`, `--accent-indigo`, `--accent-violet`, `--accent-emerald`, `--accent-rose`, `--accent-cyan`, plus `--app-font-sans` and `--radius`

**Why:** Admin needs to design without redeploying. Real-time CSS var updates via `document.documentElement.style.setProperty` give instant visual feedback.
