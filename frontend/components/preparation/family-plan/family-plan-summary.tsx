"use client"

import {
  AlertTriangle,
  ArrowRight,
  Backpack,
  Building2,
  Check,
  CircleAlert,
  Flame,
  Home,
  Map,
  MapPin,
  Megaphone,
  type LucideIcon,
  PawPrint,
  Phone,
  Route,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Waves,
} from "lucide-react"

import { FloorMapPreview } from "@/components/preparation/family-plan/floor-map/floor-map-preview"
import {
  EMERGENCY_MARKER_TYPES,
  FAMILY_MEMBER_FLAGS,
  NATIONAL_EMERGENCY_NUMBERS,
  ROOM_TYPES,
  WIZARD_STEPS,
  riskLevel,
  riskScore,
} from "@/lib/family-plan-defaults"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import { GLASS_DIVIDER, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"
import type { DrillEvaluation, FamilyContact, FamilyMember, Pet, SafeZone, Threat } from "@/lib/types"

type Level = "bajo" | "medio" | "alto"

const LEVEL_VISUAL: Record<Level, { border: string; text: string; fill: string; chip: string }> = {
  bajo: {
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    fill: "bg-emerald-400/80",
    chip: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30 print:bg-emerald-100 print:text-emerald-900 print:border-emerald-500/40",
  },
  medio: {
    border: "border-amber-500/40",
    text: "text-amber-300",
    fill: "bg-amber-400/80",
    chip: "bg-amber-500/15 text-amber-200 border-amber-500/30 print:bg-amber-100 print:text-amber-900 print:border-amber-500/40",
  },
  alto: {
    border: "border-rose-500/40",
    text: "text-rose-300",
    fill: "bg-rose-400/80",
    chip: "bg-rose-500/15 text-rose-200 border-rose-500/30 print:bg-rose-100 print:text-rose-900 print:border-rose-500/40",
  },
}

const STEP_ACCENT: Record<number, { ink: string; tint: string; band: string }> = {
  1: {
    ink: "text-blue-300",
    tint: "border-blue-500/30 bg-blue-500/10",
    band: "from-blue-500/40 via-blue-500/20 to-transparent",
  },
  2: {
    ink: "text-amber-300",
    tint: "border-amber-500/30 bg-amber-500/10",
    band: "from-amber-500/40 via-amber-500/20 to-transparent",
  },
  3: {
    ink: "text-emerald-300",
    tint: "border-emerald-500/30 bg-emerald-500/10",
    band: "from-emerald-500/40 via-emerald-500/20 to-transparent",
  },
  4: {
    ink: "text-orange-300",
    tint: "border-orange-500/30 bg-orange-500/10",
    band: "from-orange-500/40 via-orange-500/20 to-transparent",
  },
  5: {
    ink: "text-cyan-300",
    tint: "border-cyan-500/30 bg-cyan-500/10",
    band: "from-cyan-500/40 via-cyan-500/20 to-transparent",
  },
  6: {
    ink: "text-violet-300",
    tint: "border-violet-500/30 bg-violet-500/10",
    band: "from-violet-500/40 via-violet-500/20 to-transparent",
  },
  7: {
    ink: "text-rose-300",
    tint: "border-rose-500/30 bg-rose-500/10",
    band: "from-rose-500/40 via-rose-500/20 to-transparent",
  },
  8: {
    ink: "text-pink-300",
    tint: "border-pink-500/30 bg-pink-500/10",
    band: "from-pink-500/40 via-pink-500/20 to-transparent",
  },
}

const STEP_ICONS: Record<number, LucideIcon> = {
  1: Users,
  2: AlertTriangle,
  3: Home,
  4: Map,
  5: ShieldCheck,
  6: Phone,
  7: Backpack,
  8: Megaphone,
}

const RISK_MAX = 25

const EMERGENCY_ICON: Record<string, LucideIcon> = {
  Sismo: AlertTriangle,
  Incendio: Flame,
  Tsunami: Waves,
  Inundación: Waves,
  "Fuga de gas": CircleAlert,
}

const KIT_SECTION_META: Record<
  "base" | "infant" | "pregnant" | "tea" | "pets",
  { label: string; accent: string; icon: LucideIcon }
> = {
  base: { label: "Kit base", accent: "border-rose-500/30 bg-rose-500/10", icon: Backpack },
  infant: { label: "Lactantes", accent: "border-pink-500/30 bg-pink-500/10", icon: Users },
  pregnant: { label: "Embarazadas", accent: "border-fuchsia-500/30 bg-fuchsia-500/10", icon: User },
  tea: { label: "TEA", accent: "border-amber-500/30 bg-amber-500/10", icon: ShieldAlert },
  pets: { label: "Mascotas", accent: "border-emerald-500/30 bg-emerald-500/10", icon: PawPrint },
}

export function FamilyPlanSummary() {
  const { data, plan } = useFamilyPlan()
  if (!data) return null

  const selectedThreats = data.threats.filter((t) => t.selected)
  const highThreatCount = selectedThreats.filter(
    (t) => riskLevel(riskScore(t.probability, t.impact)) === "alto",
  ).length
  const memberCount = data.members.length
  const petCount = data.pets.length
  const drillCount = data.drills.length
  const contactCount = data.contacts.length
  const completed = plan?.completion_pct ?? 0

  return (
    <div id="family-plan-print-root" className="flex flex-col gap-4">
      <SummaryHero
        completed={completed}
        memberCount={memberCount}
        petCount={petCount}
        threatCount={selectedThreats.length}
        highThreatCount={highThreatCount}
        drillCount={drillCount}
        contactCount={contactCount}
      />

      <StepCard step={1}>
        <FamilyGroupContent
          members={data.members}
          pets={data.pets}
        />
      </StepCard>

      <StepCard step={2}>
        <ThreatsContent threats={selectedThreats} />
      </StepCard>

      <StepCard step={3}>
        <ProtocolsContent zones={data.safe_zones} />
      </StepCard>

      <StepCard step={4}>
        <FloorMapContent
          floorMap={data.floor_map}
          roomsCount={data.floor_map.rooms.length}
          markersCount={data.floor_map.markers.length}
          routesCount={data.floor_map.routes.length}
          zonesCount={data.floor_map.zones.length}
        />
      </StepCard>

      <StepCard step={5}>
        <RolesContent members={data.members} roles={data.roles} />
      </StepCard>

      <StepCard step={6}>
        <ContactsContent contacts={data.contacts} />
      </StepCard>

      <StepCard step={7}>
        <KitContent kit={data.emergency_kit} />
      </StepCard>

      <StepCard step={8}>
        <DrillsContent drills={data.drills} />
      </StepCard>
    </div>
  )
}

function SummaryHero({
  completed,
  memberCount,
  petCount,
  threatCount,
  highThreatCount,
  drillCount,
  contactCount,
}: {
  completed: number
  memberCount: number
  petCount: number
  threatCount: number
  highThreatCount: number
  drillCount: number
  contactCount: number
}) {
  const isComplete = completed === 100
  return (
    <header
      className={cn(
        "summary-hero relative overflow-hidden border border-white/10 print:bg-white",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/55 via-red-950/70 to-[var(--secondary-chile)]/45 print:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)] print:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,50,160,0.25),transparent_45%)] print:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent print:hidden"
        aria-hidden
      />
      <ChileWatermark />

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <span className="inline-flex w-fit items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-emerald-200/90 print:border-emerald-700 print:bg-emerald-100 print:text-emerald-900">
            <ShieldAlert className="size-3" aria-hidden />
            Resumen · Plan Familia Preparada
          </span>
          <h1 className="mt-3 text-4xl font-extrabold leading-none tracking-tighter sm:text-5xl lg:text-6xl">
            <span className="text-white print:text-black">Chile</span>
            <span className="text-[var(--secondary-chile)] print:text-black">Risk</span>
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[1.4px] text-white/85 sm:text-base print:text-black">
            Plan Familia
          </p>
          <p className="mt-3 max-w-2xl text-[12.5px] leading-relaxed text-white/80 sm:text-sm print:text-neutral-700">
            Documento operativo con los datos críticos de tu hogar ante emergencias: integrantes, riesgos, rutas, contactos, kit y simulacros.
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 lg:min-w-[24rem] lg:grid-cols-4">
          <HeroStatBox
            label="% completado"
            value={completed}
            accent={
              isComplete
                ? "border-emerald-500/30 bg-emerald-950/30"
                : "border-white/20 bg-black/35"
            }
            valueClass={isComplete ? "text-emerald-200" : "text-white"}
          />
          <HeroStatBox
            label="Integrantes"
            value={memberCount}
            sub={petCount > 0 ? `+${petCount} mascotas` : undefined}
          />
          <HeroStatBox
            label="Amenazas"
            value={threatCount}
            sub={highThreatCount > 0 ? `${highThreatCount} altas` : "evaluadas"}
            accent={
              highThreatCount > 0
                ? "border-rose-500/30 bg-rose-950/30"
                : "border-white/20 bg-black/35"
            }
            valueClass={highThreatCount > 0 ? "text-rose-200" : "text-white"}
          />
          <HeroStatBox
            label="Simulacros"
            value={drillCount}
            sub={contactCount > 0 ? `${contactCount} contactos` : "sin contactos"}
          />
        </dl>
      </div>
    </header>
  )
}

function HeroStatBox({
  label,
  value,
  sub,
  accent,
  valueClass,
}: {
  label: string
  value: number
  sub?: string
  accent?: string
  valueClass?: string
}) {
  return (
    <div
      className={cn(
        "border border-white/20 bg-black/35 px-3 py-3 text-center backdrop-blur-sm sm:px-4 sm:py-4 print:border-neutral-300 print:bg-white",
        accent,
      )}
    >
      <dt className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 sm:text-[10px] print:text-neutral-600">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl print:text-black",
          valueClass ?? "text-white",
        )}
      >
        {value}
      </dd>
      {sub ? (
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 print:text-neutral-600">
          {sub}
        </p>
      ) : null}
    </div>
  )
}

function ChileWatermark() {
  return (
    <svg
      className="pointer-events-none absolute -right-8 top-1/2 hidden size-64 -translate-y-1/2 text-white/[0.06] sm:block lg:size-80 print:hidden"
      viewBox="0 0 200 480"
      fill="currentColor"
      aria-hidden
    >
      <path d="M70 8 L88 14 L100 22 L108 36 L112 52 L108 64 L96 72 L92 84 L98 96 L106 108 L110 124 L108 140 L100 154 L92 168 L96 184 L106 196 L116 210 L122 228 L120 246 L114 262 L120 278 L132 290 L142 304 L146 320 L142 336 L132 348 L120 356 L112 368 L108 384 L100 400 L86 412 L72 420 L58 424 L46 418 L40 404 L42 388 L48 372 L42 358 L30 348 L20 334 L14 318 L12 300 L18 282 L28 268 L32 252 L26 236 L18 220 L14 202 L18 184 L28 170 L34 154 L30 138 L24 122 L26 104 L34 88 L46 76 L56 64 L62 48 L62 32 L66 18 Z" />
    </svg>
  )
}

function StepCard({
  step,
  children,
}: {
  step: number
  children: React.ReactNode
}) {
  const meta = WIZARD_STEPS.find((s) => s.step === step)
  const accent = STEP_ACCENT[step]
  const Icon = STEP_ICONS[step]
  if (!meta) return null

  return (
    <section
      className={cn(
        GLASS_PANEL_CLASS,
        "summary-step relative overflow-hidden p-0 print:border-neutral-300 print:bg-white",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r print:hidden",
          accent.band,
        )}
        aria-hidden
      />
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border font-mono text-[13px] font-semibold tabular-nums print:border-neutral-400 print:bg-neutral-100 print:text-black",
            accent.tint,
          )}
        >
          {step}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon
            className={cn("size-4 shrink-0 print:text-black", accent.ink)}
            aria-hidden
          />
          <h2 className="truncate text-[12px] font-semibold uppercase tracking-[1.2px] text-white/90 print:text-black">
            {meta.title}
          </h2>
        </div>
      </div>
      <div className={cn("border-t", GLASS_DIVIDER, "print:border-neutral-200")} />
      <div className="p-4 text-[12px] text-white/75 sm:p-5 sm:text-[12.5px] print:text-black">
        {children}
      </div>
    </section>
  )
}

function FamilyGroupContent({
  members,
  pets,
}: {
  members: FamilyMember[]
  pets: Pet[]
}) {
  if (members.length === 0) {
    return <EmptyState icon={Users} label="Sin integrantes registrados." />
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {members.map((m) => {
          const initials = `${m.first_name.charAt(0)}${m.last_name.charAt(0)}`.toUpperCase()
          return (
            <li
              key={m.id}
              className="flex items-start gap-3 border border-white/10 bg-white/[0.03] p-3 print:border-neutral-300 print:bg-white"
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center border border-blue-500/30 bg-blue-500/10 font-mono text-[12px] font-semibold tabular-nums text-blue-200 print:border-neutral-400 print:bg-neutral-100 print:text-black"
                aria-hidden
              >
                {initials || "·"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-white print:text-black">
                  {m.first_name} {m.last_name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/55 print:text-neutral-700">
                  {m.phone ? <span className="font-mono tabular-nums">{m.phone}</span> : null}
                  {m.age != null ? <span>{m.age} años</span> : null}
                </div>
                {m.flags.length > 0 ? (
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {m.flags.map((f) => {
                      const meta = FAMILY_MEMBER_FLAGS.find((x) => x.id === f)
                      return (
                        <li
                          key={f}
                          className="inline-flex items-center border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.6px] text-white/80 print:border-neutral-300 print:bg-neutral-100 print:text-black"
                        >
                          {meta?.label ?? f}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
      {pets.length > 0 ? (
        <div className="border-t border-white/10 pt-3 print:border-neutral-200">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-emerald-200/90 print:text-black">
            <PawPrint className="size-3" aria-hidden /> Mascotas
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {pets.map((p) => (
              <li
                key={p.id}
                className="inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 print:border-neutral-300 print:bg-neutral-100 print:text-black"
              >
                <PawPrint className="size-3" aria-hidden />
                <span className="font-semibold">{p.name || "Sin nombre"}</span>
                <span className="text-emerald-200/70 print:text-neutral-600">· {p.species || "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ThreatsContent({ threats }: { threats: Threat[] }) {
  const internal = threats.filter((t) => t.category === "internal")
  const external = threats.filter((t) => t.category === "external")

  if (internal.length === 0 && external.length === 0) {
    return <EmptyState icon={ShieldCheck} label="Sin amenazas evaluadas." />
  }

  return (
    <div className="flex flex-col gap-5">
      <ThreatSubsection
        title="Amenazas internas"
        description="Riesgos dentro de la vivienda (eléctricos, gas, estructural)."
        threats={internal}
        accent="amber"
      />
      <ThreatSubsection
        title="Amenazas externas"
        description="Riesgos del entorno y fenómenos naturales."
        threats={external}
        accent="orange"
      />
    </div>
  )
}

function ThreatSubsection({
  title,
  description,
  threats,
  accent,
}: {
  title: string
  description: string
  threats: Threat[]
  accent: "amber" | "orange"
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-200 print:text-amber-900"
      : "text-orange-200 print:text-orange-900"

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10.5px] font-semibold uppercase tracking-[1.2px]",
              accentClass,
            )}
          >
            {title}
          </p>
          <p className="mt-0.5 text-[10.5px] text-white/45 print:text-neutral-600">
            {description}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums",
            accent === "amber"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-200 print:border-amber-500/40 print:bg-amber-100 print:text-amber-900"
              : "border-orange-500/30 bg-orange-500/10 text-orange-200 print:border-orange-500/40 print:bg-orange-100 print:text-orange-900",
          )}
          aria-label={`${threats.length} amenazas en ${title.toLowerCase()}`}
        >
          {threats.length}
        </span>
      </div>
      {threats.length === 0 ? (
        <p className="border border-dashed border-white/10 px-3 py-2 text-[11px] text-white/45 italic print:border-neutral-300 print:text-neutral-600">
          Sin amenazas registradas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {threats.map((t) => {
            const score = riskScore(t.probability, t.impact)
            const level = riskLevel(score) as Level
            const visual = LEVEL_VISUAL[level]
            const pct = Math.max(0, Math.min(100, (score / RISK_MAX) * 100))
            return (
              <li
                key={t.id}
                className="flex flex-col gap-2 border border-white/10 bg-white/[0.03] p-3 print:border-neutral-300 print:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[12.5px] font-semibold text-white print:text-black">
                    {t.risk}
                  </p>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1px] print:border-neutral-400",
                      visual.chip,
                    )}
                  >
                    {level}
                    <span className="font-mono tabular-nums">{score}</span>
                  </span>
                </div>
                <div className="relative h-1.5 border border-white/10 bg-white/5 print:border-neutral-300 print:bg-neutral-100">
                  <span
                    className={cn("block h-full transition-all duration-300", visual.fill)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {t.corrective_action ? (
                  <p className="text-[11px] text-white/60 print:text-neutral-700">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[1.1px] text-white/45 print:text-neutral-600">
                      Acción ·{" "}
                    </span>
                    {t.corrective_action}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ProtocolsContent({ zones }: { zones: SafeZone[] }) {
  const filled = zones.filter(
    (z) =>
      z.safe_place.trim() ||
      z.evacuation_route.trim() ||
      z.safe_zone.trim() ||
      z.meeting_point.trim(),
  )

  if (filled.length === 0) {
    return <EmptyState icon={Home} label="Sin protocolos configurados." />
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {filled.map((z) => {
        const Icon = EMERGENCY_ICON[z.emergency] ?? AlertTriangle
        return (
          <li
            key={z.emergency}
            className="flex flex-col gap-2 border border-emerald-500/25 bg-emerald-500/[0.05] p-3 print:border-neutral-300 print:bg-white"
          >
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-emerald-200 print:text-black">
              <Icon className="size-3" aria-hidden /> {z.emergency}
            </p>
            <ul className="flex flex-col gap-1 text-[11px] text-white/70 print:text-black">
              <ProtocolRow icon={ShieldCheck} label="Lugar seguro" value={z.safe_place} />
              <ProtocolRow icon={Route} label="Ruta" value={z.evacuation_route} />
              <ProtocolRow icon={MapPin} label="Zona segura" value={z.safe_zone} />
              <ProtocolRow icon={Users} label="Encuentro" value={z.meeting_point} />
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

function ProtocolRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  const hasValue = value.trim().length > 0
  return (
    <li className="flex items-start gap-1.5">
      <Icon className="mt-0.5 size-3 shrink-0 text-emerald-300/80 print:text-neutral-600" aria-hidden />
      <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[1.1px] text-white/55 print:text-neutral-600">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1",
          hasValue ? "text-white/85 print:text-black" : "text-white/30 italic print:text-neutral-500",
        )}
      >
        {hasValue ? value : "—"}
      </span>
    </li>
  )
}

function FloorMapContent({
  floorMap,
  roomsCount,
  markersCount,
  routesCount,
  zonesCount,
}: {
  floorMap: ReturnType<typeof useFamilyPlan>["data"] extends infer D
    ? D extends { floor_map: infer F }
      ? F
      : never
    : never
  roomsCount: number
  markersCount: number
  routesCount: number
  zonesCount: number
}) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-4 gap-2">
        <MiniStat label="Habitaciones" value={roomsCount} accent="text-orange-300" />
        <MiniStat label="Marcadores" value={markersCount} accent="text-orange-300" />
        <MiniStat label="Rutas" value={routesCount} accent="text-orange-300" />
        <MiniStat label="Zonas" value={zonesCount} accent="text-orange-300" />
      </dl>

      <FloorMapPreview floorMap={floorMap} variant="document" />

      {roomsCount > 0 ? (
        <p className="text-[11px] text-white/70 print:text-neutral-700">
          <span className="text-[9.5px] font-semibold uppercase tracking-[1.1px] text-white/45 print:text-neutral-600">
            Habitaciones ·{" "}
          </span>
          {floorMap.rooms
            .map((r) => ROOM_TYPES.find((t) => t.id === r.type)?.label ?? r.type)
            .join(" · ")}
        </p>
      ) : null}
      {markersCount > 0 ? (
        <p className="text-[11px] text-white/70 print:text-neutral-700">
          <span className="text-[9.5px] font-semibold uppercase tracking-[1.1px] text-white/45 print:text-neutral-600">
            Emergencia ·{" "}
          </span>
          {floorMap.markers
            .map(
              (m) => EMERGENCY_MARKER_TYPES.find((t) => t.id === m.type)?.label ?? m.type,
            )
            .join(" · ")}
        </p>
      ) : null}
    </div>
  )
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="border border-white/15 bg-white/[0.04] px-2 py-2 text-center print:border-neutral-300 print:bg-white">
      <dt className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 print:text-neutral-600">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-mono text-base font-semibold tabular-nums print:text-black",
          accent,
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function RolesContent({
  members,
  roles,
}: {
  members: FamilyMember[]
  roles: ReturnType<typeof useFamilyPlan>["data"] extends infer D
    ? D extends { roles: infer R }
      ? R
      : never
    : never
}) {
  const assigned = roles.filter((r) => r.member_id)
  if (assigned.length === 0) {
    return <EmptyState icon={ShieldCheck} label="Sin roles asignados." />
  }
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {assigned.map((r, idx) => {
        const member = members.find((m) => m.id === r.member_id)
        return (
          <li
            key={r.task}
            className="flex items-center gap-3 border border-cyan-500/25 bg-cyan-500/[0.05] p-3 print:border-neutral-300 print:bg-white"
          >
            <span className="flex size-7 shrink-0 items-center justify-center border border-cyan-500/30 bg-cyan-500/10 font-mono text-[11px] font-semibold tabular-nums text-cyan-200 print:border-neutral-400 print:bg-neutral-100 print:text-black">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white print:text-black">
                {r.task}
              </p>
              <p className="truncate text-[11px] text-cyan-200/90 print:text-neutral-700">
                {member ? `${member.first_name} ${member.last_name}` : "—"}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ContactsContent({ contacts }: { contacts: FamilyContact[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75 print:text-black">
          Emergencias nacionales
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NATIONAL_EMERGENCY_NUMBERS.map((n) => (
            <li
              key={n.service}
              className="flex items-center justify-between gap-2 border border-violet-500/25 bg-violet-500/[0.05] px-3 py-2 print:border-neutral-300 print:bg-white"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[1px] text-white/80 print:text-black">
                {n.service}
              </span>
              <span className="font-mono text-base font-semibold tabular-nums text-violet-200 print:text-black">
                {n.phone}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {contacts.length > 0 ? (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75 print:text-black">
            Contactos adicionales
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contacts.map((c) => {
              const Icon = c.type === "family" ? User : Building2
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-3 print:border-neutral-300 print:bg-white"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center border border-violet-500/30 bg-violet-500/10 text-violet-200 print:border-neutral-400 print:bg-neutral-100 print:text-black">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-white print:text-black">
                      {c.name}
                    </p>
                    <p className="truncate text-[10.5px] text-white/55 print:text-neutral-700">
                      {c.type === "family" ? "Familiar" : "Institución"}
                      {c.address ? ` · ${c.address}` : ""}
                    </p>
                  </div>
                  {c.phone ? (
                    <span className="font-mono text-[11.5px] tabular-nums text-violet-200 print:text-black">
                      {c.phone}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="text-[11px] text-white/50 italic print:text-neutral-600">
          Sin contactos adicionales registrados.
        </p>
      )}
    </div>
  )
}

function KitContent({ kit }: { kit: ReturnType<typeof useFamilyPlan>["data"] extends infer D
  ? D extends { emergency_kit: infer K }
    ? K
    : never
  : never }) {
  const sections = (["base", "infant", "pregnant", "tea", "pets"] as const).filter(
    (s) => Object.values(kit[s]).some(Boolean),
  )

  if (sections.length === 0) {
    return <EmptyState icon={Backpack} label="Kit de emergencia sin ítems marcados." />
  }

  return (
    <ul className="flex flex-col gap-3">
      {sections.map((s) => {
        const items = Object.entries(kit[s]).filter(([, v]) => v)
        const meta = KIT_SECTION_META[s]
        const Icon = meta.icon
        return (
          <li
            key={s}
            className={cn(
              "flex flex-col gap-2 border p-3 print:border-neutral-300 print:bg-white",
              meta.accent,
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/90 print:text-black">
                <Icon className="size-3" aria-hidden /> {meta.label}
              </p>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-rose-200 print:text-black">
                {items.length}
              </span>
            </div>
            <ul className="flex flex-wrap gap-1">
              {items.map(([k]) => (
                <li
                  key={k}
                  className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] text-white/80 print:border-neutral-300 print:bg-white print:text-black"
                >
                  <Check className="size-2.5 text-rose-300 print:text-black" aria-hidden /> {k}
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

function DrillsContent({
  drills,
}: {
  drills: ReturnType<typeof useFamilyPlan>["data"] extends infer D
    ? D extends { drills: infer X }
      ? X
      : never
    : never
}) {
  if (drills.length === 0) {
    return <EmptyState icon={Megaphone} label="Sin simulacros registrados." />
  }
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {drills.map((d) => (
        <li
          key={d.id}
          className="flex flex-col gap-2.5 border border-pink-500/25 bg-pink-500/[0.04] p-3 print:border-neutral-300 print:bg-white"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[9.5px] font-semibold uppercase tracking-[1.1px] text-white/45 print:text-neutral-600">
                Fecha
              </span>
              <span className="font-mono text-[13px] font-semibold tabular-nums text-pink-200 print:text-black">
                {d.date || "Sin fecha"}
              </span>
            </div>
            <span className="inline-flex shrink-0 items-center border border-pink-500/30 bg-pink-500/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1px] text-pink-200 print:border-neutral-400 print:bg-neutral-100 print:text-black">
              {d.emergency_type || "Sin tipo"}
            </span>
          </div>
          {d.outcome ? (
            <p className="text-[11.5px] leading-snug text-white/85 print:text-black">
              {d.outcome}
            </p>
          ) : null}
          <DrillEvaluation evaluation={d.evaluation} />
          {d.improvements.length > 0 ? (
            <div className="border-t border-pink-500/15 pt-2 print:border-neutral-200">
              <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[1.1px] text-white/45 print:text-neutral-600">
                Mejoras
              </p>
              <ul className="flex flex-col gap-0.5 text-[10.5px] text-white/70 print:text-neutral-700">
                {d.improvements.map((impr, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <ArrowRight className="mt-0.5 size-2.5 shrink-0 text-pink-300/70 print:text-neutral-500" aria-hidden />
                    <span>{impr}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function DrillEvaluation({ evaluation }: { evaluation: DrillEvaluation }) {
  const items: { label: string; value: boolean | null }[] = [
    { label: "Conocía ruta", value: evaluation.knew_route },
    { label: "Kit ubicado", value: evaluation.found_kit },
    { label: "Evacuó", value: evaluation.evacuated },
    { label: "Mascotas a salvo", value: evaluation.protected_pets },
    { label: "Roles claros", value: evaluation.roles_worked },
  ]
  const hasAny = items.some((i) => i.value !== null)
  if (!hasAny) return null
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((it) => {
        if (it.value === null) return null
          return (
            <li
              key={it.label}
              className={cn(
                "inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.8px] print:border-neutral-400",
                it.value
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 print:bg-emerald-100 print:text-emerald-900 print:border-emerald-500/40"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200 print:bg-rose-100 print:text-rose-900 print:border-rose-500/40",
              )}
            >
              {it.value ? "✓" : "✗"} {it.label}
            </li>
          )
      })}
    </ul>
  )
}

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  return (
    <p className="flex items-center gap-2 text-[11.5px] text-white/55 italic print:text-neutral-600">
      <Icon className="size-3.5 text-white/35 print:text-neutral-500" aria-hidden />
      {label}
    </p>
  )
}
