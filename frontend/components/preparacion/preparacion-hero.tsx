import {
  FAMILIA_PREPARADA_HERO_ART,
  FAMILIA_PREPARADA_TOWN_PLAZA,
} from "@/lib/familia-preparada-content"

export function PreparacionHero() {
  return (
    <header
      aria-labelledby="preparacion-hero-title"
      className="relative flex min-h-[32rem] flex-col justify-between overflow-hidden border-b border-border bg-[var(--primary-chile)] lg:max-h-[56rem]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FAMILIA_PREPARADA_TOWN_PLAZA.src}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-[center_42%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,20,48,0.72)_0%,rgba(6,20,48,0.28)_42%,rgba(6,20,48,0.18)_68%,rgba(6,20,48,0.55)_100%)] dark:bg-[linear-gradient(180deg,rgba(4,12,28,0.82)_0%,rgba(4,12,28,0.42)_42%,rgba(4,12,28,0.28)_68%,rgba(4,12,28,0.68)_100%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 pt-10 pb-4 text-center sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">
        <div className="flex max-w-4xl flex-col items-center gap-3">
          <p className="text-[10px] font-semibold tracking-[1.2px] text-white/85 uppercase">
            Familia Preparada · SENAPRED
          </p>
          <div className="h-1 w-16 bg-[#00a6d0]" />
          <h1
            id="preparacion-hero-title"
            className="max-w-4xl text-5xl font-extrabold tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] sm:text-7xl lg:text-8xl"
          >
            Preparación
          </h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl justify-center px-4 sm:px-6 lg:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FAMILIA_PREPARADA_HERO_ART.src}
          alt={FAMILIA_PREPARADA_HERO_ART.alt}
          className="h-auto w-full max-w-5xl object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)]"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 text-center sm:px-6 sm:pb-14 sm:text-left lg:px-8">
        <p className="border-t border-white/25 pt-4 font-mono text-[11px] tracking-wider text-white/80 uppercase">
          8 pasos oficiales · Fuente SENAPRED
        </p>
      </div>
    </header>
  )
}
