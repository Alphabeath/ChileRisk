"use client"

import { useEffect, useMemo, useState } from "react"

import {
  TerritoryDetailContent,
  type TerritoryDetailStatus,
} from "@/components/map/territory-detail-content"
import type {
  ComunaProperties,
  RegionProperties,
} from "@/components/map/map-config"
import { MapPopup } from "@/components/ui/map"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useMonitorLiveData } from "@/components/map/monitor-live-data"
import { useComunaRisk, useRegionRisk } from "@/hooks"
import {
  filterActiveAlertsBySource,
  filterAlertsForComuna,
  filterAlertsForRegion,
  POPUP_MAX_ALERTS,
  sortActiveAlertsBySeverity,
} from "@/lib/alerts-display"
import {
  filterZonesForComuna,
  filterZonesForRegion,
  sortZonesBySeverity,
} from "@/lib/air-quality-display"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import type { ActiveAlert, AirQualityZone } from "@/lib/types"
import type { TerritoryRiskFields } from "@/lib/territory-risk-mock"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

const MD_QUERY = "(min-width: 768px)"

export type TerritoryKind = "region" | "comuna"

export type TerritorySelection =
  | {
      lng: number
      lat: number
      kind: "region"
      properties: RegionProperties
    }
  | {
      lng: number
      lat: number
      kind: "comuna"
      properties: ComunaProperties
    }

function useIsDesktopMd() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY)
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return isDesktop
}

function riskFromProperties(
  kind: TerritoryKind,
  properties: RegionProperties | ComunaProperties,
): Partial<TerritoryRiskFields> {
  const base: Partial<TerritoryRiskFields> = {
    composite_score: properties.composite_score,
    severity: properties.severity,
    dominant_hazard: properties.dominant_hazard,
    sismo_score: properties.sismo_score,
    ola_calor_score: properties.ola_calor_score,
    ola_frio_score: properties.ola_frio_score,
    viento_score: properties.viento_score,
    inundacion_score: properties.inundacion_score,
  }
  if (kind === "region") {
    const p = properties as RegionProperties
    return {
      ...base,
      temperature_c: p.avg_temperature_c ?? null,
      wind_speed_kmh: p.avg_wind_speed_kmh ?? null,
    }
  }
  const p = properties as ComunaProperties
  return {
    ...base,
    temperature_c: p.temperature_c ?? null,
    wind_speed_kmh: p.wind_speed_kmh ?? null,
  }
}

function useTerritoryDetail(selection: TerritorySelection): {
  title: string
  parent?: string
  status: TerritoryDetailStatus
  risk: Partial<TerritoryRiskFields> | null
  alerts: ActiveAlert[]
  airZones: AirQualityZone[]
  alertsLoading: boolean
} {
  const { kind, properties } = selection
  const title =
    kind === "region"
      ? (properties as RegionProperties).Region
      : (properties as ComunaProperties).Comuna
  const parent =
    kind === "comuna"
      ? [
          (properties as ComunaProperties).Provincia,
          (properties as ComunaProperties).Region,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined

  const codregion = properties.codregion
  const codComuna =
    kind === "comuna" ? (properties as ComunaProperties).cod_comuna : 0

  const regionQuery = useRegionRisk(kind === "region" ? codregion : 0)
  const comunaQuery = useComunaRisk(kind === "comuna" ? codComuna : 0)
  const { alerts: liveAlerts, air, isPending: livePending } = useMonitorLiveData()
  const alertsFilter = useUIStore((s) => s.alertsFilter)

  const alerts = useMemo(() => {
    const byTerritory =
      kind === "region"
        ? filterAlertsForRegion(liveAlerts, codregion)
        : filterAlertsForComuna(liveAlerts, codregion, codComuna)
    const bySource = filterActiveAlertsBySource(byTerritory, alertsFilter)
    return sortActiveAlertsBySeverity(bySource)
  }, [liveAlerts, kind, codregion, codComuna, alertsFilter])

  const airZones = useMemo(() => {
    if (alertsFilter !== "all" && alertsFilter !== "airechile") return []
    const zones = air?.items ?? []
    const forTerritory =
      kind === "region"
        ? filterZonesForRegion(zones, codregion)
        : filterZonesForComuna(zones, codComuna)
    return sortZonesBySeverity(forTerritory)
  }, [air?.items, kind, codregion, codComuna, alertsFilter])

  const capped = useMemo(() => {
    const alertSlots = Math.min(alerts.length, POPUP_MAX_ALERTS)
    const airSlots = Math.min(
      airZones.length,
      Math.max(0, POPUP_MAX_ALERTS - alertSlots),
    )
    return {
      alerts: alerts.slice(0, alertSlots),
      airZones: airZones.slice(0, airSlots),
    }
  }, [alerts, airZones])

  const alertsLoading = livePending

  const base = {
    title,
    parent,
    alerts: capped.alerts,
    airZones: capped.airZones,
    alertsLoading,
  }

  if (kind === "region") {
    if (regionQuery.isLoading) {
      return { ...base, status: "loading", risk: null }
    }
    if (regionQuery.data) {
      const r = regionQuery.data
      return {
        ...base,
        status: "ready",
        risk: {
          composite_score: r.composite_score,
          severity: r.severity,
          dominant_hazard: r.dominant_hazard,
          sismo_score: r.sismo_score,
          ola_calor_score: r.ola_calor_score,
          ola_frio_score: r.ola_frio_score,
          viento_score: r.viento_score,
          inundacion_score: r.inundacion_score,
          temperature_c: r.avg_temperature_c ?? null,
          wind_speed_kmh: r.avg_wind_speed_kmh ?? null,
        },
      }
    }
    const fromProps = riskFromProperties(kind, properties)
    if (fromProps.composite_score == null) {
      return { ...base, status: "empty", risk: null }
    }
    return { ...base, status: "ready", risk: fromProps }
  }

  if (comunaQuery.isLoading) {
    return { ...base, status: "loading", risk: null }
  }
  if (comunaQuery.data) {
    const r = comunaQuery.data
    return {
      ...base,
      status: "ready",
      risk: {
        composite_score: r.composite_score,
        severity: r.severity,
        dominant_hazard: r.dominant_hazard,
        sismo_score: r.sismo_score,
        ola_calor_score: r.ola_calor_score,
        ola_frio_score: r.ola_frio_score,
        viento_score: r.viento_score,
        inundacion_score: r.inundacion_score,
        temperature_c: r.temperature_c ?? null,
        wind_speed_kmh: r.wind_speed_kmh ?? null,
      },
    }
  }
  const fromProps = riskFromProperties(kind, properties)
  if (fromProps.composite_score == null) {
    return { ...base, status: "empty", risk: null }
  }
  return { ...base, status: "ready", risk: fromProps }
}

export function TerritoryDetailShell({
  selection,
  popupKey,
  onClose,
}: {
  selection: TerritorySelection
  /** Remount MapPopup on each open (close/click race). */
  popupKey: number
  onClose: () => void
}) {
  const isDesktop = useIsDesktopMd()
  const detail = useTerritoryDetail(selection)

  if (isDesktop === null) return null

  const content = (
    <TerritoryDetailContent
      title={detail.title}
      parent={detail.parent}
      kind={selection.kind}
      codregion={selection.properties.codregion}
      status={detail.status}
      risk={detail.risk}
      alerts={detail.alerts}
      airZones={detail.airZones}
      alertsLoading={detail.alertsLoading}
      onClose={onClose}
      className="max-w-none min-w-0 w-full"
    />
  )

  if (isDesktop) {
    return (
      <MapPopup
        key={popupKey}
        longitude={selection.lng}
        latitude={selection.lat}
        onClose={onClose}
        className="max-w-[310px] overflow-hidden !p-0"
      >
        {content}
      </MapPopup>
    )
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          SURFACE_PANEL_SHELL_CLASS,
          "max-h-[min(55dvh,420px)] gap-0 overflow-hidden rounded-none p-0 sm:max-w-none",
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{detail.title}</SheetTitle>
          <SheetDescription>
            Detalle de riesgo del territorio seleccionado
          </SheetDescription>
        </SheetHeader>
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  )
}
