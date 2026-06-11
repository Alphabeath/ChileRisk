"use client"

import { FamilyPlanField } from "@/components/preparation/family-plan/family-plan-field"
import { Textarea } from "@/components/ui/textarea"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { SafeZone } from "@/lib/types"

export function StepSafeZones() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  function updateZone(emergency: string, patch: Partial<SafeZone>) {
    updateData((prev) => ({
      ...prev,
      safe_zones: prev.safe_zones.map((z) =>
        z.emergency === emergency ? { ...z, ...patch } : z,
      ),
    }))
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
            <th className="px-2 py-2">Emergencia</th>
            <th className="px-2 py-2">Lugar seguro</th>
            <th className="px-2 py-2">Ruta evacuación</th>
            <th className="px-2 py-2">Zona segura</th>
            <th className="px-2 py-2">Punto encuentro</th>
          </tr>
        </thead>
        <tbody>
          {data.safe_zones.map((zone) => (
            <tr key={zone.emergency} className="border-b border-white/10 align-top">
              <td className="px-2 py-3 font-medium text-white/85">{zone.emergency}</td>
              <td className="px-2 py-3">
                <FamilyPlanField label={`Lugar seguro — ${zone.emergency}`}>
                  <Textarea
                    rows={3}
                    value={zone.safe_place}
                    onChange={(e) =>
                      updateZone(zone.emergency, { safe_place: e.target.value })
                    }
                  />
                </FamilyPlanField>
              </td>
              <td className="px-2 py-3">
                <FamilyPlanField label={`Ruta — ${zone.emergency}`}>
                  <Textarea
                    rows={3}
                    value={zone.evacuation_route}
                    onChange={(e) =>
                      updateZone(zone.emergency, { evacuation_route: e.target.value })
                    }
                  />
                </FamilyPlanField>
              </td>
              <td className="px-2 py-3">
                <FamilyPlanField label={`Zona segura — ${zone.emergency}`}>
                  <Textarea
                    rows={3}
                    value={zone.safe_zone}
                    onChange={(e) =>
                      updateZone(zone.emergency, { safe_zone: e.target.value })
                    }
                  />
                </FamilyPlanField>
              </td>
              <td className="px-2 py-3">
                <FamilyPlanField label={`Encuentro — ${zone.emergency}`}>
                  <Textarea
                    rows={3}
                    value={zone.meeting_point}
                    onChange={(e) =>
                      updateZone(zone.emergency, { meeting_point: e.target.value })
                    }
                  />
                </FamilyPlanField>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}