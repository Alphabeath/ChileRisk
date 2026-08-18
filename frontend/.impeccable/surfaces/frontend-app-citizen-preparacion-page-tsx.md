---
version: 1
slug: "frontend-app-citizen-preparacion-page-tsx"
primary_target: "frontend/app/(citizen)/preparacion/page.tsx"
related_targets: ["frontend/components/preparacion/preparacion-page.tsx","frontend/components/preparacion/preparacion-hero.tsx","frontend/components/preparacion/preparacion-overview.tsx","frontend/lib/familia-preparada-content.ts"]
---

Scope: replace `/preparacion` stub with the official SENAPRED Familia Preparada page. Visitor mode: Read.
Audience/job: people in Chile who need to understand and start a family emergency plan with official guidance.
Primary task and proof: present the 8 official steps, invitations, and Biblioteca GRD documents with vendored SENAPRED art and outbound attribution; no wizard and no family-plan API.
Direction: close translation of https://senapred.cl/familia-preparada/ inside ChileRisk. Editorial titles and the four commitment cards stay on `bg-background` for light/dark. The eight step cards sit inset over `Pueblo_002_M.png`. Never alert semantics.
Memorable moment: colored step cards floating on the official town street, with the plaza reserved for the hero.
Constraints: Spanish official copy only, local vendored assets, no invented checklists or persistence, no runtime remote images, preserve citizen navbar, themes, 44px targets, and reduced-motion.
Unresolved decisions: `/preparacion/kit-emergencia` and the interactive wizard remain ausente until auth exists.
