# Harness — playbooks para agentes

Índice cross-stack: [README.md](./README.md) · mantenimiento: [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md) · gate: `make verify`.

## Entrada por tarea

Este archivo es un router de trabajo, no una segunda referencia de endpoints o rutas. Abre primero el índice del área y después solo el documento que corresponde:

| Tocas… | Entrada |
|--------|---------|
| UI, mapa, hooks o Next.js | [frontend/AGENTS.md](../frontend/AGENTS.md) |
| API, DB, scheduler o integraciones | [backend/AGENTS.md](../backend/AGENTS.md) |
| Contrato FE↔BE o `?date=` | [Contrato FE↔BE](#contrato-febe) + ambos índices |
| Documentación o estado de feature | [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md) |

Al cerrar cualquier cambio, ejecuta el gate aplicable y revisa el checklist de mantenimiento. Los datos operacionales deben seguir siendo reales; no agregues fallbacks sintéticos para ocultar una fuente vacía.

## Frontend y UI

Playbook completo para páginas, componentes, hooks, mapas y superficies visuales:

1. Lee [frontend/AGENTS.md](../frontend/AGENTS.md) para scope, naming, ubicación y hot paths.
2. Lee [frontend/docs/UI-GUIDELINES.md](../frontend/docs/UI-GUIDELINES.md) antes de implementar UI de mapa o citizen. Es el contrato visual detallado y canónico.
3. Usa [frontend/DESIGN.md](../frontend/DESIGN.md) solo como contexto portable para Impeccable; no copies sus tokens o principios en otro índice.
4. Implementa en `frontend/app/`, `frontend/components/`, `frontend/hooks/`, `frontend/lib/` o `frontend/stores/` según el tipo de cambio.
5. Para `/monitor`, reutiliza `components/map/map-alerts-overlay.tsx`, `components/map/monitor-live-data.tsx`, `lib/query-cache.ts` y los hooks TanStack Query existentes. La geometría del mapa vive en `components/map/chile-map.tsx`.
6. Para `/evacuacion`, reutiliza `components/evacuacion/`; los polígonos pesados son PMTiles y las líneas/puntos son GeoJSON vendoreado.
7. Si la superficie es pública, actualiza [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md). Si cambia una decisión visual detallada, actualiza `UI-GUIDELINES.md`; sincroniza `DESIGN.md` solo si cambia una decisión portable.
8. Verifica desde la raíz con `make verify-frontend` y, cuando el cambio afecta el artefacto Next, con `cd frontend && bun run build`.

## Backend, API y datos

Playbook completo para endpoints, schemas, modelos, servicios, scheduler e integraciones:

1. Lee [backend/AGENTS.md](../backend/AGENTS.md) para scope, invariantes y tabla de ubicación.
2. Comprueba el contrato actual en [backend/docs/BACKEND.md](../backend/docs/BACKEND.md) y en `GET /openapi.json` con el backend en marcha.
3. Coloca el cambio en `backend/app/api/`, `backend/app/schemas/`, `backend/app/models/`, `backend/app/services/` o `backend/app/scheduler/jobs.py` según su responsabilidad.
4. Mantén la política de datos reales: CSN, Open-Meteo/GloFAS, SERNAPRED, SERNAGEOMIN, Aire Chile y MeteoChile AAA. Una fuente vacía no autoriza valores sintéticos.
5. Para impactos sísmicos, conserva el cálculo en `impact_service`; para fecha histórica, `query_date_window` + `daily_risk_service`; para alertas, conserva el contrato de contenido opt-in y las semánticas de hoy/histórico.
6. Añade o corrige la tabla humana en `BACKEND.md`. Si la respuesta se consume en la web, sigue el playbook [Contrato FE↔BE](#contrato-febe).
7. Verifica desde la raíz con `make verify-backend`; no sustituyas ese target por un `py_compile` aislado.

## Contrato FE↔BE

Playbook completo para una respuesta JSON, endpoint o parámetro compartido:

1. Define o cambia el schema en `backend/app/schemas/`.
2. Arranca el backend o usa el entorno disponible y confirma el contrato en `http://localhost:8000/openapi.json`.
3. Ejecuta `make sync-contract` para regenerar `frontend/lib/api-schema.d.ts`.
4. Actualiza `frontend/lib/types.ts` y `frontend/lib/api.ts` si el frontend consume el recurso; añade o ajusta el hook TanStack Query correspondiente.
5. Si usa `date`, actualiza [QUERY-DATE.md](./QUERY-DATE.md), `backend/docs/BACKEND.md` y `frontend/docs/FRONTEND.md`.
6. Comprueba que la UI no lee PostgreSQL ni usa `fetch` GET suelto fuera de la capa de consultas.
7. Ejecuta `make verify-contract` y luego el gate del área. OpenAPI runtime gana cualquier resumen manual.

Flujo de referencia:

```text
backend/app/schemas/ → /openapi.json → make sync-contract
    → frontend/lib/api-schema.d.ts → types.ts / api.ts → hooks TQ
```

## Documentación

Playbook completo para mantener índices, referencias y afirmaciones verificables:

1. Decide el nivel de ownership: `AGENTS.md` para routing/scope, `backend/docs/` o `frontend/docs/` para referencia de stack, `docs/` para cross-stack, `UI-GUIDELINES.md` para contrato visual canónico y `DESIGN.md` para contexto portable.
2. Etiqueta el estado de cada feature como `disponible`, `backend-only`, `stub` o `ausente`.
3. Verifica versiones en manifests, rutas en archivos reales y optimizaciones en símbolos o configuración; no inventes métricas ni conviertas un endpoint sin consumidor en UI terminada.
4. Mantén un único índice canónico para rutas, endpoints y estado. Los READMEs de entrada enlazan; no duplican referencias largas.
5. Añade `Last updated: YYYY-MM-DD` a cada Markdown modificado y conserva los enlaces locales comprobables.
6. Para cambios visuales, sigue el flujo `UI-GUIDELINES.md` canónico → sincroniza `DESIGN.md` solo si cambian paleta, tipografía, forma, elevación o doctrina visual portable.
7. Ejecuta `make verify-docs` después de editar enlaces o índices y completa el checklist de [DOC-MAINTENANCE.md](./DOC-MAINTENANCE.md).

## Verificación

Comandos definidos por el `Makefile`:

```bash
make verify          # verify-docs + verify-contract + verify-frontend + verify-backend; no ejecuta build de Next
make verify-docs     # enlaces Markdown locales mantenidos
make verify-contract # drift OpenAPI → frontend/lib/api-schema.d.ts
make sync-contract   # regenera api-schema.d.ts desde OpenAPI
make verify-frontend # bun run lint + bunx tsc --noEmit + bun test
make verify-backend  # python3 -m compileall -q app + pytest condicional
cd frontend && bun run build  # artefacto Next; no está incluido en make verify
```

`verify-backend` ejecuta pytest solo si está instalado en el host. En Docker, usa `docker compose exec backend python -m pytest tests/ -q`. El gate no reemplaza la prueba observable: levanta el stack con `make up` y comprueba `/health`, `/openapi.json` y las superficies afectadas.

## Skills del repo

| Necesidad | Skill / comando |
|-----------|-----------------|
| Respuestas breves | `caveman` |
| Mensaje de commit | `caveman-commit` |
| Review de cambios | `caveman-review` o `/review` |
| Diseño y auditoría UI | `impeccable` |
| Rendimiento React/Next | `vercel-react-best-practices` |
| Delegación comprimida | `cavecrew` |

La instalación de Impeccable está fijada en `package.json` como `impeccable: 3.5.0`. El comando raíz es `bun run impeccable:detect` y carga `frontend/DESIGN.md`; para implementar UI se lee además `frontend/docs/UI-GUIDELINES.md`. No eliminar ni renombrar `.agents/skills/impeccable/`.

*Last updated: 2026-08-07*
