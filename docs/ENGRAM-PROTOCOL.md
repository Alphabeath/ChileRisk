# ENGRAM-PROTOCOL.md — Protocolo de Memoria Engram (ChileRisk)

> Enlace desde root `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md`, `docs/HARNESS-QUICK.md`.
> Para reglas personales (no compartidas), usa `~/.config/opencode/AGENTS.md`.

---

## Inicio de sesión

**Ejecuta esto ANTES de tocar cualquier archivo** (usa las tools disponibles):

```
engram_mem_context
engram_mem_search "<área de trabajo de hoy o keywords relevantes>"
```

Si `engram_mem_context` devuelve estado de sesión anterior, léelo completo antes de continuar.

CLI alternativo (si usas terminal): `engram search "..." --project chilerisk`

---

## Qué guardar — criterio estricto

Guarda **únicamente** cuando se cumpla al menos una condición:

**Decisión de arquitectura**
- Se eligió una tecnología, patrón o estructura por encima de una alternativa viable.
- El "por qué" no es deducible leyendo el código.
- Ejemplos: BFF vs llamada directa a DB, estrategia de auth, estructura de carpetas no convencional, contrato FE↔BE centralizado.

**Patrón o convención del proyecto**
- Una forma específica de hacer algo que se repite en el codebase.
- Contratos de API internos, naming conventions, manejo de errores, estructura de componentes, flujo de snapshots diarios.
- Algo que un dev nuevo tendría que preguntar o descubrir por error.

**Causa raíz no trivial de un bug**
- Solo si es contraintuitiva o podría reproducirse en otro lugar.
- Se guarda el patrón causante, **no el fix en sí**.

---

## Qué NO guardar

- ✗ Cambios rutinarios: renombrar variables, formateo, refactors menores.
- ✗ Cosas ya presentes en el código o en la documentación.
- ✗ Pasos de instalación o comandos de docs oficiales.
- ✗ TODOs o tareas pendientes (usa el issue tracker).
- ✗ Progreso de implementación: "terminé el componente X" es ruido.
- ✗ Cualquier cosa que se resuelva con `grep`, `glob`, `read` o leyendo el código.

**Ante la duda: no guardes.**

---

## Formato de mem_save (usa la tool `engram_mem_save`)

Usa esta estructura siempre para que las búsquedas sean útiles:

```
title:   [ARCH | PATTERN | BUG] — descripción en menos de 8 palabras
type:    architecture | pattern | bug
content (estructura):
  **What**: Qué se decidió o se descubrió (1-2 oraciones)
  **Why**: El razonamiento detrás (no el resultado)
  **Where**: Paths concretos: frontend/lib/api.ts, backend/app/schemas/alert.py, docs/QUERY-DATE.md
  **Learned**: Qué replicar o qué evitar en situaciones similares
```

**Ejemplo adaptado a ChileRisk:**

```
title:   ARCH — FE↔BE contract via schemas/types/api.ts
type:    architecture
What:    Contrato JSON se define en backend/app/schemas/*, se refleja en frontend/lib/types.ts, y se consume vía frontend/lib/api.ts. Nunca se consulta Postgres directamente desde FE.
Why:     Centralizar el contrato elimina drift entre stacks; OpenAPI en runtime (/openapi.json) es la fuente de verdad. Cambios de campo se propagan en el mismo task.
Where:   backend/app/schemas/*.py, frontend/lib/types.ts, frontend/lib/api.ts, backend/docs/BACKEND.md, frontend/docs/FRONTEND.md
Learned: Al tocar un schema o type, actualizar el otro lado + docs + correr make verify-contract en el mismo paso. No asumir que "el otro lado ya lo sabe".
```

---

## Frecuencia

- **No guardes en tiempo real** mientras programas.
- Guarda **al cerrar una tarea significativa**: PR listo, feature terminada, bug importante resuelto.
- Máximo **2-3 memorias por sesión** — si quieres guardar más, revisa si realmente pasan el criterio estricto.
- Al cerrar sesión con memorias guardadas: llama `engram_mem_session_summary` con la estructura Goal/Instructions/Discoveries/Accomplished/Next Steps/Relevant Files.

---

## Búsqueda antes de implementar algo nuevo

```
engram_mem_search "contrato"
engram_mem_search "manejo de errores"
engram_mem_search "riesgo diario" "date" "snapshot"
engram_mem_search "hybrid mode" "USE_REAL"
```

Si un recuerdo existente cubre el tema, respétalo.
Si vas a desviarte de él, guarda un nuevo recuerdo explicando el cambio de criterio.

---

## Compactación de contexto

Si OpenCode compacta el contexto durante la sesión, ejecuta inmediatamente:

```
engram_mem_context
```

Esto restaura el estado antes de continuar. No asumas que recuerdas el contexto previo.

---

## Ritual de cierre (solo si guardaste memorias)

1. `engram_mem_session_summary` (con el formato estructurado).
2. `make verify`
3. Actualizar docs según DOC-MAINTENANCE.md (si aplica).

---

*Last updated: 2026-06-10*
*Integrado desde root AGENTS.md y harness docs.*