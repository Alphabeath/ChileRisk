# ChileRisk — documentación cross-stack

Esta carpeta contiene la documentación que cruza frontend y backend. El routing y el scope de cada área viven en [frontend/AGENTS.md](../frontend/AGENTS.md) y [backend/AGENTS.md](../backend/AGENTS.md).

## Qué necesitas → lee solo esto

| Necesitas… | Lee solo esto |
|------------|---------------|
| Entrar al monorepo y elegir área | [../AGENTS.md](../AGENTS.md) |
| Cambio de endpoint, parámetro o JSON compartido | [CONTRACT.md](CONTRACT.md) |
| Ver sistema, puertos, scheduler, Docker y despliegue | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Entender o cambiar `?date=` en ambos lados | [QUERY-DATE.md](QUERY-DATE.md) |
| Saber cuándo y dónde actualizar documentación | [DOC-MAINTENANCE.md](DOC-MAINTENANCE.md) |
| Estado, componentes, datos y rutas frontend | [../frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md) |
| Implementación visual frontend | [../frontend/docs/UI-GUIDELINES.md](../frontend/docs/UI-GUIDELINES.md) |
| Contexto portable de Impeccable | [../frontend/DESIGN.md](../frontend/DESIGN.md) |
| Propósito, posicionamiento y compromisos de producto | [../frontend/PRODUCT.md](../frontend/PRODUCT.md) |
| API, fuentes y scheduler backend | [../backend/docs/BACKEND.md](../backend/docs/BACKEND.md) |
| Verificar enlaces y contrato | [scripts/verify-doc-links.sh](scripts/verify-doc-links.sh) y `make verify` |

Los README de entrada pueden resumir y enlazar, pero no mantienen inventarios paralelos. Los `AGENTS.md` son los routers de scope y routing por área.

## Propiedad de la guía visual

- [../frontend/docs/UI-GUIDELINES.md](../frontend/docs/UI-GUIDELINES.md) es el contrato detallado y canónico de implementación visual.
- [../frontend/DESIGN.md](../frontend/DESIGN.md) es el contexto portable de Impeccable; no reemplaza ni duplica la guía operativa.

*Last updated: 2026-08-12*
