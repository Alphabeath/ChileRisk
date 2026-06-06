import { DisastersCatalog } from "@/components/disasters/disasters-catalog"
import { DisastersPageHero } from "@/components/disasters/disasters-page-hero"
import { desastres } from "@/data/disasters"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DisastersPage() {
  const disasterCount = desastres.length
  const totalSteps = desastres.reduce(
    (sum, d) => sum + d.antes.length + d.durante.length + d.despues.length,
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl flex flex-col gap-4 px-4 py-16 sm:px-6 sm:gap-5 lg:px-8">
        <DisastersPageHero disasterCount={disasterCount} totalSteps={totalSteps} />

        <DisastersCatalog />

        <aside
          className={cn(
            GLASS_PANEL_CLASS,
            "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
              Referencia oficial
            </p>
            <p className="mt-1 text-[12px] text-white/45">
              Material alineado con lineamientos SENAPRED.
            </p>
          </div>
          <Link
            href="https://www.senapred.cl/recomendaciones/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/75 transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
          >
            Ver en SENAPRED
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </aside>
      </div>
    </div>
  )
}