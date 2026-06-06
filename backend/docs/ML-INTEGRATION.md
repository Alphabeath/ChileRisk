# Integración de Machine Learning en ChileRisk

**Fecha**: 2026-06-03  
**Estado**: diseño propuesto — sin implementación  
**Alcance**: arquitectura, datos, flags, contrato API y plan de PRs  
**Prerrequisito**: motor de riesgo determinístico actual + alertas por hazard (`alert_evaluator`)

---

## 1. Objetivo

Incorporar ML **sin romper** el contrato frontend ↔ backend ni sustituir de golpe las reglas actuales. El sistema seguirá funcionando 100 % con heurísticas si `USE_ML_*=false`.

**Metas (ordenadas):**

1. Mejorar estimación de intensidad/riesgo sísmico por comuna (GMPE aprendido o híbrido).
2. Pronosticar riesgo climático 24–72 h (ola de calor/frío/viento).
3. (Opcional, fase 3) Calibrar umbrales de alerta con datos históricos SERNAPRED + ChileRisk.

**No metas (v1):**

- Deep learning pesado en el hot path del scheduler.
- Cambiar coropleta/composite sin baseline comparativo.
- Entrenar dentro del contenedor FastAPI en producción.
- Nuevo servicio de inferencia separado (solo si v2 lo exige por latencia/tamaño).

---

## 2. Baseline actual (punto de partida)

```
CSN / mock ──▶ seismic_events ──▶ impact_service (Haversine + estimate_intensity)
                                        │
                                        ▼
                                 seismic_impacts ──▶ risk_service ──▶ risk_scores
Open-Meteo ──▶ climate_readings ────────────────────────────────┘
                                        │
                                        ▼
                              alert_evaluator (umbrales por hazard)
```

| Componente | Archivo | Naturaleza |
|------------|---------|------------|
| Intensidad sísmica | `seismic_service.estimate_intensity()` | Fórmula fija |
| Score 0–100 | `intensity_to_risk_score()` | Lineal |
| Clima | `openmeteo_service` | Reglas sobre T°/viento |
| Composite mapa | `compute_composite_and_dominant()` | Pesos fijos |
| Alertas | `alert_evaluator.py` | Umbrales fijos |

**Activos de datos ya persistidos:** `seismic_events`, `seismic_impacts`, `risk_scores`, `climate_readings`, `senapred_alerts`, 346 comunas con centroides.

---

## 3. Principios de diseño

| # | Principio |
|---|-----------|
| 1 | **Reglas por defecto** — ML es opt-in vía `.env`. |
| 2 | **Shadow primero** — predicciones ML se guardan pero no gobiernan UI hasta validación. |
| 3 | **Mismo contrato API** — campos actuales intactos; extensiones opcionales (`ml_*`, `model_version`). |
| 4 | **Entrenamiento offline** — scripts/notebooks fuera del request path. |
| 5 | **Inferencia acotada** — &lt; 2 s para batch 346 comunas en CPU (ONNX/sklearn). |
| 6 | **Trazabilidad** — cada score publicado referencia `model_id` + `trained_at`. |
| 7 | **Monorepo** — training en `backend/ml/`; runtime en `backend/app/ml/` (sin carpeta top-level nueva). |

---

## 4. Casos de uso y prioridad

### Fase A — Intensidad sísmica (GMPE ML)

**Entrada:** `magnitude`, `depth_km`, `distance_km`, `codregion`, opcional `latitude`/`longitude` epicentro y comuna.  
**Salida:** `estimated_intensity_ml` (0–10) y/o `risk_score_ml` (0–100).  
**Integración:** `impact_service.compute_and_store_event_impact` y/o capa en `risk_service` al leer impacts.

**Labels (por prioridad):**

1. Intensidad reportada en fichas CSN / macrosísmica (manual o scrape futuro).
2. Comparación shadow vs regla en eventos históricos (`seismic_impacts` + eventos).
3. Shakemaps externas (USGS, futuro) por comuna.

**Modelo sugerido v1:** Gradient Boosting (LightGBM/XGBoost) o regresión ridge; export ONNX o coeficientes JSON.

---

### Fase B — Pronóstico climático

**Entrada:** ventana de `climate_readings` + forecast horario Open-Meteo (nuevo fetch).  
**Salida:** `ola_calor_score_forecast_24h`, etc., por comuna.

**Integración:** job scheduler `climate_forecast` (cada 60 min), escritura en tabla `risk_forecasts`. El mapa actual sigue usando scores “now”; UI puede opt-in a capa “pronóstico”.

**Modelo sugerido v1:** XGBoost con lags + features de forecast; alternativa Prophet por comuna solo en regiones piloto.

---

### Fase C — Calibración de alertas (opcional)

**Entrada:** features regionales al momento del evento + histórico SERNAPRED.  
**Salida:** umbrales dinámicos o `P(alerta útil)` — **no reemplazar** SERNAPRED; solo ChileRisk.

Requiere dataset etiquetado suficiente; posponer hasta Fase A en shadow ≥ 30 días.

---

## 5. Arquitectura objetivo

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENTRENAMIENTO (offline)                      │
│  backend/ml/train_seismic.py  │  train_climate_forecast.py     │
│  Lee Postgres / CSV dumps     │  Escribe backend/ml/artifacts/ │
└───────────────────────────────┬─────────────────────────────────┘
                                │ artefactos versionados
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              RUNTIME (FastAPI lifespan + scheduler)              │
│  app/ml/loader.py ──▶ app/ml/seismic.py | climate.py           │
│       │                                                          │
│       ├── shadow: INSERT model_predictions                       │
│       └── blend/replace: patch scores en risk_service            │
└─────────────────────────────────────────────────────────────────┘
```

### Modos de operación

| Modo | `ML_MODE` | Comportamiento |
|------|-----------|----------------|
| Off | `off` | Solo reglas (default). |
| Shadow | `shadow` | Reglas publican; ML persiste en `model_predictions`. |
| Blend | `blend` | `score = α·rule + (1-α)·ml` (`ML_BLEND_ALPHA`). |
| Replace | `replace` | ML sustituye regla en el hazard habilitado. |

α y modo pueden ser distintos por hazard: `ML_SEISMIC_MODE`, `ML_CLIMATE_MODE`.

---

## 6. Modelo de datos (PostgreSQL)

### 6.1 `ml_models` — registro de artefactos

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador del modelo |
| `name` | varchar | ej. `seismic_gmpe_v1` |
| `hazard` | varchar | `sismo` \| `ola_calor` \| … |
| `version` | varchar | semver o fecha |
| `artifact_path` | varchar | Ruta en volumen Docker |
| `metrics_json` | jsonb | MAE, RMSE, calibration |
| `trained_at` | timestamptz | |
| `is_active` | bool | Solo uno activo por hazard |

### 6.2 `model_predictions` — salida shadow / auditoría

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigserial PK | |
| `model_id` | UUID FK | |
| `cod_comuna` | int | |
| `event_id` | int nullable | Solo sismo |
| `predicted_at` | timestamptz | |
| `target` | varchar | `intensity` \| `sismo_score` \| `ola_calor_forecast_24h` |
| `value_rule` | float | Baseline regla |
| `value_ml` | float | Predicción ML |
| `value_published` | float | Lo que vio el usuario (blend/replace) |
| `mode` | varchar | shadow \| blend \| replace |

Índices: `(cod_comuna, predicted_at)`, `(event_id)`, `(model_id)`.

### 6.3 `risk_forecasts` — pronóstico climático (Fase B)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cod_comuna` | int | |
| `horizon_hours` | int | 24, 48, 72 |
| `ola_calor_score` | float | |
| `ola_frio_score` | float | |
| `viento_score` | float | |
| `model_id` | UUID FK | |
| `forecast_for` | timestamptz | Validez del pronóstico |
| `created_at` | timestamptz | |

### 6.4 Extensiones opcionales en API (no breaking)

En `ComunaRisk` / respuestas de riesgo (Pydantic + `frontend/lib/types.ts`):

```json
{
  "sismo_score": 49.9,
  "sismo_score_ml": 52.1,
  "model_version": "seismic_gmpe_v1",
  "ml_mode": "shadow"
}
```

Campos **opcionales** (`null` si ML off). Frontend los ignora hasta implementar capa “ML”.

---

## 7. Variables de entorno (propuesta)

Añadir al root `.env.example` (requiere aprobación explícita al implementar):

```env
# --- Machine Learning (opt-in) ---
ML_MODE=off                          # off | shadow | blend | replace
ML_SEISMIC_ENABLED=false
ML_CLIMATE_FORECAST_ENABLED=false
ML_BLEND_ALPHA=0.5                   # peso regla en blend (1.0 = solo regla)
ML_ARTIFACTS_DIR=/app/ml/artifacts   # volumen Docker
ML_ACTIVE_SEISMIC_MODEL=seismic_gmpe_v1
ML_ACTIVE_CLIMATE_MODEL=climate_fcst_v1
ML_INFERENCE_BATCH_SIZE=346
ML_LOG_PREDICTIONS=true              # persistir model_predictions en shadow
```

`config.py` (Pydantic) refleja lo mismo; defaults mantienen comportamiento actual.

---

## 8. Estructura de código propuesta

```
backend/
├── ml/                              # training offline (no en imagen slim opcional)
│   ├── README.md
│   ├── artifacts/                   # .gitignore
│   ├── datasets/
│   ├── train_seismic.py
│   ├── train_climate_forecast.py
│   └── evaluate_shadow.py
├── app/
│   └── ml/
│       ├── __init__.py
│       ├── loader.py                # carga ONNX/pickle al lifespan
│       ├── seismic.py               # predict_intensity(features)
│       ├── climate.py               # predict_forecast(features)
│       └── schemas.py               # FeatureVector, PredictionResult
├── app/services/
│   ├── impact_service.py            # hook ML en intensidad
│   ├── risk_service.py              # hook blend/replace scores
│   └── ml_prediction_service.py     # persistencia model_predictions
└── tests/
    ├── test_ml_seismic.py
    └── test_ml_loader.py
```

**Docker:** montar volumen `ml_artifacts:` en `/app/ml/artifacts`. Imagen base incluye `onnxruntime` o `scikit-learn` solo si `ML_*_ENABLED=true` (multi-stage build opcional).

---

## 9. Flujo de inferencia sísmica (Fase A)

```
evento nuevo
    │
    ▼
compute_and_store_event_impact()
    │
    ├─ intensity_rule = estimate_intensity(...)
    │
    └─ si ML_SEISMIC_ENABLED:
           intensity_ml = seismic_model.predict(...)
           INSERT model_predictions (shadow)
           si mode in (blend, replace):
               intensity_pub = f(intensity_rule, intensity_ml)
               guardar en seismic_impacts.estimated_intensity  # o columna paralela
    │
    ▼
risk_service lee impacts ──▶ sismo_score (como hoy)
```

**Columna alternativa (más segura para rollback):**  
`seismic_impacts.estimated_intensity_ml` + flag; publicación elige columna según `ML_MODE`.

---

## 10. Feature engineering (referencia)

### Sismo (por par evento–comuna)

| Feature | Fuente |
|---------|--------|
| `magnitude`, `depth_km` | `seismic_events` |
| `distance_km` | calculado |
| `log10_distance` | derivado |
| `codregion` | `comunas` |
| `lat_epicenter`, `lon_epicenter` | evento |
| `lat_comuna`, `lon_comuna` | comuna |
| `hour_of_day`, `dow` | `occurred_at` |

### Clima (por comuna, ventana 7–14 días)

| Feature | Fuente |
|---------|--------|
| lags T°, viento | `climate_readings` |
| rolling max/mean 24h | derivado |
| forecast T° max próx 24h | Open-Meteo API |
| `codregion`, mes | estacionalidad |

---

## 11. Métricas de éxito

| Fase | Métrica | Objetivo inicial |
|------|---------|------------------|
| A shadow | MAE intensidad vs label | &lt; regla baseline |
| A shadow | % eventos “La Higuera-like” detectados | ≥ baseline |
| A prod | False alerts sísmicas / semana | no subir &gt; 10 % vs reglas |
| B | MAE score calor 24h ahead | &lt; persistir último valor |
| C | Concordancia con SERNAPRED | informativa, no bloqueante |

Dashboard mínimo: script `evaluate_shadow.py` + query SQL sobre `model_predictions`.

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Pocos labels de intensidad real | Shadow largo; empezar con pseudo-labels CSN |
| Latencia en `impact_service` | Vectorizar batch; ONNX; precompute solo al insertar evento |
| Deriva del modelo | `ml_models.is_active` + retrain mensual |
| Caja negra ciudadana | Explicar con top features (SHAP offline) en docs |
| Imagen Docker más pesada | Dependencia ML opcional en stage build |
| Desalineación contrato TS/Python | Mismos campos opcionales en un solo PR |

---

## 13. Plan de PRs (DAG)

Implementar en orden; cada PR es desplegable con ML apagado.

```
PR-1 (fundaciones)
  ├── ml_models + model_predictions (Alembic o create_all migration)
  ├── app/ml/loader.py (stub sin modelo)
  ├── Settings ML_* en config.py
  └── tests migración + settings defaults

PR-2 (Fase A — shadow sísmico)
  ├── backend/ml/train_seismic.py + artifact ejemplo
  ├── app/ml/seismic.py + hook impact_service
  ├── ml_prediction_service persistencia
  └── tests unitarios predict + shadow insert

PR-3 (Fase A — evaluación)
  ├── evaluate_shadow.py + queries documentadas
  └── backend/docs/BACKEND.md sección ML (opcional)

PR-4 (Fase A — blend piloto)
  ├── ML_MODE=blend solo codregion piloto (env list)
  ├── métricas log estructurado
  └── validación manual La Higuera + región 13

PR-5 (Fase B — forecast)
  ├── risk_forecasts tabla
  ├── scheduler job climate_forecast
  ├── train_climate_forecast.py
  └── endpoint opcional GET /api/v1/comunas/{id}/forecast

PR-6 (frontend opt-in)
  ├── types.ts campos opcionales ml_*
  └── capa mapa / tooltip “pronóstico 24h” (feature flag)
```

**Estimación:** PR-1–2 ~3–5 días; PR-5 ~1 semana con datos históricos suficientes.

---

## 14. Validación manual (post PR-2)

```bash
# Shadow: debe haber filas ML sin cambiar scores públicos
docker compose exec db psql -U chilerisk -d chilerisk -c \
  "SELECT COUNT(*) FROM model_predictions WHERE mode='shadow';"

# Comparar regla vs ML para último evento en región 4
curl -s 'http://localhost:8000/api/v1/events?hours=48' | jq '.[0].id'
curl -s 'http://localhost:8000/api/v1/events/{id}/impact' | jq '.affected_comunas[:5]'
```

---

## 15. Decisiones abiertas

| # | Pregunta | Recomendación provisional |
|---|----------|---------------------------|
| 1 | ¿Columna nueva en `seismic_impacts` vs sobrescribir? | Columna `*_ml` + publicación explícita |
| 2 | ¿Alembic o solo `create_all`? | Alembic si ya se adopta; si no, SQL migration en PR-1 |
| 3 | ¿Incluir sklearn en imagen default? | Sí en dev; prod slim con build arg |
| 4 | ¿Quién provee labels CSN intensidad? | Spike scrape + etiquetado manual 50 eventos |
| 5 | ¿ML en alert_evaluator fase 1? | No — solo scores primero |

---

## 16. Referencias internas

- `backend/app/services/seismic_service.py` — baseline a reemplazar/mejorar  
- `backend/app/services/impact_service.py` — hook principal Fase A  
- `backend/app/services/alert_evaluator.py` — consumidor downstream (umbrales fijos hasta Fase C)  
- `docs/ARCHITECTURE.md` (raíz) — flujo híbrido CSN/Open-Meteo
- Root `AGENTS.md` — aprobación para `.env.example` y docs  

---

*Documento de diseño únicamente. No modifica código ni configuración hasta aprobación e implementación por PR.*