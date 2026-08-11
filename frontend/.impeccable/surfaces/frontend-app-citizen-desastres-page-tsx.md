---
version: 1
slug: "frontend-app-citizen-desastres-page-tsx"
primary_target: "frontend/app/(citizen)/desastres/page.tsx"
related_targets: ["frontend/components/disasters/disasters-page.tsx","frontend/components/disasters/disasters-catalog-hero.tsx","frontend/components/disasters/disasters-overview.tsx","frontend/components/disasters/disasters-featured.tsx","frontend/components/disasters/guide-card.tsx","frontend/components/disasters/disasters-section-nav.tsx"]
---

Scope: redesign of `/desastres` catalog to match ChileRisk citizen grammar of `/simulacros`. Visitor mode: Read.
Audience/job: people in Chile scanning official SENAPRED preparation guides by threat priority and inclusive focus.
Primary task and proof: present vendored SENAPRED guides with official illustrations and blurbs; preserve all 25 guide routes, section nav, closing SENAPRED attribution, and static snapshot content.
Direction: hero → editorial introduction → featured threat tiles as saturated accent fields → remaining/inclusiva catalog as date-first colorful cards → blue institutional close. Memorable moment: each priority threat owns a colored field with illustration, blurb, and white CTA.
Constraints: Spanish factual copy, local vendored assets only, no invented claims, no new backend contract, preserve citizen navbar, themes, keyboard/focus, 44px touch targets, reduced-motion. Disaster accents are editorial, never alert/risk semantics. No colored border-left rails.
Unresolved decisions: none.
