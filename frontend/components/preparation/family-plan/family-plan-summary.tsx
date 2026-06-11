"use client"

import { FloorMapPreview } from "@/components/preparation/family-plan/floor-map/floor-map-preview"
import {
  EMERGENCY_MARKER_TYPES,
  NATIONAL_EMERGENCY_NUMBERS,
  ROOM_TYPES,
  WIZARD_STEPS,
} from "@/lib/family-plan-defaults"
import { riskLevel, riskScore } from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

function SummaryBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className={cn(GLASS_PANEL_CLASS, "p-4 sm:p-5")}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/75">
        {title}
      </h2>
      <div className="mt-3 text-[12px] text-white/70">{children}</div>
    </section>
  )
}

export function FamilyPlanSummary() {
  const { data, plan } = useFamilyPlan()
  if (!data) return null

  const selectedThreats = data.threats.filter((t) => t.selected)

  return (
    <div id="family-plan-print-root" className="flex flex-col gap-4">
      <header className={cn(GLASS_PANEL_CLASS, "p-5 sm:p-6")}>
        <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-emerald-300/90">
          Resumen · Plan Familia Preparada
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          {plan?.completion_pct ?? 0}% completado
        </h1>
        <p className="mt-2 text-[12px] text-white/50">
          Metodología SENAPRED · {WIZARD_STEPS.length} pasos
        </p>
      </header>

      <SummaryBlock title="1. Grupo familiar">
        {data.members.length === 0 ? (
          <p>Sin integrantes registrados.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.members.map((m) => (
              <li key={m.id}>
                <strong className="text-white/90">
                  {m.first_name} {m.last_name}
                </strong>
                {m.phone ? ` · ${m.phone}` : ""}
                {m.flags.length ? ` · ${m.flags.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        )}
        {data.pets.length > 0 ? (
          <p className="mt-2">
            Mascotas: {data.pets.map((p) => p.name || p.species).join(", ")}
          </p>
        ) : null}
      </SummaryBlock>

      <SummaryBlock title="2. Amenazas identificadas">
        {selectedThreats.length === 0 ? (
          <p>Sin amenazas evaluadas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedThreats.map((t) => {
              const score = riskScore(t.probability, t.impact)
              return (
                <li key={t.id}>
                  {t.risk} — {riskLevel(score)} ({score})
                  {t.corrective_action ? ` · ${t.corrective_action}` : ""}
                </li>
              )
            })}
          </ul>
        )}
      </SummaryBlock>

      <SummaryBlock title="3. Protocolos de emergencia">
        <ul className="flex flex-col gap-2">
          {data.safe_zones.map((z) => (
            <li key={z.emergency}>
              <strong className="text-white/90">{z.emergency}</strong>
              {z.safe_place ? ` · Seguro: ${z.safe_place}` : ""}
              {z.meeting_point ? ` · Encuentro: ${z.meeting_point}` : ""}
            </li>
          ))}
        </ul>
      </SummaryBlock>

      <SummaryBlock title="4. Mapa de vivienda">
        <FloorMapPreview floorMap={data.floor_map} variant="document" className="mb-3" />
        <p>
          {data.floor_map.rooms.length} habitaciones, {data.floor_map.markers.length}{" "}
          puntos de emergencia, {data.floor_map.routes.length} rutas,{" "}
          {data.floor_map.zones.length} zonas.
        </p>
        {data.floor_map.rooms.length > 0 ? (
          <p className="mt-2">
            Habitaciones:{" "}
            {data.floor_map.rooms
              .map((r) => ROOM_TYPES.find((t) => t.id === r.type)?.label ?? r.type)
              .join(", ")}
          </p>
        ) : null}
        {data.floor_map.markers.length > 0 ? (
          <p className="mt-1">
            Emergencia:{" "}
            {data.floor_map.markers
              .map(
                (m) =>
                  EMERGENCY_MARKER_TYPES.find((t) => t.id === m.type)?.label ?? m.type,
              )
              .join(", ")}
          </p>
        ) : null}
      </SummaryBlock>

      <SummaryBlock title="5. Roles">
        <ul className="flex flex-col gap-1">
          {data.roles
            .filter((r) => r.member_id)
            .map((r) => {
              const member = data.members.find((m) => m.id === r.member_id)
              return (
                <li key={r.task}>
                  {r.task}: {member ? `${member.first_name} ${member.last_name}` : "—"}
                </li>
              )
            })}
        </ul>
      </SummaryBlock>

      <SummaryBlock title="6. Directorio">
        <p className="mb-2 font-medium text-white/85">Emergencias nacionales</p>
        <ul className="mb-3 grid gap-1 sm:grid-cols-2">
          {NATIONAL_EMERGENCY_NUMBERS.map((n) => (
            <li key={n.service}>
              {n.service}: {n.phone}
            </li>
          ))}
        </ul>
        {data.contacts.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {data.contacts.map((c) => (
              <li key={c.id}>
                {c.name} ({c.type}) — {c.phone}
              </li>
            ))}
          </ul>
        ) : (
          <p>Sin contactos adicionales.</p>
        )}
      </SummaryBlock>

      <SummaryBlock title="7. Kit de emergencia">
        {(["base", "infant", "pregnant", "tea", "pets"] as const).map((section) => {
          const items = Object.entries(data.emergency_kit[section]).filter(([, v]) => v)
          if (items.length === 0) return null
          return (
            <div key={section} className="mb-2">
              <p className="font-medium capitalize text-white/85">{section}</p>
              <p>{items.map(([k]) => k).join(" · ")}</p>
            </div>
          )
        })}
      </SummaryBlock>

      <SummaryBlock title="8. Historial de simulacros">
        {data.drills.length === 0 ? (
          <p>Sin simulacros registrados.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.drills.map((d) => (
              <li key={d.id}>
                {d.date || "Sin fecha"} — {d.emergency_type || "Sin tipo"}
                {d.outcome ? ` · ${d.outcome}` : ""}
              </li>
            ))}
          </ul>
        )}
      </SummaryBlock>
    </div>
  )
}