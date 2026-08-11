/**
 * Hero de marca del catálogo `/desastres` (Server Component).
 * Full-bleed con la ilustración multi-amenaza `catalog/hero.png` bajo la
 * navbar; en modo oscuro se usa la variante nocturna `catalog/hero noche.png`
 * (swap 100% CSS vía variante `dark:`). Hero compacto para mantener visible
 * la primera banda; título centrado verticalmente, rail institucional y metadata mono al pie. El azul `--primary-chile` detrás es el fallback si
 * un asset no carga.
 */
export function DisastersCatalogHero({ guideCount }: { guideCount: number }) {
  const meta = guideCount > 0 ? `${guideCount} guías` : "Biblioteca temática"
  return (
    <header
      aria-labelledby="desastres-hero-title"
      className="relative flex min-h-[32rem] flex-col justify-between overflow-hidden border-b border-border bg-[var(--primary-chile)] lg:max-h-[56rem]"
    >
      {/* background images — plain <img>, no next/image (repo has zero next/image imports) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/data/senapred/img/catalog/hero.png"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/data/senapred/img/catalog/hero noche.png"
        alt=""
        aria-hidden
        className="absolute inset-0 hidden size-full object-cover object-center dark:block"
      />

      {/* legibility scrim: same overlay as the detail hero */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/35"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="flex max-w-4xl flex-col items-center gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/80">
            Guías de preparación · SENAPRED
          </p>
          <div className="h-1 w-16 bg-[var(--primary-chile)]" />
          <h1
            id="desastres-hero-title"
            className="max-w-4xl text-5xl font-extrabold tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] sm:text-7xl lg:text-8xl"
          >
            Desastres
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