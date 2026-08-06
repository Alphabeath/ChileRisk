import type { Metadata } from "next"

import { DisastersCatalogHero } from "@/components/disasters/disasters-catalog-hero"
import { GuideCard } from "@/components/disasters/guide-card"
import { Reveal, ScrollRoot } from "@/components/disasters/scroll-reveal"
import { Button } from "@/components/ui/button"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS, MAP_PANEL_TITLE_CLASS } from "@/lib/citizen-layout"
import {
  FEATURED_GUIDE_SLUGS,
  GUIDE_GROUPS,
  SENAPRED_RECOMENDACIONES_URL,
  isFeaturedGuideSlug,
  listGuideSummaries,
} from "@/lib/senapred-guides"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Desastres" }

export default function DesastresPage() {
  const summaries = listGuideSummaries()

  const featured = FEATURED_GUIDE_SLUGS.map((slug) =>
    summaries.find((s) => s.slug === slug),
  ).filter((s): s is NonNullable<typeof s> => s !== undefined)

  const preparateRest = summaries.filter(
    (s) => s.group === "preparate" && !isFeaturedGuideSlug(s.slug),
  )
  const inclusiva = summaries.filter((s) => s.group === "inclusiva")

  return (
    <ScrollRoot
      className={cn("h-full overflow-y-auto", CITIZEN_NAVBAR_PAD_TOP_CLASS)}
    >
      <DisastersCatalogHero
        guideCount={summaries.length}
        preparateCount={summaries.filter((s) => s.group === "preparate").length}
        inclusivaCount={inclusiva.length}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-24 pt-8 sm:gap-14 sm:pt-10">
        <section className="flex flex-col gap-4">
          <Reveal>
            <header className="flex flex-col gap-1 border-b border-border pb-3">
              <p className={MAP_PANEL_TITLE_CLASS}>Amenazas prioritarias</p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Lo que más importa conocer
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {featured.length} guías
              </p>
            </header>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((g, i) => (
              <Reveal
                key={g.slug}
                delay={Math.min(i * 0.06, 0.3)}
                className={i === 0 ? "md:col-span-2" : undefined}
              >
                <GuideCard guide={g} variant="featured" priority={i === 0} />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Reveal>
            <header className="flex flex-col gap-1 border-b border-border pb-3">
              <p className={MAP_PANEL_TITLE_CLASS}>{GUIDE_GROUPS[0].label}</p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Todas las guías de preparación
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {preparateRest.length} guías
              </p>
            </header>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {preparateRest.map((g, i) => (
              <Reveal key={g.slug} delay={Math.min(i * 0.04, 0.24)}>
                <GuideCard guide={g} variant="standard" />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Reveal>
            <header className="flex flex-col gap-1 border-b border-border pb-3">
              <p className={MAP_PANEL_TITLE_CLASS}>{GUIDE_GROUPS[1].label}</p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Enfoque inclusivo
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {inclusiva.length} guías
              </p>
            </header>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inclusiva.map((g, i) => (
              <Reveal key={g.slug} delay={Math.min(i * 0.06, 0.18)}>
                <GuideCard guide={g} variant="inclusive" />
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal>
          <aside className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">
                Referencia oficial
              </p>
              <p className="text-xs text-muted-foreground">
                Contenido e ilustraciones oficiales de SENAPRED. ChileRisk los
                presenta sin modificar.
              </p>
            </div>
            <Button
              variant="outline"
              render={
                <a
                  href={SENAPRED_RECOMENDACIONES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
            >
              Ver en SENAPRED
            </Button>
          </aside>
        </Reveal>
      </div>
    </ScrollRoot>
  )
}
