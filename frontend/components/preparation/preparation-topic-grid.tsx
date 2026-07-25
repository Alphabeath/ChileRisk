import Link from "next/link"
import {
  Backpack,
  Droplet,
  Flashlight,
  FileText,
  Map,
  Waves,
  Navigation,
  Signpost,
  Home,
  Wrench,
  Zap,
  Bell,
  Megaphone,
  Radio,
  ShieldCheck,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react"

import { FamilyPlanCategoryShell } from "@/components/preparation/family-plan/family-plan-layout"
import {
  PREPARATION_CTA_LIFT_CLASS,
  PREPARATION_EYEBROW_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

interface Topic {
  title: string
  summary: string
  bullets: string[]
  icons: LucideIcon[]
  icon: LucideIcon
  /** Left accent border class */
  accentBorder: string
  accent: string
  iconChip: string
  href: string
  cta: string
}

const topics: Topic[] = [
  {
    title: "Kit de emergencia",
    summary: "Recursos para 72 horas sin servicios.",
    bullets: ["Agua", "Linterna", "Documentos"],
    icons: [Droplet, Flashlight, FileText],
    icon: Backpack,
    accentBorder: "border-l-blue-400/70",
    accent: "text-blue-200",
    iconChip: "bg-blue-500/20 border-blue-400/40",
    href: "/preparation/emergency-kit",
    cta: "Leer guía",
  },
  {
    title: "Mapa de evacuación",
    summary: "Zonas de seguridad y rutas frente a tsunami.",
    bullets: ["Zonas seguras", "Rutas", "Señalética"],
    icons: [Waves, Navigation, Signpost],
    icon: Map,
    accentBorder: "border-l-cyan-400/70",
    accent: "text-cyan-200",
    iconChip: "bg-cyan-500/20 border-cyan-400/40",
    href: "/evacuation",
    cta: "Abrir mapa",
  },
  {
    title: "Hogar y entorno",
    summary: "Reducir vulnerabilidades antes del evento.",
    bullets: ["Fijaciones", "Instalación eléctrica", "Alarmas comunales"],
    icons: [Wrench, Zap, Bell],
    icon: Home,
    accentBorder: "border-l-amber-400/70",
    accent: "text-amber-200",
    iconChip: "bg-amber-500/20 border-amber-400/40",
    href: "/preparation/family-plan/step/2",
    cta: "Evaluar riesgos",
  },
  {
    title: "Comunicación y simulacros",
    summary: "Practicar para responder con calma.",
    bullets: ["Avisa sin señal", "Simulacros", "Fuentes oficiales"],
    icons: [Radio, Megaphone, ShieldCheck],
    icon: Megaphone,
    accentBorder: "border-l-rose-400/70",
    accent: "text-rose-200",
    iconChip: "bg-rose-500/20 border-rose-400/40",
    href: "/drills",
    cta: "Ver simulacros",
  },
]

export function PreparationTopicGrid() {
  return (
    <section aria-labelledby="preparation-topics-heading">
      <div className="mb-3">
        <h2
          id="preparation-topics-heading"
          className={cn(PREPARATION_EYEBROW_CLASS, "text-white/90")}
        >
          Temas clave
        </h2>
        <p className="mt-0.5 text-[12px] text-white/50">
          Recursos educativos y herramientas para complementar tu plan familiar.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topics.map((topic) => (
          <TopicCard key={topic.title} topic={topic} />
        ))}
      </ul>
    </section>
  )
}

function TopicCard({ topic }: { topic: Topic }) {
  const Icon = topic.icon

  return (
    <li>
      <Link
        href={topic.href}
        className={cn(
          "block h-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
          PREPARATION_CTA_LIFT_CLASS,
        )}
      >
        <FamilyPlanCategoryShell
          accentClassName={topic.accentBorder}
          className="h-full transition-all duration-200 hover:-translate-y-[2px] hover:border-white/25"
          header={
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center border",
                    topic.iconChip,
                  )}
                >
                  <Icon className={cn("size-4", topic.accent)} aria-hidden />
                </span>
                <h3 className="truncate text-[12px] font-semibold uppercase tracking-[1.1px] text-white">
                  {topic.title}
                </h3>
              </div>
              <ArrowUpRight
                className={cn("size-4 shrink-0 text-white/45", topic.accent)}
                aria-hidden
              />
            </div>
          }
        >
          <p className="px-1 text-[12px] leading-snug text-white/65">
            {topic.summary}
          </p>
          <ul className="mt-1 flex flex-col gap-1.5 px-1">
            {topic.bullets.map((label, i) => {
              const BulletIcon = topic.icons[i]
              return (
                <li
                  key={label}
                  className="flex items-center gap-2 text-[11.5px] text-white/75"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center border",
                      topic.iconChip,
                    )}
                  >
                    <BulletIcon
                      className={cn("size-3", topic.accent)}
                      aria-hidden
                    />
                  </span>
                  <span className="truncate">{label}</span>
                </li>
              )
            })}
          </ul>
          <p
            className={cn(
              "mt-1 px-1 font-mono text-[10px] uppercase tracking-wider text-white/50",
              topic.accent,
            )}
          >
            {topic.cta} →
          </p>
        </FamilyPlanCategoryShell>
      </Link>
    </li>
  )
}
