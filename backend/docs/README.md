# Backend — documentación

Todo lo específico del API y servicios Python vive aquí. Cross-stack: [../../docs/README.md](../../docs/README.md).

El backend consume únicamente datos reales de CSN, Open-Meteo, SERNAPRED,
Aire Chile y SERNAGEOMIN. Si una fuente no responde, no se generan valores de reemplazo.

| Documento | Contenido |
|-----------|-----------|
| [BACKEND.md](./BACKEND.md) | Endpoints, env, scheduler, modelos, servicios |
| OpenAPI (runtime) | `GET /openapi.json` — ver [BACKEND.md](./BACKEND.md) § Contrato |

**Índice agente:** [../AGENTS.md](../AGENTS.md) · **Playbooks:** [../../docs/HARNESS.md](../../docs/HARNESS.md)

---

*Last updated: 2026-07-31*
