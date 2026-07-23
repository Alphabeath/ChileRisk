"use client"

import { useNationalRisk, useRecentEvents } from "@/hooks"
import { severityColor, formatMagnitude, formatDepth } from "@/lib/format"
import { getApiBase } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const {
    data: risks = [],
    isLoading: risksLoading,
    error: risksError,
    refetch: refetchRisks,
  } = useNationalRisk()

  const {
    data: allEvents = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useRecentEvents()

  const events = allEvents.slice(0, 8)
  const loading = risksLoading || eventsLoading
  const error = risksError || eventsError

  function handleRefresh() {
    refetchRisks()
    refetchEvents()
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 p-8 pt-24">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Dashboard de Verificación
          </h1>
          <p className="mt-1 text-white/55">
            Conectado al backend:{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-white/80">
              {getApiBase()}
            </code>
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          {loading ? "Cargando..." : "Refrescar desde backend"}
        </Button>
      </div>

      {error && (
        <div className="border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          {error.message} — ¿Backend corriendo en 8000?
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "p-6")}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-medium text-white/90">
              Riesgo Nacional (por región)
            </h2>
          </div>

          {risksLoading && risks.length === 0 ? (
            <div className="text-white/55">Cargando datos del backend...</div>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {risks.map((r) => (
                <div
                  key={r.codregion}
                  className="flex items-center justify-between border border-white/10 px-3 py-2"
                >
                  <div className="font-medium text-white/90">{r.name}</div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    {r.avg_temperature_c != null && (
                      <span title="Temperatura promedio" className="text-blue-400">
                        {r.avg_temperature_c.toFixed(1)}°C
                      </span>
                    )}
                    {r.avg_wind_speed_kmh != null && (
                      <span title="Viento promedio" className="text-cyan-400">
                        {r.avg_wind_speed_kmh.toFixed(0)} km/h
                      </span>
                    )}
                    <span title="Compuesto" className="text-white/80">
                      {r.composite_score.toFixed(1)}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${severityColor(r.severity)}`}
                    >
                      {r.severity}
                    </span>
                    <span className="text-white/45">{r.dominant_hazard}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10px] text-white/45">
            Fuente: GET /api/v1/risk/national (actualizado por scheduler cada 15min)
          </p>
        </div>

        <div className={cn(GLASS_PANEL_CLASS, GLASS_MICA_INTERACTIVE_CLASS, "p-6")}>
          <h2 className="mb-4 text-xl font-medium text-white/90">
            Eventos sísmicos recientes (24h)
          </h2>
          {eventsLoading && events.length === 0 ? (
            <div className="text-white/55">Cargando...</div>
          ) : events.length === 0 ? (
            <div className="text-white/55">Sin eventos recientes</div>
          ) : (
            <div className="flex flex-col gap-1.5 font-mono text-sm">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="flex justify-between border-b border-white/10 py-1 last:border-0"
                >
                  <span className="text-white/90">
                    {formatMagnitude(e.magnitude)} · {formatDepth(e.depth_km)}
                  </span>
                  <span className="text-white/45">
                    {new Date(e.occurred_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10px] text-white/45">
            Fuente: GET /api/v1/events?date=YYYY-MM-DD
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 text-xs text-white/45">
        Verificación de conexión: si ves números arriba (no errores), el frontend está
        consumiendo exitosamente los datos del backend vía fetch en{" "}
        <code>lib/api.ts</code>. Los scores cambian levemente cada 15 minutos por el
        scheduler.
      </div>
    </div>
  )
}
