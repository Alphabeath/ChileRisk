# Backend — índice task-first

Documentación del API y los servicios Python. El backend consume datos reales de CSN, Open-Meteo/GloFAS, SERNAPRED, SERNAGEOMIN, Aire Chile y MeteoChile AAA; si una fuente falla, no fabrica valores de reemplazo.

## Qué necesitas → lee solo esto

| Necesitas… | Lee solo esto |
|------------|---------------|
| Contrato OpenAPI, endpoints, fuentes y optimizaciones | [BACKEND.md](BACKEND.md) |
| `?date=` y snapshots diarios cross-stack | [../../docs/QUERY-DATE.md](../../docs/QUERY-DATE.md) |
| Routing, scope y dónde poner código | [../AGENTS.md](../AGENTS.md) |
| Arquitectura, scheduler, Docker y puertos | [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) |
| Playbooks para cambios de API o datos | [../../docs/HARNESS.md](../../docs/HARNESS.md) |
| Política de evidencia y mantenimiento | [../../docs/DOC-MAINTENANCE.md](../../docs/DOC-MAINTENANCE.md) |

El contrato canónico es `GET /openapi.json` con el backend en marcha. `BACKEND.md` resume ese contrato para lectura humana; si divergen, gana OpenAPI.

*Last updated: 2026-08-07*
