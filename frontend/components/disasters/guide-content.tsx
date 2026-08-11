import { ExternalLink, type LucideIcon, ShieldAlert } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"

import { Reveal } from "@/components/disasters/scroll-reveal"
import { Button } from "@/components/ui/button"
import { getDisasterAccent } from "@/lib/disaster-visuals"
import {
  formatGuideTitle,
  GUIDE_GROUPS,
  GUIDE_ICONS,
  type GuideBlock,
  type GuideBlockBackground,
  type GuideBlockStep,
  type SenapredGuide,
} from "@/lib/senapred-guides"
import { cn } from "@/lib/utils"

/** CSS custom properties del acento visual, inyectados en el `<article>` raíz. */
type GuideStyle = CSSProperties & {
  "--guide-accent"?: string
  "--guide-accent-ink"?: string
  "--guide-tint"?: string
}

/**
 * Un fondo cuenta como "ancho" (banda full-bleed / hero) solo si su basename
 * contiene `bg` (BG/bg). Los `background` verticales mal tipados
 * (`telefono_*`, `icon_*`) se tratan como figure contenida. Si un snapshot
 * futuro introduce un fondo ancho cuyo nombre no contenga `bg`, añadir su
 * path a una allowlist aquí; no ampliar la regla a todos los `background`.
 */
function isWideBackground(block: GuideBlock | undefined): block is GuideBlockBackground {
  if (!block || block.kind !== "background") return false
  const basename = (block.src.split("/").pop() ?? "").toLowerCase()
  return basename.includes("bg")
}

/** Separa los fondos anchos (footer visual / chapter band) del contenido. */
function partitionVisualBlocks(blocks: GuideBlock[]): {
  contentBlocks: GuideBlock[]
  wideBackgrounds: GuideBlockBackground[]
} {
  const contentBlocks: GuideBlock[] = []
  const wideBackgrounds: GuideBlockBackground[] = []
  for (const block of blocks) {
    if (isWideBackground(block)) {
      wideBackgrounds.push(block)
    } else {
      contentBlocks.push(block)
    }
  }
  return { contentBlocks, wideBackgrounds }
}

/** Footer visual de una banda tintada: los fondos 1920 px integrados, sin card. */
function WideBackgroundImages({ backgrounds }: { backgrounds: GuideBlockBackground[] }) {
  return (
    <div className="flex w-full flex-col gap-4">
      {backgrounds.map((bg, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${bg.src}-${i}`}
          src={bg.src}
          alt=""
          className="block h-auto w-full object-cover object-center opacity-90 dark:opacity-70"
        />
      ))}
    </div>
  )
}

/** Superficie no interactiva para un paso: rail de acento + pictograma. */
function GuideStepGrid({
  steps,
  keyPrefix,
}: {
  steps: GuideBlockStep[]
  keyPrefix: string
}) {
  const single = steps.length === 1
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {steps.map((step, i) => (
        <div
          key={`${keyPrefix}-${i}`}
          className={cn(
            "flex gap-4 border border-border border-l-4 bg-card/90 p-4 sm:p-5",
            single && "md:col-span-2",
          )}
          style={{ borderLeftColor: "var(--guide-accent)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={step.icon} alt="" className="size-20 shrink-0 object-contain sm:size-28" />
          <p className="text-sm leading-relaxed text-foreground sm:text-base">{step.text}</p>
        </div>
      ))}
    </div>
  )
}

/** Render incluido de un bloque individual (no step). */
function renderBlock(block: GuideBlock, key: string): ReactNode {
  switch (block.kind) {
    case "text":
      return (
        <div key={key} className="flex flex-col gap-2.5">
          {block.paragraphs.map((p, j) =>
            p.bullets ? (
              <ul
                key={`${key}-${j}`}
                className="flex list-disc flex-col gap-1.5 pl-5 text-base leading-7 text-foreground marker:text-[var(--guide-accent-ink)]"
              >
                {p.bullets.map((b, k) => (
                  <li key={k}>{b}</li>
                ))}
              </ul>
            ) : (
              <p key={`${key}-${j}`} className="text-base leading-7 text-foreground">
                {p.text}
              </p>
            ),
          )}
        </div>
      )
    case "figure":
      return (
        <figure
          key={key}
          className="mx-auto w-full border border-border bg-card p-4 sm:p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} className="mx-auto h-auto max-w-full object-contain" />
        </figure>
      )
    case "background":
      // Fondos no anchos (verticales mal tipados): misma rama contenida que
      // figure, nunca full-bleed ni `object-cover` estirado.
      return (
        <figure key={key} className="mx-auto w-full border border-border bg-card p-4 sm:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt="" className="mx-auto h-auto max-w-full object-contain" />
        </figure>
      )
    case "subheading":
      return (
        <h3
          key={key}
          className="text-xl font-bold tracking-tight text-[var(--guide-accent-ink)] sm:text-2xl"
        >
          {block.text}
        </h3>
      )
    case "links":
      return (
        <div key={key} className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <Button
              key={item.href}
              variant="outline"
              render={<a href={item.href} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              className="h-auto w-full justify-between whitespace-normal py-3"
            >
              <span>{item.label}</span>
              <ExternalLink className="size-4 shrink-0" aria-hidden />
            </Button>
          ))}
        </div>
      )
    default:
      return null
  }
}

/**
 * Renderiza los bloques de una banda. Agrupa únicamente secuencias contiguas
 * de `step` en `GuideStepGrid`; texto, figures, subheadings y links se quedan
 * en su posición. No reordena contenido SENAPRED.
 */
function GuideBlockList({ blocks, keyPrefix }: { blocks: GuideBlock[]; keyPrefix: string }) {
  const out: ReactNode[] = []
  let stepBuffer: GuideBlockStep[] = []
  let groupSeq = 0
  let outSeq = 0

  const flushSteps = () => {
    if (stepBuffer.length === 0) return
    out.push(
      <GuideStepGrid
        key={`${keyPrefix}-group-${groupSeq}`}
        steps={stepBuffer}
        keyPrefix={`${keyPrefix}-g${groupSeq}`}
      />,
    )
    groupSeq += 1
    stepBuffer = []
  }

  for (const block of blocks) {
    if (block.kind === "step") {
      stepBuffer.push(block)
    } else {
      flushSteps()
      out.push(renderBlock(block, `${keyPrefix}-b${outSeq}`))
      outSeq += 1
    }
  }
  flushSteps()

  return <>{out}</>
}

/** Apertura inmersiva: hero ilustrado (o azul institucional) a alto de viewport. */
function GuideHero({
  guide,
  hero,
  groupLabel,
  Icon,
}: {
  guide: SenapredGuide
  hero: GuideBlockBackground | null
  groupLabel: string
  Icon: LucideIcon
}) {
  const sections = guide.sections.length
  const meta = sections > 0 ? `${sections} secciones` : "Guía temática"

  return (
    <header
      className="relative flex min-h-[max(32rem,calc(100svh-3rem))] flex-col justify-between overflow-hidden lg:min-h-[max(32rem,calc(100dvh-3rem))] lg:max-h-[56rem]"
      style={{ "--guide-accent": getDisasterAccent(guide.slug) } as GuideStyle}
    >
      {hero ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.src}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/35" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[var(--primary-chile)]">
          <Icon
            className="absolute right-[-2rem] top-1/2 size-[22rem] max-w-[70%] -translate-y-1/2 text-white opacity-15"
            aria-hidden
          />
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-6 pt-24 sm:px-6 sm:pb-8 sm:pt-28 lg:px-8">
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/80">
            {groupLabel}
          </p>
          <div className="h-1 w-16 bg-[var(--guide-accent)]" />
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] sm:text-7xl lg:text-8xl">
            {formatGuideTitle(guide.title)}
          </h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8">
        <p className="border-t border-white/20 pt-4 font-mono text-[11px] uppercase tracking-wider text-white/70">
          {meta}
        </p>
      </div>
    </header>
  )
}

/** Banda introductoria tintada (bloques restantes tras el hero, sin numeración). */
function GuideIntro({ blocks }: { blocks: GuideBlock[] }) {
  const { contentBlocks, wideBackgrounds } = partitionVisualBlocks(blocks)
  if (contentBlocks.length === 0 && wideBackgrounds.length === 0) return null
  const hasWide = wideBackgrounds.length > 0
  return (
    <Reveal as="section" className="border-b border-border bg-[var(--guide-tint)]">
      {contentBlocks.length > 0 && (
        <div
          className={cn(
            "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
            hasWide
              ? "pt-12 pb-8 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12"
              : "py-12 sm:py-16 lg:py-20",
          )}
        >
          <div className="mx-auto max-w-4xl">
            <GuideBlockList blocks={contentBlocks} keyPrefix="intro" />
          </div>
        </div>
      )}
      {hasWide && <WideBackgroundImages backgrounds={wideBackgrounds} />}
    </Reveal>
  )
}

/** Banda editorial numerada. Fondos anchos integrados al pie; chapter band si no hay contenido. */
function GuideSection({
  section,
  index,
}: {
  section: SenapredGuide["sections"][number]
  index: number
}) {
  const { contentBlocks, wideBackgrounds } = partitionVisualBlocks(section.blocks)
  const num = String(index + 1).padStart(2, "0")
  const isChapter = contentBlocks.length === 0 && wideBackgrounds.length === 1

  if (isChapter) {
    return (
      <Reveal as="section" className="relative border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wideBackgrounds[0].src}
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto flex min-h-[18rem] w-full max-w-6xl flex-col justify-end gap-2 px-4 pb-10 pt-24 sm:min-h-[22rem] sm:px-6 lg:px-8">
          <span className="font-mono text-5xl font-bold tabular-nums leading-none text-white/50">
            {num}
          </span>
          <h2 className="max-w-3xl text-2xl font-extrabold tracking-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.4)] sm:text-4xl">
            {section.heading}
          </h2>
        </div>
      </Reveal>
    )
  }

  const hasWide = wideBackgrounds.length > 0
  return (
    <Reveal
      as="section"
      className={cn("border-b border-border", hasWide && "bg-[var(--guide-tint)]")}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
          hasWide
            ? "pt-12 pb-8 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12"
            : "py-12 sm:py-16 lg:py-20",
        )}
      >
        <div className="flex items-start gap-4">
          <span className="font-mono text-5xl font-bold tabular-nums leading-none text-[var(--guide-accent)] opacity-40 sm:text-6xl">
            {num}
          </span>
          <div className="h-full w-1 self-stretch bg-[var(--guide-accent)]" />
          <h2 className="flex-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {section.heading}
          </h2>
        </div>
        {contentBlocks.length > 0 && (
          <div className="mx-auto mt-6 max-w-4xl">
            <GuideBlockList blocks={contentBlocks} keyPrefix={`s${index}`} />
          </div>
        )}
      </div>
      {hasWide && <WideBackgroundImages backgrounds={wideBackgrounds} />}
    </Reveal>
  )
}

export function GuideContent({ guide }: { guide: SenapredGuide }) {
  const groupLabel =
    GUIDE_GROUPS.find((g) => g.key === guide.group)?.label ?? "Preparación"
  // Lookup directo en el record module-level: referencia estable (el rule
  // react-hooks/static-components marca cualquier call que devuelva un
  // componente, aunque la fuente sea estática).
  const Icon = GUIDE_ICONS[guide.slug] ?? ShieldAlert
  const accent = getDisasterAccent(guide.slug)

  // Solo el primer bloque, si es fondo ancho, es el hero. El resto queda como
  // banda introductoria tintada.
  const hero = isWideBackground(guide.intro[0]) ? guide.intro[0] : null
  const introBlocks = hero ? guide.intro.slice(1) : guide.intro

  const style: GuideStyle = {
    "--guide-accent": accent,
    "--guide-accent-ink":
      "color-mix(in oklch, var(--guide-accent) 70%, var(--foreground))",
    "--guide-tint": "color-mix(in oklch, var(--guide-accent) 10%, var(--background))",
  }

  return (
    <article style={style}>
      <GuideHero guide={guide} hero={hero} groupLabel={groupLabel} Icon={Icon} />
      <GuideIntro blocks={introBlocks} />
      {guide.sections.map((section, i) => (
        <GuideSection key={section.heading} section={section} index={i} />
      ))}

      <Reveal>
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="border-t border-border pt-6 text-xs text-muted-foreground">
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
        </div>
      </Reveal>
    </article>
  )
}