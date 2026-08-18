import { KIT_EMERGENCIA_HERO_ART } from "@/lib/kit-emergencia-content"

export function KitEmergenciaHero() {
  return (
    <header
      aria-labelledby="kit-emergencia-hero-title"
      className="relative flex min-h-[32rem] flex-col justify-between overflow-hidden border-b border-border bg-[#dbeaf3] lg:max-h-[56rem] dark:bg-[#0b1a2e]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KIT_EMERGENCIA_HERO_ART.light}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KIT_EMERGENCIA_HERO_ART.dark}
        alt=""
        aria-hidden
        className="absolute inset-0 hidden size-full object-cover object-center dark:block"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        <div className="flex max-w-3xl flex-col items-center gap-3">
          <p className="text-[10px] font-semibold tracking-[1.2px] text-[#0167b7] uppercase dark:text-sky-300">
            Prepárate hoy · SENAPRED
          </p>
          <div className="h-1 w-16 bg-[#00a6d0]" />
          <h1
            id="kit-emergencia-hero-title"
            className="max-w-3xl text-4xl font-extrabold tracking-tight text-[var(--primary-chile)] sm:text-6xl lg:text-7xl dark:text-white"
          >
            Kit de emergencia
          </h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 text-center sm:px-6 sm:pb-10 lg:px-8">
        <p className="border-t border-[var(--primary-chile)]/15 pt-4 font-mono text-[11px] tracking-wider text-[#0167b7] uppercase dark:border-white/20 dark:text-sky-300">
          48–72 horas · Fuente SENAPRED
        </p>
      </div>
    </header>
  )
}
