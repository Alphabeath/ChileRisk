import { DisastersCatalogHero } from "@/components/disasters/disasters-catalog-hero"
import { DisastersFeatured } from "@/components/disasters/disasters-featured"
import {
  DisastersBandHeader,
  DisastersClosing,
  DisastersIntroduction,
} from "@/components/disasters/disasters-overview"
import { DisastersSectionNav } from "@/components/disasters/disasters-section-nav"
import { GuideCard } from "@/components/disasters/guide-card"
import { Reveal, ScrollRoot } from "@/components/disasters/scroll-reveal"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import {
  FEATURED_GUIDE_SLUGS,
  GUIDE_GROUPS,
  isFeaturedGuideSlug,
  listGuideSummaries,
} from "@/lib/senapred-guides"
import { cn } from "@/lib/utils"

export function DisastersPage() {
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
      <DisastersCatalogHero guideCount={summaries.length} />
      <DisastersIntroduction />
      <DisastersFeatured guides={featured} />

      <section
        id="desastres-preparacion"
        className="scroll-mt-12 border-b border-border bg-background py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <DisastersBandHeader
            eyebrow={GUIDE_GROUPS[0].label}
            title="Todas las guías de preparación"
            count={preparateRest.length}
          />
          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {preparateRest.map((g, i) => (
              <Reveal key={g.slug} delay={Math.min(i * 0.04, 0.24)}>
                <GuideCard guide={g} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="desastres-inclusivo"
        className="scroll-mt-12 border-b border-border bg-muted/40 py-14 sm:py-16 lg:py-20 dark:bg-muted/20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <DisastersBandHeader
            eyebrow={GUIDE_GROUPS[1].label}
            title="Enfoque inclusivo"
            count={inclusiva.length}
          />
          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {inclusiva.map((g, i) => (
              <Reveal key={g.slug} delay={Math.min(i * 0.06, 0.18)}>
                <GuideCard guide={g} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <DisastersClosing />
      <DisastersSectionNav />
    </ScrollRoot>
  )
}
