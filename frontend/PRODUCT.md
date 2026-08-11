# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

La audiencia primaria es la ciudadanía que vive en Chile o toma decisiones de seguridad para su hogar y comunidad. En planificación, durante una amenaza o al revisar una fecha reciente, necesita entender el riesgo de su región o comuna, consultar alertas oficiales y decidir acciones informadas.

## Product Purpose

ChileRisk es un monitor ciudadano multi-amenaza para Chile. Permite consultar riesgo territorial, alertas oficiales, sismos, calidad del aire, avisos meteorológicos, capas de evacuación, puntos de encuentro, guías de preparación y simulacros. El éxito del producto es que una persona pueda ubicar su contexto territorial, comprender las condiciones relevantes y actuar con información oficial, sin recibir datos sintéticos cuando una fuente no responde.

## Positioning

Su mecanismo distintivo es unificar y territorializar datos reales de múltiples fuentes oficiales en una experiencia ciudadana para las 16 regiones y 346 comunas de Chile. La vista de mapa, las alertas, la fecha seleccionada y el contenido de preparación conectan señales que normalmente están separadas entre organismos y páginas especializadas, manteniendo la atribución de cada fuente.

## Operating Context

- Es una aplicación web con rutas y copy visible en español. El destino configurado es [chilerisk.cl](https://chilerisk.cl); el stack local se ejecuta con Docker Compose o con el frontend Next.js de forma nativa.
- El flujo operativo principal es escanear el monitor, filtrar por alertas, aire o avisos meteorológicos, consultar una región o comuna, revisar sismos y cambiar la fecha civil de Chile dentro de una ventana de 30 días.
- `/evacuacion` se usa para revisar capas oficiales de tsunami, volcán e incendio y buscar puntos de encuentro cercanos. `/desastres` y sus detalles presentan guías SENAPRED; `/simulacros` presenta el calendario y contenido editorial relacionado.
- Los usuarios evalúan y actúan con datos observados. Si una fuente no responde, el producto no inventa valores de reemplazo. Las franjas oficiales de MeteoChile no se dibujan para una fecha pasada cuando el endpoint devuelve una colección vacía.

## Capabilities and Constraints

- **disponible:** landing (`/`), monitor multi-amenaza (`/monitor`), evacuación (`/evacuacion`), catálogo y detalle de guías (`/desastres`, `/desastres/[tipo]`) y simulacros (`/simulacros`). La matriz canónica y la evidencia de rutas están en `frontend/docs/FRONTEND.md`.
- **backend-only:** el backend expone capacidades de autenticación, resumen IA del dashboard, Plan Familia, chat ciudadano y perfil de usuario sin una superficie web ciudadana completa.
- **stub:** `/inicio`, `/preparacion`, `/asistente` y `/cuenta` son rutas visibles que muestran “Próximamente”.
- **ausente:** las rutas de inicio de sesión, registro, recuperación de contraseña y los pasos de kit de emergencia/Plan Familia todavía no tienen página.
- El frontend usa Next.js 16, React 19, TypeScript, Tailwind CSS 4, Bun, MapLibre y TanStack Query. El navegador consume HTTP mediante `frontend/lib/api.ts` y el proxy same-origin; nunca conecta directamente con PostgreSQL.
- Las ingestas y el contrato de datos pertenecen al backend. GeoJSON, PMTiles y snapshots de guías vendoreados en `frontend/public/data/` y `frontend/data/senapred/` son assets estáticos del frontend, no una conexión directa a la base de datos.
- Las URLs son españolas, los nombres de código y exports son ingleses, y el copy de la interfaz es español. Los estados `disponible`, `backend-only`, `stub` y `ausente` deben mantenerse explícitos; una capacidad de backend no se presenta como UI terminada.

## Brand Commitments

- El nombre del producto es **ChileRisk**.
- La voz existente es seria, clara y orientada a datos, con foco ciudadano e institucional chileno.
- La interfaz debe conservar la atribución a fuentes oficiales y no convertir inspiración, datos o capacidades futuras en afirmaciones de disponibilidad.
- El repositorio conserva `hero.png` como asset de marca y reconoce a TrueRisk como inspiración; esa referencia es una atribución, no un testimonio ni una promesa comercial.

## Evidence on Hand

- Fuentes reales documentadas: CSN para sismos e impactos territoriales; Open-Meteo y GloFAS para clima e inundación fluvial; SERNAPRED para alertas, eventos, simulacros y guías; SERNAGEOMIN/OVDAS para alertas volcánicas; Aire Chile para condiciones GEC; y MeteoChile AAA para avisos, alertas y alarmas DMC.
- Código y documentación comprobables en `frontend/app/`, `frontend/components/`, `frontend/lib/`, `frontend/docs/FRONTEND.md`, `frontend/docs/UI-GUIDELINES.md`, `backend/docs/BACKEND.md` y `docs/ARCHITECTURE.md`.
- Assets operativos vendoreados: GeoJSON y PMTiles en `frontend/public/data/`; snapshots e imágenes de guías SENAPRED en `frontend/data/senapred/` y `frontend/public/data/senapred/`; fuentes de evacuación descritas en `frontend/data/evacuacion-source/`.
- No hay testimonios, benchmarks, métricas de latencia, uptime, precios ni licencias de producto confirmados. No deben fabricarse para completar futuras superficies.

## Product Principles

1. Priorizar datos reales y oficiales sobre una falsa sensación de cobertura; una fuente caída no se reemplaza con valores inventados.
2. Hacer comprensible el riesgo en el territorio y en el tiempo: región, comuna y fecha son contextos de primera clase.
3. Convertir monitoreo en preparación y acción mediante alertas, evacuación, guías oficiales y simulacros.
4. Mantener una separación verificable entre la experiencia ciudadana, el proxy HTTP y los servicios de datos; el navegador nunca accede a PostgreSQL.
5. Atribuir el origen de la información y mantener estados de capacidad honestos: disponible, backend-only, stub o ausente.

## Accessibility & Inclusion

Requisito confirmado para las superficies ciudadanas: conservar contraste suficiente, foco visible y etiquetas/texto además del color para comunicar severidad; mantener objetivos táctiles de al menos 44 px en controles touch-first; y respetar `prefers-reduced-motion`. El contenido y los controles deben seguir siendo comprensibles cuando Mica, pulsos del mapa o animaciones están desactivados.

*Last updated: 2026-08-07*
