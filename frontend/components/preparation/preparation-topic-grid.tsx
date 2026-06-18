import Link from "next/link"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import {
  Backpack,
  Droplet,
  Flashlight,
  FileText,
  Users,
  MapPin,
  Phone,
  Route,
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
import { cn } from "@/lib/utils"

interface Topic {
  title: string
  summary: string
  /** 3 short bullet labels rendered as <span class="sr-only"> for a11y. */
  bullets: string[]
  /** 3 icons rendered as visible chips, paired 1:1 with `bullets`. */
  icons: LucideIcon[]
  icon: LucideIcon
  /** Tailwind gradient stops (e.g. "from-blue-950/70 to-cyan-900/40") */
  color: string
  /** Accent text color for icon */
  accent: string
  /** Chip background + border color (tailwind classes) for the bullet icon wrappers. */
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
    color: "from-blue-700/80 via-blue-800/60 to-cyan-900/60",
    accent: "text-blue-200",
    iconChip: "bg-blue-500/20 border-blue-400/40",
    href: "/preparation/emergency-kit",
    cta: "Leer guía",
  },
  {
    title: "Plan familiar",
    summary: "Quién hace qué y dónde reunirse.",
    bullets: ["Punto de encuentro", "Contacto externo", "Ruta alternativa"],
    icons: [MapPin, Phone, Route],
    icon: Users,
    color: "from-emerald-700/80 via-emerald-800/60 to-teal-900/60",
    accent: "text-emerald-200",
    iconChip: "bg-emerald-500/20 border-emerald-400/40",
    href: "/preparation/family-plan",
    cta: "Iniciar plan",
  },
  {
    title: "Hogar y entorno",
    summary: "Reducir vulnerabilidades antes del evento.",
    bullets: ["Fijaciones", "Instalación eléctrica", "Alarmas comunales"],
    icons: [Wrench, Zap, Bell],
    icon: Home,
    color: "from-amber-700/80 via-orange-800/60 to-yellow-900/50",
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
    color: "from-rose-700/80 via-red-800/60 to-pink-900/50",
    accent: "text-rose-200",
    iconChip: "bg-rose-500/20 border-rose-400/40",
    href: "/simulacros",
    cta: "Ver simulacros",
  },
]

export function PreparationTopicGrid() {
  return (
    <section aria-labelledby="preparation-topics-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2
            id="preparation-topics-heading"
            className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90"
          >
            Temas clave
          </h2>
          <p className="mt-0.5 text-[12px] text-white/50">
            Recursos educativos y herramientas para complementar tu plan familiar.
          </p>
        </div>
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
    <li className="group">
      <Link
        href={topic.href}
        className="block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
      >
        <article
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "flex h-full flex-col overflow-hidden transition-all duration-200 hover:bg-black/60 hover:-translate-y-[2px]",
          )}
        >
          <div
            className={cn(
              "relative flex flex-col gap-3 border-b px-4 py-4",
              GLASS_DIVIDER,
              "bg-gradient-to-br",
              topic.color,
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex size-12 items-center justify-center border bg-black/40 backdrop-blur-sm transition-all group-hover:scale-[1.05]",
                  topic.iconChip,
                )}
              >
                <Icon className={cn("size-6", topic.accent)} aria-hidden />
              </div>
              <ArrowUpRight
                className="size-4 text-white/55 transition-all duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[2px] group-hover:text-white group-hover:scale-[1.25]"
                aria-hidden
              />
            </div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[1.1px] text-white">
              {topic.title}
            </h3>
          </div>

          <div className="flex flex-1 flex-col gap-3 px-4 py-4">
            <p className="line-clamp-2 text-[12px] leading-snug text-white/65">
              {topic.summary}
            </p>

            <ul className="mt-auto flex flex-col gap-2">
              {topic.bullets.map((label, i) => {
                const BulletIcon = topic.icons[i]
                return (
                  <li
                    key={label}
                    className="flex items-center gap-2.5 text-[11.5px] text-white/75"
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center border",
                        topic.iconChip,
                      )}
                    >
                      <BulletIcon className={cn("size-3.5", topic.accent)} aria-hidden />
                    </span>
                    <span className="truncate">{label}</span>
                  </li>
                )
              })}
            </ul>

            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/55 transition-colors group-hover:text-white/80">
              {topic.cta} →
            </p>
          </div>
        </article>
      </Link>
    </li>
  )
}
