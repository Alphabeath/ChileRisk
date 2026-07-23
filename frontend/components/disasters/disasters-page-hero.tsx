import { GLASS_DIVIDER } from "@/lib/glass-panel"
import { AlertTriangle, Clock, ShieldAlert, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisastersPageHeroProps {
  disasterCount: number
  totalSteps: number
}

const phaseHighlights = [
  { label: "Antes", subtitle: "Prevención", icon: Clock },
  { label: "Durante", subtitle: "Acción", icon: AlertTriangle },
  { label: "Después", subtitle: "Recuperación", icon: ShieldCheck },
] as const

export function DisastersPageHero({ disasterCount, totalSteps }: DisastersPageHeroProps) {
  return (
    <header className="relative w-full overflow-hidden border border-white/10">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/55 via-red-950/70 to-[var(--secondary-chile)]/45"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
        aria-hidden
      />
      <ShieldAlert
        className="pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 text-white/[0.08] sm:size-56 lg:size-64"
        strokeWidth={1}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Desastres y emergencias
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            Guías prácticas por tipo de riesgo: qué hacer en cada fase de una
            emergencia, con pasos claros para tu hogar y tu comunidad.
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3 lg:min-w-[20rem]">
          <StatBox label="Emergencias" value={disasterCount} />
          <StatBox label="Pasos totales" value={totalSteps} />
          <StatBox label="Fases" value={3} />
        </dl>
      </div>

      <div
        className={cn(
          "relative grid grid-cols-3 divide-x border-t",
          GLASS_DIVIDER,
        )}
      >
        {phaseHighlights.map(({ label, subtitle, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-2.5 px-3 py-4 sm:gap-3 sm:px-5 sm:py-5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center border border-white/20 bg-white/10 sm:size-10 transition-all hover:border-white/30 hover:bg-white/15">
              <Icon className="size-4 text-white/90 sm:size-[1.125rem] transition-transform hover:scale-105" aria-hidden />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white">
                {label}
              </p>
              <p className="text-[10px] text-white/55">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </header>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/20 bg-black/35 px-3 py-3 text-center backdrop-blur-sm sm:px-4 sm:py-4 transition-colors hover:bg-black/50 hover:border-white/25">
      <dt className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/55 sm:text-[10px]">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl transition-colors">
        {value}
      </dd>
    </div>
  )
}