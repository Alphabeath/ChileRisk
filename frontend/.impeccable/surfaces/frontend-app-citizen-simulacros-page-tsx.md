---
version: 1
slug: "frontend-app-citizen-simulacros-page-tsx"
primary_target: "frontend/app/(citizen)/simulacros/page.tsx"
related_targets: ["frontend/components/simulacros/simulacros-page.tsx","frontend/components/simulacros/simulacros-hero.tsx","frontend/components/simulacros/simulacros-overview.tsx","frontend/components/simulacros/simulacros-agenda.tsx","frontend/components/simulacros/simulacros-type-filter.tsx"]
---

Scope: full redesign of `/simulacros`. Visitor mode: Read + Operate.
Audience/job: people in Chile learning why evacuation drills matter, then finding an applicable official exercise by date, territory, and type.
Primary task and proof: explain preparation with existing SENAPRED copy and official imagery; preserve the real `useSimulacros` calendar, filters, dates, regions, SAE/comuna details, all loading/error/empty states, and links to SENAPRED.
Direction: close translation of `https://senapred.cl/simulacros/` inside ChileRisk. Hero inherits `/desastres`: local light/dark full-bleed illustration, centered `Simulacros` title, institutional rail, and bottom metadata, with no long hero paragraph. Route sequence: hero → editorial introduction → theme-aware numbered reasons → institutional agenda calendar (próximo ejercicio panel uses drill-type color field matching agenda cards) → four full-width SENAPRED-colored scenario bands → restrained participation close.
Memorable moment: official scenario illustrations alternate with cyan, teal, matte brick-red, and earth fields, turning prevention education into a national field guide rather than a card grid.
Constraints: Spanish factual copy, local vendored assets only, no invented reports or capabilities, no runtime remote images, no new backend contract, preserve citizen navbar, themes, keyboard/focus semantics, 44px touch targets, and reduced-motion behavior. Scenario colors are editorial and never severity semantics.
Unresolved decisions: none.
