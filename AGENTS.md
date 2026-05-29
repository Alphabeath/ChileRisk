# AGENTS.md — ChileRisk Project Rules

This file contains mandatory rules for any coding agent working on ChileRisk.

---

## Scope

- All frontend work happens **exclusively inside `frontend/`**
- Never modify files outside `frontend/` unless explicitly instructed
- Backend, docs, and infrastructure changes require separate approval

---

## Frontend Rules (Next.js 16 + React 19)

### Technology Constraints
- Use **Next.js 16.2.6** (App Router only)
- Use **React 19.2.4** + **TypeScript 5**
- Use **Tailwind CSS 4** + **shadcn/ui** (radix-sera style)
- Use **lucide-react** for icons
- Use **MapLibre GL** for maps (never Mapbox or Leaflet)
- State: **zustand** only
- Toasts: **sonner**
- Date handling: **date-fns**

### File & Folder Rules
- New pages → `frontend/app/(citizen)/...`
- New components → `frontend/components/{ui, map, risk, alerts, layout}/`
- Types → `frontend/lib/types.ts`
- API layer → `frontend/lib/api.ts`
- Mock data → `frontend/lib/mocks.ts`
- Never create new folders at root of `frontend/` without plan approval

### Code Style
- No comments unless explicitly requested
- Use existing shadcn/ui components first (button, card, badge, select, etc.)
- All new components must be accessible (WCAG 2.2 AA)
- Prefer `fetch` with typed responses over external HTTP clients
- Keep components under 150 lines when possible

### Environment & Mock Mode
- Toggle mock data with `NEXT_PUBLIC_USE_MOCK=true`
- All API calls must go through `lib/api.ts`
- Never hardcode API URLs — use environment variables

### Deployment
- Docker is the only supported deployment method
- Multi-stage `Dockerfile` required
- Health endpoint must exist at `/api/health`

---

## Prohibited Actions

- Do not run `git commit`, `git push`, or create PRs
- Do not modify `package.json` without explicit approval
- Do not introduce new dependencies without updating the plan first
- Do not touch backend, TrueRisk, or root-level files

---

## Required Deliverables (when implementing features)

1. Update `docs/FRONTEND.md` with new component APIs
2. Keep `docs/API.md` in sync with any contract changes
3. Ensure `CLAUDE.md` reflects current Next.js 16 constraints

---

**Last updated**: 2026-05-27
