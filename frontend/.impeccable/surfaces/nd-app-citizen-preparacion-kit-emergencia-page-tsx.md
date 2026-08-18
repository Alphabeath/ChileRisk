---
version: 1
slug: "nd-app-citizen-preparacion-kit-emergencia-page-tsx"
primary_target: "frontend/app/(citizen)/preparacion/kit-emergencia/page.tsx"
related_targets: ["frontend/components/preparacion/kit-emergencia-page.tsx","frontend/components/preparacion/kit-emergencia-hero.tsx","frontend/components/preparacion/kit-emergencia-overview.tsx","frontend/lib/kit-emergencia-content.ts"]
---

Scope: add `/preparacion/kit-emergencia` as the official SENAPRED emergency-kit guide. Visitor mode: Read.
Audience/job: people in Chile assembling a 48–72 hour household (and car) kit with official items.
Primary task and proof: present the official basic kit (12 items with vendored icons), family-adaptation note, extra provisions, and car kit; link back to `/preparacion` for the emergency plan copy.
Direction: close translation of https://senapred.cl/kit-de-emergencia/ inside ChileRisk. Hero uses the official backpack icon on institutional blue. Cards stay on `bg-background`/`bg-card` with equal height. No persistence.
Memorable moment: the 12 official-icon basic kit cards.
Constraints: Spanish official copy only, local vendored assets, no invented checklists, no family-plan API, preserve navbar (Preparación as section), themes, 44px targets, reduced-motion.
Unresolved decisions: none.
