"use client"

import { useNationalRisk, useRecentEvents } from "@/hooks"
import { severityColor, formatMagnitude, formatDepth } from "@/lib/format"
import { getApiBase } from "@/lib/api"
import { Button } from "@/components/ui/button"

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
  } = useRecentEvents(24)

  const events = allEvents.slice(0, 8)
  const loading = risksLoading || eventsLoading
  const error = risksError || eventsError

  function handleRefresh() {
    refetchRisks()
    refetchEvents()
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard de Verificación</h1>
          <p className="text-muted-foreground mt-1">
            Conectado a backend mock: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{getApiBase()}</code>
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          {loading ? "Cargando..." : "Refrescar desde backend"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          {error.message} — ¿Backend corriendo en 8000?
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Riesgo Nacional (por región)</h2>
          </div>

          {risksLoading && risks.length === 0 ? (
            <div className="text-muted-foreground">Cargando datos mock del backend...</div>
          ) : (
            <div className="space-y-2 text-sm">
              {risks.map((r) => (
                <div key={r.codregion} className="flex items-center justify-between rounded border px-3 py-2">
                  <div className="font-medium">{r.name}</div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    {r.avg_temperature_c != null && (
                      <span title="Temperatura promedio" className="text-blue-400">{r.avg_temperature_c.toFixed(1)}°C</span>
                    )}
                    {r.avg_wind_speed_kmh != null && (
                      <span title="Viento promedio" className="text-cyan-400">{r.avg_wind_speed_kmh.toFixed(0)} km/h</span>
                    )}
                    <span title="Compuesto">{r.composite_score.toFixed(1)}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${severityColor(r.severity)}`}>
                      {r.severity}
                    </span>
                    <span className="text-muted-foreground">{r.dominant_hazard}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">Fuente: GET /api/v1/risk/national (actualizado por scheduler cada 15min)</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-medium mb-4">Eventos sísmicos recientes (24h)</h2>
          {eventsLoading && events.length === 0 ? (
            <div className="text-muted-foreground">Cargando...</div>
          ) : events.length === 0 ? (
            <div className="text-muted-foreground">Sin eventos recientes</div>
          ) : (
            <div className="space-y-1.5 text-sm font-mono">
              {events.map((e) => (
                <div key={e.id} className="flex justify-between border-b border-border/60 py-1 last:border-0">
                  <span>{formatMagnitude(e.magnitude)} · {formatDepth(e.depth_km)}</span>
                  <span className="text-muted-foreground">{new Date(e.occurred_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">Fuente: GET /api/v1/events?hours=24 (datos mock del backend)</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-4">
        Verificación de conexión: si ves números arriba (no errores), el frontend está consumiendo exitosamente los datos mockeados del backend vía fetch en <code>lib/api.ts</code>.
        Los scores cambian levemente cada 15 minutos por el scheduler.
      </div>
    </div>
  )
}
