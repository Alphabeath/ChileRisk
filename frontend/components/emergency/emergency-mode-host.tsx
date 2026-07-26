"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

import { EmergencyBanner } from "@/components/emergency/emergency-banner"
import { EmergencyGuidePanel } from "@/components/emergency/emergency-guide-panel"
import { EmergencyPageFrame } from "@/components/emergency/emergency-page-frame"
import { EmergencyShareCard } from "@/components/emergency/emergency-share-card"
import { useEmergencyMode } from "@/hooks/use-emergency-mode"

export function EmergencyModeHost() {
  const emergency = useEmergencyMode()
  const router = useRouter()
  const [guideOpen, setGuideOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

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

  if (!emergency.active || !emergency.alert || !emergency.severity) {
    return null
  }

  return (
    <>
      <EmergencyPageFrame severity={emergency.severity} />
      <EmergencyBanner
        alert={emergency.alert}
        severity={emergency.severity}
        hazardLabel={emergency.hazardLabel}
        comunaName={emergency.comunaName}
        onWhatToDo={() => setGuideOpen(true)}
        onEvacuate={goEvacuate}
        onShare={() => setShareOpen(true)}
        onDismiss={emergency.dismiss}
      />
      <EmergencyGuidePanel
        open={guideOpen}
        onOpenChange={setGuideOpen}
        severity={emergency.severity}
        hazardLabel={emergency.hazardLabel}
        comunaCode={emergency.comunaCode}
        comunaName={emergency.comunaName}
        coords={emergency.coords}
      />
      <EmergencyShareCard
        open={shareOpen}
        onOpenChange={setShareOpen}
        comunaName={emergency.comunaName}
      />
    </>
  )
}
