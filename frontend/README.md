# ChileRisk Frontend

Entrada humana al frontend ciudadano de ChileRisk (`frontend/`). Aquí viven las rutas Next.js, el mapa MapLibre, las superficies de evacuación y el contenido estático de preparación. El frontend consume el backend por HTTP mediante `frontend/lib/api.ts`; nunca conecta directamente con PostgreSQL.

## Referencias canónicas

| Necesitas… | Lee |
|------------|-----|
| Routing, scope, naming y ubicación de código | [AGENTS.md](AGENTS.md) |
| Estado de rutas, componentes, datos y rendimiento | [docs/FRONTEND.md](docs/FRONTEND.md) |
| Implementar o revisar la UI visual | [docs/UI-GUIDELINES.md](docs/UI-GUIDELINES.md) |
| Propósito, posicionamiento, marca y accesibilidad | [PRODUCT.md](PRODUCT.md) |
| Contexto portable de Impeccable | [DESIGN.md](DESIGN.md) |

La matriz de rutas y la separación entre evidencia web y backend-only viven en sus documentos propietarios; este README no los duplica.

## Desarrollo y verificación

```bash
cd frontend
bun run dev
```

Next no lee el `.env` de la raíz. En desarrollo Auth.js y el JWT guest comparten el fallback de `lib/auth-secret.ts` si no hay `AUTH_SECRET`. En producción hay que inyectarlo (mismo valor que el backend). Docker Compose ya lo hace.

Desde la raíz del monorepo:

```bash
make verify-frontend
```

Para probar el artefacto Next de producción:

```bash
cd frontend
bun run build
```

El contrato `?date=` cross-stack está en [../docs/QUERY-DATE.md](../docs/QUERY-DATE.md); la topología y los puertos están en [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

*Last updated: 2026-08-12*
