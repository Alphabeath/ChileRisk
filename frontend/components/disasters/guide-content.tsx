import { ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Reveal } from "@/components/disasters/scroll-reveal"
import { Button } from "@/components/ui/button"
import { GUIDE_GROUPS, type GuideBlock, type SenapredGuide } from "@/lib/senapred-guides"

function renderBlocks(blocks: GuideBlock[], keyPrefix: string) {
  return blocks.map((block, i) => {
    const key = `${keyPrefix}-${i}`
    switch (block.kind) {
      case "text":
        return (
          <div key={key} className="flex flex-col gap-2.5">
            {block.paragraphs.map((p, j) =>
              p.bullets ? (
                <ul
                  key={`${key}-${j}`}
                  className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-foreground"
                >
                  {p.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p
                  key={`${key}-${j}`}
                  className="text-sm leading-relaxed text-foreground"
                >
                  {p.text}
                </p>
              ),
            )}
          </div>
        )
      case "step":
        return (
          <div
            key={key}
            className="flex gap-4 rounded-none border border-border bg-card p-4 transition-colors hover:border-primary/60 sm:p-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.icon} alt="" className="size-14 shrink-0 object-contain" />
            <p className="text-sm leading-relaxed text-foreground sm:text-[15px]">
              {block.text}
            </p>
          </div>
        )
      case "figure":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={block.src}
            alt={block.alt}
            className="mx-auto max-h-72 w-auto object-contain"
          />
        )
      case "background":
        // Full-bleed contra la columna centrada `max-w-3xl`: la columna es
        // centrada, así que la imagen se desplaza 50% del ancho de su
        // contenedor y se compensa con -50vw → bordes exactos del viewport.
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={block.src}
            alt=""
            className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none object-cover"
          />
        )
      case "subheading":
        return (
          <h3 key={key} className="text-sm font-semibold text-foreground">
            {block.text}
          </h3>
        )
      case "links":
        return (
          <div key={key} className="flex flex-wrap gap-2">
            {block.items.map((item) => (
              <Button
                key={item.href}
                variant="outline"
                render={
                  <a href={item.href} target="_blank" rel="noopener noreferrer" />
                }
                nativeButton={false}
              >
                {item.label}
                <ExternalLink className="size-3.5" aria-hidden />
              </Button>
            ))}
          </div>
        )
    }
  })
}

function renderSections(guide: SenapredGuide) {
  return guide.sections.map((section, i) => (
    <Reveal key={section.heading} as="section" className="flex flex-col gap-4">
      <h2 className="flex items-start gap-3 border-b border-border pb-3">
        <span className="font-mono text-3xl font-bold tabular-nums leading-none text-muted-foreground/80">
          {String(i + 1).padStart(2, "0")}
        </span>
        <span className="pt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {section.heading}
        </span>
      </h2>
      <div className="flex flex-col gap-3">
        {renderBlocks(section.blocks, `s${i}`)}
      </div>
    </Reveal>
  ))
}

export function GuideContent({ guide }: { guide: SenapredGuide }) {
  const groupLabel =
    GUIDE_GROUPS.find((g) => g.key === guide.group)?.label ?? "Preparación"
  // The hero (first section background, when present) breaks out of the
  // content column: full page width with the title overlaid on top.
  const hero = guide.intro[0]?.kind === "background" ? guide.intro[0] : null
  const intro = hero ? guide.intro.slice(1) : guide.intro

  const backLink = hero ? (
    <Link
      href="/desastres"
      className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 border border-white/25 bg-black/50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/90 backdrop-blur-sm transition-colors hover:bg-black/65 hover:text-white"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Todas las guías
    </Link>
  ) : (
    <Link
      href="/desastres"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Todas las guías
    </Link>
  )

  return (
    <>
      {hero && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.src}
            alt=""
            className="h-72 w-full object-cover sm:h-[28rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
          {backLink}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-6 text-center sm:pb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/70">
              {groupLabel}
            </p>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {guide.title}
            </h1>
            {guide.blurb && (
              <p className="max-w-2xl text-sm text-white/85 sm:text-base">
                {guide.blurb}
              </p>
            )}
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/60">
              {guide.sections.length} secciones
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-20 pt-8">
        {!hero && (
          <>
            {backLink}
            <Reveal>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
                  {groupLabel}
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  {guide.title}
                </h1>
                {guide.blurb && (
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    {guide.blurb}
                  </p>
                )}
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {guide.sections.length} secciones
                </p>
              </div>
            </Reveal>
          </>
        )}

        {renderBlocks(intro, "intro")}
        {renderSections(guide)}

        <Reveal>
          <p className="text-xs text-muted-foreground">
            Fuente:{" "}
            <a
              href={guide.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              SENAPRED · {guide.title}
            </a>
          </p>
        </Reveal>
      </div>
    </>
  )
}
