import Link from "next/link"
import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import {
  Backpack,
  Home,
  Megaphone,
  Users,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Topic {
  title: string
  summary: string
  bullets: string[]
  icon: LucideIcon
  /** Tailwind gradient stops (e.g. "from-blue-950/60 to-cyan-900/40") */
  color: string
  /** Accent text color for icon */
  accent: string
  href: string
  cta: string
}

const topics: Topic[] = [
  {
    title: "Kit de emergencia",
    summary: "Recursos para 72 horas sin servicios.",
    bullets: [
      "Agua, alimentos no perecederos y botiquín.",
      "Linterna, pilas y radio a pilas o manual.",
      "Documentos copiados y efectivo en moneda pequeña.",
    ],
    icon: Backpack,
    color: "from-blue-950/70 via-blue-900/40 to-cyan-900/40",
    accent: "text-blue-300",
    href: "/preparation/emergency-kit",
    cta: "Leer guía",
  },
  {
    title: "Plan familiar",
    summary: "Quién hace qué y dónde reunirse.",
    bullets: [
      "Puntos de encuentro dentro y fuera del barrio.",
      "Contacto de referencia fuera de la zona afectada.",
      "Rutas alternativas desde casa, trabajo y colegio.",
    ],
    icon: Users,
    color: "from-emerald-950/70 via-emerald-900/40 to-teal-900/40",
    accent: "text-emerald-300",
    href: "/preparation/family-plan",
    cta: "Iniciar plan",
  },
  {
    title: "Hogar y entorno",
    summary: "Reducir vulnerabilidades antes del evento.",
    bullets: [
      "Fijar muebles pesados y revisar instalaciones eléctricas.",
      "Identificar zonas seguras según el tipo de amenaza.",
      "Conocer alarmas y señales oficiales de tu comuna.",
    ],
    icon: Home,
    color: "from-amber-950/70 via-orange-900/40 to-yellow-900/30",
    accent: "text-amber-300",
    href: "/preparation/family-plan/step/2",
    cta: "Evaluar riesgos",
  },
  {
    title: "Comunicación y simulacros",
    summary: "Practicar para responder con calma.",
    bullets: [
      "Definir cómo avisar a la familia si no hay señal.",
      "Participar en simulacros escolares y comunitarios.",
      "Seguir solo fuentes oficiales durante la emergencia.",
    ],
    icon: Megaphone,
    color: "from-rose-950/70 via-red-900/40 to-pink-900/30",
    accent: "text-rose-300",
    href: "/preparation/family-plan/step/8",
    cta: "Ver simulacros",
  },
]

export function PreparationTopicGrid() {
  return (
    <section aria-labelledby="preparation-topics-heading">
      <div className="mb-3">
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

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              "flex items-center justify-between border-b px-4 py-3",
              GLASS_DIVIDER,
              "bg-gradient-to-br",
              topic.color,
            )}
          >
            <div className="flex size-10 items-center justify-center border border-white/15 bg-black/40 backdrop-blur-sm transition-colors group-hover:border-white/25 group-hover:bg-black/50">
              <Icon
                className={cn("size-5 transition-transform group-hover:scale-[1.2]", topic.accent)}
                aria-hidden
              />
            </div>
            <ArrowUpRight
              className="size-4 text-white/45 transition-all duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[2px] group-hover:text-white group-hover:scale-[1.25]"
              aria-hidden
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 px-4 py-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90 transition-colors duration-200 group-hover:text-white">
              {topic.title}
            </h3>
            <p className="line-clamp-2 text-[12px] leading-snug text-white/55">
              {topic.summary}
            </p>
            <ul className="mt-2 flex flex-1 flex-col gap-1.5">
              {topic.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-2 text-[12px] leading-snug text-white/70"
                >
                  <span
                    className="mt-1.5 size-1 shrink-0 rounded-full bg-white/35"
                    aria-hidden
                  />
                  {bullet}
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-2 font-mono text-[10px] uppercase tracking-wider text-white/55 transition-colors group-hover:text-white/80">
              {topic.cta} →
            </p>
          </div>
        </article>
      </Link>
    </li>
  )
}
