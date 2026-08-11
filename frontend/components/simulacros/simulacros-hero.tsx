export function SimulacrosHero() {
  return (
    <header
      aria-labelledby="simulacros-hero-title"
      className="relative flex min-h-[32rem] flex-col justify-between overflow-hidden border-b border-border bg-[var(--primary-chile)] lg:max-h-[56rem]"
    >
      {/* background images — local SENAPRED-derived artwork, swapped by theme */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/data/senapred/img/simulacros/hero.png"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-[68%_center] sm:object-center dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/data/senapred/img/simulacros/hero noche.png"
        alt=""
        aria-hidden
        className="absolute inset-0 hidden size-full object-cover object-[68%_center] sm:object-center dark:block"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/45"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="flex max-w-4xl flex-col items-center gap-3">
          <p className="text-[10px] font-semibold tracking-[1.2px] text-white/80 uppercase">
            Preparación ciudadana · SENAPRED
          </p>
          <div className="h-1 w-16 bg-[var(--primary-chile)]" />
          <h1
            id="simulacros-hero-title"
            className="max-w-4xl text-5xl font-extrabold tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] sm:text-7xl lg:text-8xl"
          >
            Simulacros
          </h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 text-center sm:px-6 sm:pb-14 sm:text-left lg:px-8">
        <p className="border-t border-white/20 pt-4 font-mono text-[11px] tracking-wider text-white/70 uppercase">
          Calendario de ejercicios · Fuente SENAPRED
        </p>
      </div>
    </header>
  )
}
