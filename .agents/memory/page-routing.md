---
name: Page Routing Pattern
description: How to add new pages to the dashboard
---

Three places to update when adding a new page:
1. `PageKey` union type in `dashboard-layout.tsx`
2. `switch (currentPage)` block in `dashboard-layout.tsx` renderPage()
3. `adminItems` array in `sidebar.tsx` (add NavItem with page/icon/label/color)
4. Optionally add to `SECTION_DIVIDERS` in `sidebar.tsx` for a section header

**Why:** App uses state-based navigation (no URL router). All pages rendered via switch.
**How to apply:** Follow this 4-step pattern every time a new page is added.
