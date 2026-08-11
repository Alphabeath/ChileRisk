import { DisastersBandHeader } from "@/components/disasters/disasters-overview"
import { GuideCard } from "@/components/disasters/guide-card"
import { Reveal } from "@/components/disasters/scroll-reveal"
import type { GuideSummary } from "@/lib/senapred-guides"

/**
 * Amenazas prioritarias: tiles coloridas con ilustración SENAPRED, blurb y CTA
 * en el acento de cada amenaza (misma gramática que la agenda de simulacros).
 */
export function DisastersFeatured({ guides }: { guides: GuideSummary[] }) {
  return (
    <section
      id="desastres-prioritarias"
      aria-labelledby="desastres-prioritarias-title"
      className="scroll-mt-12 border-b border-border bg-muted/40 py-14 sm:py-16 lg:py-20 dark:bg-muted/20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <DisastersBandHeader
          eyebrow="Amenazas prioritarias"
          title="Lo que más importa conocer"
          count={guides.length}
          titleId="desastres-prioritarias-title"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guides.map((guide, i) => (
            <Reveal key={guide.slug} delay={Math.min(i * 0.06, 0.3)}>
              <GuideCard guide={guide} featured />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
