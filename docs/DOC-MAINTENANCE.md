# Documentación — política de escritura

Reglas para cualquier agente o desarrollador que modifique ChileRisk. La documentación debe describir capacidades comprobables, no intenciones de producto.

---

## Matriz de cambios y ownership

Actualiza la fuente canónica en el mismo task cuando el cambio altera el comportamiento observable:

| Cambio comprobable | Fuente canónica | Artefactos adicionales |
|---------------------|------------------|------------------------|
| Contrato HTTP: endpoint, parámetro o forma de respuesta | `backend/docs/BACKEND.md` + schemas/OpenAPI | `make sync-contract`; si hay consumidor web, `frontend/docs/FRONTEND.md`, `frontend/lib/api-schema.d.ts`, `frontend/lib/types.ts`, `frontend/lib/api.ts`, hook y consumidor |
| Modelo, job, fuente o error backend | `backend/docs/BACKEND.md` | Código, configuración y pruebas del backend que aporten la evidencia |
| Ruta o UX pública | `frontend/docs/FRONTEND.md` | `frontend/docs/UI-GUIDELINES.md` si cambia la implementación visual |
| Decisión visual de implementación | `frontend/docs/UI-GUIDELINES.md` | `frontend/DESIGN.md` solo si la decisión también es portable |
| Decisión visual portable | `frontend/DESIGN.md` | `frontend/docs/UI-GUIDELINES.md` si requiere una regla operativa |
| Propósito, audiencia, posicionamiento, compromisos de marca o accesibilidad portable | `frontend/PRODUCT.md` | `frontend/DESIGN.md` o `UI-GUIDELINES.md` solo para la consecuencia visual correspondiente |
| Semántica de `?date=` | `docs/QUERY-DATE.md` | Referencias de `backend/docs/BACKEND.md` y `frontend/docs/FRONTEND.md`; contrato y tipos si cambia JSON |
| Arquitectura, puertos o deploy | `docs/ARCHITECTURE.md` | `AGENTS.md` del área solo si cambia routing o scope |
| Nueva área o ubicación de código | `AGENTS.md` del área | Documento de referencia del área solo si cambia su destino o ownership |
| Fix interno sin cambio de contrato, UX o routing | Ninguna referencia nueva por defecto | Evidencia técnica y pruebas aplicables |

No dupliques una referencia larga en un `AGENTS.md` o README de entrada. Una sola fuente contiene el detalle; las entradas humanas resumen y enlazan.

## Propietarios de evidencia

- `frontend/docs/FRONTEND.md`, sección **Estado de rutas**, es la única fuente de `disponible`, `stub` y `ausente`.
- `backend/docs/BACKEND.md`, sección **API consumida por la web | API backend-only**, es la única fuente de `backend-only`.
- Los README humanos pueden resumir y enlazar esas secciones, pero no mantienen inventarios paralelos.
- La evidencia se comprueba en manifests, archivos reales bajo `frontend/app/`, OpenAPI runtime y símbolos/configuración existentes. No inventes benchmarks, latencias, uptime ni disponibilidad externa.
- Una fuente real vacía o caída no se convierte en un dato sintético; un endpoint sin consumidor web no se presenta como UI terminada.

## Flujo visual portable

Para cambios visuales, `frontend/docs/UI-GUIDELINES.md` sigue siendo el contrato detallado de implementación. `frontend/DESIGN.md` y `frontend/PRODUCT.md` forman, junto con `impeccable` y `bun run impeccable:detect`, el contexto portable de Impeccable.

Conserva el frontmatter de `DESIGN.md` y el comentario `impeccable:product-schema 1` de `PRODUCT.md`. Actualiza `PRODUCT.md` cuando cambien propósito, audiencia, posicionamiento, compromisos de marca o accesibilidad portable; actualiza `DESIGN.md` cuando cambien decisiones visuales portables.

## Checklist universal

- [ ] Evidencia comprobada en la fuente canónica y en el código/configuración que la respalda.
- [ ] OpenAPI sincronizado cuando cambia un contrato HTTP (`make sync-contract`).
- [ ] Cada Markdown tocado termina con una única línea `Last updated: YYYY-MM-DD`.
- [ ] Enlaces locales comprobados con `make verify-docs`.
- [ ] Gate de área y `make verify` ejecutados cuando corresponda.
- [ ] `cd frontend && bun run build` ejecutado solo cuando cambia el artefacto Next.

El alcance de Markdown mantenido lo define exclusivamente `docs/scripts/verify-doc-links.sh`; no se replica aquí en una lista manual. Ese verificador no amplía su alcance a `misc/`, `TrueRisk/` ni `.agents/`.

## Aprobación del usuario

Las ediciones en `docs/`, `backend/docs/` y `frontend/docs/` están permitidas cuando forman parte del task. Cambios en `docker-compose.yml`, root `.env` y `.gitignore` siguen requiriendo aprobación explícita según [AGENTS.md](../AGENTS.md).

*Last updated: 2026-08-12*
