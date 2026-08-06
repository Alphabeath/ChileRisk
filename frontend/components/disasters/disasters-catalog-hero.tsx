/**
 * Hero de marca del catálogo `/desastres` (Server Component).
 * Full-bleed con la ilustración multi-amenaza `catalog/hero.png` bajo la
 * navbar; scrim institucional Chile (izquierda) + degradado oscuro (abajo)
 * para legibilidad en light y dark; stats en mono.
 */
export function DisastersCatalogHero({
  guideCount,
  preparateCount,
  inclusivaCount,
}: {
  guideCount: number
  preparateCount: number
  inclusivaCount: number
}) {
  return (
    <section
      aria-labelledby="desastres-hero-title"
      className="relative isolate min-h-[22rem] overflow-hidden border-b border-border sm:min-h-[26rem] lg:min-h-[28rem]"
    >
      {/* background image — plain <img>, no next/image (repo has zero next/image imports) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/data/senapred/img/catalog/hero.png"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />

      {/* legibility scrim: institutional blue left + dark bottom; NOT pure black/60 glass */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[var(--primary-chile)]/92 via-[var(--primary-chile)]/70 to-[var(--primary-chile)]/25"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10"
      />
      {/* thin Chile accent bar at bottom edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[var(--primary-chile)] via-[var(--secondary-chile)] to-[var(--primary-chile)]"
      />

      <div className="relative z-10 mx-auto flex h-full min-h-[22rem] max-w-6xl flex-col justify-end gap-6 px-4 py-10 sm:min-h-[26rem] sm:py-14 lg:min-h-[28rem]">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
            Guías de preparación · SENAPRED
          </p>
          <h1
            id="desastres-hero-title"
            className="mt-2 text-4xl font-extrabold tracking-tighter text-white drop-shadow-sm sm:text-5xl lg:text-6xl"
          >
            Desastres
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/90 sm:text-lg">
            Recomendaciones oficiales de SENAPRED para prepararte ante cada
            tipo de amenaza.
          </p>
        </div>

        <dl className="grid max-w-lg grid-cols-3 gap-2 sm:gap-3">
          <HeroStat value={guideCount} label="Guías" />
          <HeroStat value={preparateCount} label="Prepárate" />
          <HeroStat value={inclusivaCount} label="Inclusivas" />
        </dl>
      </div>
    </section>
  )
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-1 border border-white/20 bg-black/35 px-3 py-2.5 backdrop-blur-sm supports-[backdrop-filter]:bg-black/25">
      <dt className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/65">
        {label}
      </dt>
      <dd className="font-mono text-2xl font-bold tabular-nums tracking-wider text-white">
        {value}
      </dd>
    </div>
  )
}
