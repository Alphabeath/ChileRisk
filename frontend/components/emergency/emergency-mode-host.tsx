"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { EmergencyBanner } from "@/components/emergency/emergency-banner"
import { EmergencyPageFrame } from "@/components/emergency/emergency-page-frame"
import { EmergencyReopenChip } from "@/components/emergency/emergency-reopen-chip"
import { EmergencyShareCard } from "@/components/emergency/emergency-share-card"
import { EmergencyTakeover } from "@/components/emergency/emergency-takeover"
import { useEmergencyMode } from "@/hooks/use-emergency-mode"
import { emergencyAssistantPath } from "@/lib/emergency-ui"

const TAKEOVER_ACK_PREFIX = "chilerisk:emergency-ack:"

function readAck(alertId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(`${TAKEOVER_ACK_PREFIX}${alertId}`) === "1"
  } catch {
    return false
  }
}

function writeAck(alertId: string) {
  try {
    sessionStorage.setItem(`${TAKEOVER_ACK_PREFIX}${alertId}`, "1")
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Modo Emergencia — phases: SAE takeover (first activation) → banner → reopen chip.
 * Dismissing minimizes to the chip; the alert keeps rendering until it expires.
 */
export function EmergencyModeHost() {
  const emergency = useEmergencyMode()
  const { dismiss } = emergency
  const router = useRouter()
  const [shareOpen, setShareOpen] = useState(false)
  const [takeoverDismissed, setTakeoverDismissed] = useState(false)
  const lastTakeoverIdRef = useRef<string | null>(null)

  const alertId = emergency.alert?.id ?? null

  useEffect(() => {
    if (!alertId) return
    if (lastTakeoverIdRef.current === alertId) return
    lastTakeoverIdRef.current = alertId
    setTakeoverDismissed(readAck(alertId))
  }, [alertId])

  const acknowledgeTakeover = useCallback(() => {
    const id = alertId
    if (id) writeAck(id)
    setTakeoverDismissed(true)
  }, [alertId])

  const goEvacuate = useCallback(() => {
    const params = new URLSearchParams()
    if (emergency.evacuationHazard) {
      params.set("hazard", emergency.evacuationHazard)
    }
    if (emergency.coords) {
      params.set("lat", String(emergency.coords.lat))
      params.set("lon", String(emergency.coords.lon))
    }
    const qs = params.toString()
    router.push(qs ? `/evacuation?${qs}` : "/evacuation")
  }, [emergency.coords, emergency.evacuationHazard, router])

  const goAssistant = useCallback(() => {
    if (!emergency.severity) return
    // Minimize to chip so the chat is usable; the emergency stays reopenable.
    dismiss()
    router.push(
      emergencyAssistantPath({
        severity: emergency.severity,
        hazardLabel: emergency.hazardLabel,
        comunaName: emergency.comunaName,
        comunaCode: emergency.comunaCode,
      }),
    )
  }, [
    dismiss,
    emergency.comunaCode,
    emergency.comunaName,
    emergency.hazardLabel,
    emergency.severity,
    router,
  ])

  // `active` already excludes dismissed — keep rendering so the reopen chip survives.
  if (!emergency.alert || !emergency.severity || emergency.isResolving) {
    return null
  }

  const showTakeover = !takeoverDismissed && !emergency.dismissed
  const showBanner = !showTakeover && !emergency.dismissed
  const showChip = !showTakeover && emergency.dismissed

  return (
    <>
      <EmergencyPageFrame
        severity={emergency.severity}
        calm={emergency.dismissed}
      />
      {showTakeover ? (
        <EmergencyTakeover
          alert={emergency.alert}
          severity={emergency.severity}
          hazardLabel={emergency.hazardLabel}
          comunaName={emergency.comunaName}
          showEvacuate={Boolean(emergency.evacuationHazard)}
          onWhatToDo={() => {
            acknowledgeTakeover()
            goAssistant()
          }}
          onEvacuate={() => {
            acknowledgeTakeover()
            goEvacuate()
          }}
          onAcknowledge={acknowledgeTakeover}
        />
      ) : null}
      {showBanner ? (
        <EmergencyBanner
          alert={emergency.alert}
          severity={emergency.severity}
          hazardLabel={emergency.hazardLabel}
          comunaName={emergency.comunaName}
          showEvacuate={Boolean(emergency.evacuationHazard)}
          onWhatToDo={goAssistant}
          onEvacuate={goEvacuate}
          onShare={() => setShareOpen(true)}
          onDismiss={emergency.dismiss}
        />
      ) : null}
      {showChip ? (
        <EmergencyReopenChip
          severity={emergency.severity}
          comunaName={emergency.comunaName}
          onReopen={emergency.reactivate}
        />
      ) : null}
      <EmergencyShareCard
        open={shareOpen}
        onOpenChange={setShareOpen}
        alert={emergency.alert}
        severity={emergency.severity}
        hazardLabel={emergency.hazardLabel}
        comunaName={emergency.comunaName}
      />
    </>
  )
}
