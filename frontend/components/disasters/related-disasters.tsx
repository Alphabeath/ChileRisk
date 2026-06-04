import Link from "next/link"
import { desastres, type Desastre } from "@/data/disasters"
import { DISASTERS_NAV_LINK_CLASS, GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface RelatedDisastersProps {
  currentSlug: string
}

export function RelatedDisasters({ currentSlug }: RelatedDisastersProps) {
  const others = desastres.filter((d) => d.slug !== currentSlug).slice(0, 4)

  return (
    <section className="mt-10">
      <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-foreground">
        Otras emergencias
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Continúa informándote sobre otros riesgos.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {others.map((d) => (
          <RelatedDisasterLink key={d.slug} desastre={d} />
        ))}
      </ul>
      <Link href="/disasters" className={cn(DISASTERS_NAV_LINK_CLASS, "mt-5")}>
        <LayoutGrid className="size-4 shrink-0" aria-hidden />
        Ver catálogo completo
      </Link>
    </section>
  )
}

function RelatedDisasterLink({ desastre }: { desastre: Desastre }) {
  const Icon = desastre.icon

  return (
    <li>
      <Link
        href={`/disasters/${desastre.slug}`}
        className={cn(
          GLASS_PANEL_CLASS,
          "group flex flex-col overflow-hidden transition-colors hover:bg-black/50",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 border-b border-white/10 bg-gradient-to-br px-3 py-2.5",
            desastre.color,
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center border border-white/15 bg-black/40 backdrop-blur-sm">
            <Icon className="size-4 text-white/90" aria-hidden />
          </div>
          <p className="min-w-0 flex-1 text-[12px] font-medium text-white/90 transition-colors group-hover:text-white">
            {desastre.title}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Antes · Durante · Después
          </p>
        </div>
      </Link>
    </li>
  )
}