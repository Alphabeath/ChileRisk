# Contrato FE ↔ BE

Referencia condicional para cambios de endpoint, parámetro o JSON compartido entre backend y frontend. El routing y el scope viven en los `AGENTS.md`; la política de escritura documental vive en [DOC-MAINTENANCE.md](DOC-MAINTENANCE.md).

## Cuándo abrir este flujo

Abre este documento solo si el cambio altera una respuesta HTTP, un endpoint, un parámetro compartido o el consumidor web de un contrato existente. Para un cambio interno de una sola área, sigue el `AGENTS.md` correspondiente sin añadir este flujo.

## Flujo obligatorio

Sigue esta secuencia completa:

```text
backend/app/schemas/ → /openapi.json → make sync-contract
    → frontend/lib/api-schema.d.ts
    → frontend/lib/types.ts / frontend/lib/api.ts / hook TanStack Query
    → consumidor
```

1. Cambia o revisa el schema en `backend/app/schemas/`.
2. Confirma el contrato en el OpenAPI runtime: `http://localhost:8000/openapi.json`.
3. Ejecuta `make sync-contract` desde la raíz.
4. Revisa el artefacto `frontend/lib/api-schema.d.ts`.
5. Actualiza `frontend/lib/types.ts`, `frontend/lib/api.ts` y el hook TanStack Query que corresponda.
6. Actualiza el consumidor web y comprueba sus estados de carga, vacío y error cuando apliquen.
7. Actualiza [backend/docs/BACKEND.md](../backend/docs/BACKEND.md) y [frontend/docs/FRONTEND.md](../frontend/docs/FRONTEND.md). Si el cambio modifica la semántica de `?date=`, actualiza también [QUERY-DATE.md](QUERY-DATE.md).
8. Ejecuta `make verify-contract` y los gates de las áreas tocadas (`make verify-frontend` y/o `make verify-backend`).

## Invariantes compartidos

- El OpenAPI runtime es la fuente canónica del contrato; los resúmenes humanos no lo sustituyen.
- El navegador accede a datos operacionales solo por HTTP mediante el proxy Next; nunca conecta directamente con PostgreSQL.
- Todo GET del backend consumido por la UI pasa por hooks TanStack Query, `fetchQuery` o `prefetchQuery`; no se introduce un `fetch` GET suelto en un componente.

*Last updated: 2026-08-12*
