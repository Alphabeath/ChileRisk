import { GLASS_DIVIDER, GLASS_MICA_INTERACTIVE_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import {
  Backpack,
  Home,
  Megaphone,
  Users,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Topic {
  title: string
  summary: string
  bullets: string[]
  icon: LucideIcon
  accent: string
}

const topics: Topic[] = [
  {
    title: "Kit de emergencia",
    summary: "Recursos básicos para 72 horas sin servicios.",
    bullets: [
      "Agua, alimentos no perecederos y botiquín.",
      "Linterna, pilas y radio a pilas o manual.",
      "Documentos copiados y efectivo en moneda pequeña.",
    ],
    icon: Backpack,
    accent: "text-blue-400",
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
    accent: "text-emerald-400",
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
    accent: "text-amber-400",
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
    accent: "text-rose-400",
  },
]

export function PreparacionTopicGrid() {
  return (
    <section aria-labelledby="preparacion-topics-heading">
      <div className="mb-3">
        <h2
          id="preparacion-topics-heading"
          className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90"
        >
          Temas clave
        </h2>
        <p className="mt-0.5 text-[12px] text-white/50">
          Estructura provisional para el contenido educativo.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
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
    <li
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col overflow-hidden",
      )}
    >
      <div className={cn("flex items-center gap-3 border-b px-4 py-3.5", GLASS_DIVIDER)}>
        <div className="flex size-9 shrink-0 items-center justify-center border border-white/15 bg-black/35">
          <Icon className={cn("size-4", topic.accent)} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-[13px] font-medium text-white/90">{topic.title}</h3>
          <p className="text-[11px] text-white/50">{topic.summary}</p>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2 p-4">
        {topic.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-[12px] leading-snug text-white/70">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/35" aria-hidden />
            {bullet}
          </li>
        ))}
      </ul>
    </li>
  )
}