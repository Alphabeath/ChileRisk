# ChileRisk Frontend

Entrada corta al frontend ciudadano de ChileRisk (`frontend/`). Aquí viven las rutas Next.js, el mapa MapLibre, las superficies de evacuación y el contenido estático de preparación. El frontend consume el backend por HTTP mediante `frontend/lib/api.ts`; nunca conecta directamente con PostgreSQL.

## Estado actual

- **`disponible`:** `/`, `/monitor`, `/evacuacion`, `/desastres`, `/desastres/[tipo]` y `/simulacros`.
- **`stub`:** `/inicio`, `/preparacion`, `/asistente` y `/cuenta` muestran “Próximamente”.
- **`ausente`:** las rutas de autenticación y los pasos de kit/Plan Familia todavía no tienen página.

La matriz canónica, los componentes y las decisiones de datos están en [docs/FRONTEND.md](docs/FRONTEND.md). No crear una segunda matriz aquí.

## Desarrollo y verificación

```bash
cd frontend
bun run dev
```

Desde la raíz del monorepo:

```bash
make verify-frontend   # lint + bunx tsc --noEmit + bun test
```

Para probar el artefacto Next de producción:

```bash
cd frontend
bun run build
```

El stack completo se levanta desde la raíz con `make up`; su topología y puertos están en [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## Navegación por tarea

| Necesitas… | Lee solo esto |
|------------|---------------|
| Routing, scope, naming y ubicación de código | [AGENTS.md](AGENTS.md) |
| Componentes, datos, rutas y rendimiento frontend | [docs/FRONTEND.md](docs/FRONTEND.md) |
| Implementar o revisar la UI visual | [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md) |
| Consultar el contexto portable de Impeccable | [DESIGN.md](DESIGN.md) |
| Cambiar o entender el contrato `?date=` cross-stack | [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md) |

`docs/UI-GUIDELINES.md` es el contrato visual detallado y canónico. `DESIGN.md` es únicamente la proyección portable para Impeccable; no duplica la guía operativa.

*Last updated: 2026-08-07*
