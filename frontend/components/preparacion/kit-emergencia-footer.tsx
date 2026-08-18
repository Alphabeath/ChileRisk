import { ExternalLink } from "lucide-react"

import { KIT_EMERGENCIA_FOOTER_ART, SENAPRED_KIT_EMERGENCIA_URL } from "@/lib/kit-emergencia-content"

export function KitEmergenciaFooter() {
  return (
    <footer
      aria-labelledby="kit-emergencia-footer-title"
      className="relative overflow-hidden border-t border-border bg-background"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KIT_EMERGENCIA_FOOTER_ART.light}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KIT_EMERGENCIA_FOOTER_ART.dark}
        alt=""
        aria-hidden
        className="absolute inset-0 hidden size-full object-cover object-center dark:block"
      />

      <div className="relative z-10 mx-auto flex min-h-[22rem] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[26rem] sm:px-6 sm:py-20">
        <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
          Prepárate hoy
        </p>
        <h2
          id="kit-emergencia-footer-title"
          className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
        >
          48–72 horas de provisiones
        </h2>
        <a
          href={SENAPRED_KIT_EMERGENCIA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 border border-border bg-card px-5 text-xs font-semibold tracking-widest text-[#0167b7] uppercase transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none dark:text-sky-300"
        >
          Ver en SENAPRED
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </footer>
  )
}
