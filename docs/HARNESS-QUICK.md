# Harness — quick (low tokens)

**Read order:** root `AGENTS.md` (20 ln) → area `AGENTS.md` → this file if task type known → detail doc only if stuck.

**Memoria:** Antes de editar: `engram_mem_context` + `engram_mem_search "<keywords>"`. Ver `docs/ENGRAM-PROTOCOL.md`. `engram_mem_session_summary` solo si `mem_save` esta sesión.

**Close:** `make verify` · doc rules: `DOC-MAINTENANCE.md`

---

## Pick area

| Touch | Open |
|-------|------|
| UI/map/hooks | `frontend/AGENTS.md` |
| API/DB/jobs | `backend/AGENTS.md` |
| `?date=` / FE↔BE | `QUERY-DATE.md` + both areas |

---

## Flows

**FE UI/component**
`frontend/AGENTS` → `docs/DESIGN` (map/citizen) → code `components/` `hooks/` → `docs/FRONTEND` if public → `make verify`

**FE map overlay**
+ `map-overlays.tsx` · `useDraggablePanel` · `citizen-layout.ts`

**BE endpoint**
`backend/AGENTS` → `schemas/` → `api/` + `main.py` → `services/` → `backend/docs/BACKEND` → FE? see contract → `make verify`

**Contract change**
`schemas/*` ↔ `lib/types.ts` + `lib/api.ts` · `BACKEND.md` + `FRONTEND.md` · OpenAPI `/openapi.json` wins · `make verify-contract`

**Cross-stack**
`QUERY-DATE.md` → BE `query_date_window` · FE `query-date.ts` `ui-store` hooks `api.ts`

**Bugfix only**
code (+tests) · docs optional · `make verify` anyway

---

## Docs map (no read all)

| Need | File |
|------|------|
| API tables | `backend/docs/BACKEND.md` |
| Components | `frontend/docs/FRONTEND.md` |
| Glass/UI | `frontend/docs/DESIGN.md` |
| Docker/monorepo | `docs/ARCHITECTURE.md` |
| Playbooks long | `docs/HARNESS.md` |

---

## verify

`make verify` = links + contract + `bun lint` + `tsc` + `compileall` (+ pytest if host has it)

---

## Skills (optional)

`/implement` big feature · `/review` diff · `caveman` terse chat · `frontend-design` UI polish

---

*2026-06-10*