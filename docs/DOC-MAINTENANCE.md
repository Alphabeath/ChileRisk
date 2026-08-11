# Documentación — mantenimiento obligatorio

Reglas para cualquier agente o desarrollador que modifique ChileRisk. La documentación debe describir capacidades comprobables, no intenciones de producto.

---

## Cuándo actualizar docs

Actualiza documentación en el mismo task si el cambio es importante:

| Tipo de cambio | Qué actualizar |
|----------------|----------------|
| Nuevo endpoint, query param o forma de respuesta | `backend/docs/BACKEND.md`, `backend/app/schemas/`, `make sync-contract`, `frontend/lib/types.ts`, `frontend/lib/api.ts` |
| Nuevo modelo, tabla o job | `backend/docs/BACKEND.md`, `backend/AGENTS.md` si cambia el routing |
| Nuevo componente, hook o página visible | `frontend/docs/FRONTEND.md`, `frontend/docs/UI-GUIDELINES.md` si afecta implementación visual; `frontend/DESIGN.md` solo si cambia una decisión portable |
| Flujo cross-stack como `?date=` | `docs/QUERY-DATE.md` y ambos lados del contrato |
| Arquitectura, puertos, Compose o monorepo | `docs/ARCHITECTURE.md` y el índice que cambie de routing |
| Nueva carpeta o área de código | `AGENTS.md` del área y README/índice correspondiente |
| Solo fix interno sin cambio de contrato ni UX | Docs opcionales |

“Importante” no significa cada línea: un typo o rename local sin API no requiere una referencia nueva.

---

## Regla de evidencia

Cada feature documentada debe llevar una clasificación explícita:

- **`disponible`:** superficie web comprobable end to end.
- **`backend-only`:** API o servicio implementado sin consumidor web completo.
- **`stub`:** ruta visible que muestra “Próximamente” o equivalente.
- **`ausente`:** ruta o superficie todavía inexistente.

La evidencia se obtiene de fuentes concretas:

- versiones: manifests (`package.json`, `frontend/package.json`, `backend/pyproject.toml`);
- estado de rutas: archivos reales bajo `frontend/app/`;
- contrato HTTP: `GET /openapi.json` en runtime;
- optimizaciones: símbolos, literales y configuración existentes, por ejemplo `next/dynamic`, `setFeatureState`, `staleTimeForLive`, batches, locks y TTL caches.

No inventes benchmarks, latencias, uptime ni disponibilidad externa. Un endpoint backend-only no se presenta como UI terminada. Una fuente de datos que falla no se convierte en un dato sintético.

---

## Jerarquía de ownership

No dupliques una referencia larga en `AGENTS.md` ni en un README de entrada:

1. **`AGENTS.md`** (raíz, `frontend/`, `backend/`) — índice, scope, prohibiciones y tabla “dónde poner X”.
2. **`backend/docs/`** y **`frontend/docs/`** — referencias estables por stack.
3. **`docs/`** — arquitectura, `?date=`, harness y mantenimiento cross-stack.
4. **`frontend/docs/UI-GUIDELINES.md`** — contrato detallado y canónico de implementación visual: tokens, Mica, patrones citizen y excepciones.
5. **`frontend/DESIGN.md`** — spec portable para Impeccable; resume principios sin reemplazar la guía detallada.

La adopción de Impeccable del 2026-08-07 se conserva: `impeccable`, `frontend/DESIGN.md`, `frontend/docs/UI-GUIDELINES.md` y `bun run impeccable:detect` forman una integración; no se mueve el frontmatter portable ni se renombra el skill.

Si un párrafo largo vive en dos sitios, una sola fuente de verdad contiene el detalle y la otra solo enlaza.

---

## Checklist antes de cerrar un task

- [ ] ¿Cambió contrato HTTP? → `backend/docs/BACKEND.md` + `make sync-contract` + `frontend/lib/types.ts` + `frontend/lib/api.ts`.
- [ ] ¿Cambió UI pública? → `frontend/docs/FRONTEND.md` + `frontend/docs/UI-GUIDELINES.md`.
- [ ] ¿Cambió paleta, tipografía, forma, elevación o doctrina portable? → sincronizar `frontend/DESIGN.md`; si no, dejarlo intacto.
- [ ] ¿Nuevo archivo hot path? → fila en el `AGENTS.md` del área.
- [ ] ¿Feature cross-stack? → `docs/QUERY-DATE.md` o `docs/ARCHITECTURE.md`.
- [ ] ¿Estado de feature? → etiqueta `disponible`, `backend-only`, `stub` o `ausente` con evidencia.
- [ ] ¿README o índice mantenido? → actualizar según su task-first ownership.
- [ ] ¿Fecha? → `Last updated: YYYY-MM-DD` en cada Markdown modificado.
- [ ] ¿Enlaces? → `make verify-docs` incluye `README.md`, los tres `AGENTS.md`, todos los `docs/*.md`, `frontend/README.md`, `frontend/DESIGN.md`, los dos READMEs de evacuación y los índices backend/frontend.
- [ ] ¿Gate? → `make verify` en la raíz, o al menos `verify-frontend` / `verify-backend` durante una iteración.
- [ ] ¿Artefacto Next? → `cd frontend && bun run build`; `make verify` no lo ejecuta.

El verificador mantenido es `docs/scripts/verify-doc-links.sh`. No amplía su alcance a `.agents/`, `misc/` ni `TrueRisk/`.

---

## Aprobación del usuario

Las ediciones en `docs/`, `backend/docs/` y `frontend/docs/` están permitidas cuando forman parte del task. Cambios en `docker-compose.yml`, root `.env` y `.gitignore` siguen requiriendo aprobación explícita según [AGENTS.md](../AGENTS.md).

*Last updated: 2026-08-07*
