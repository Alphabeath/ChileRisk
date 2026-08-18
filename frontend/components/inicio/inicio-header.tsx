import { INICIO_HEADER, INICIO_HERO_ART } from "@/lib/inicio-content"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

export function InicioHeader() {
  return (
    <header className="relative flex min-h-[32rem] flex-col justify-center overflow-hidden border-b border-border bg-[#d6e4ee] lg:max-h-[56rem] dark:bg-[#0b1a2e]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={INICIO_HERO_ART.light}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-[center_42%] dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={INICIO_HERO_ART.dark}
        alt=""
        aria-hidden
        className="absolute inset-0 hidden size-full object-cover object-[center_42%] dark:block"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#d6e4ee]/55 via-transparent to-transparent dark:from-[#0b1a2e]/55 dark:via-transparent dark:to-transparent"
      />

      <div
        className={cn(
          INNER_WRAPPER_CLASS,
          "relative z-10 flex flex-col items-center justify-center py-16 text-center sm:py-20",
        )}
      >
        <div className="flex max-w-3xl flex-col items-center gap-3">
          <div
            className="h-1 w-16 bg-[var(--primary-chile)] dark:bg-white"
            aria-hidden
          />
          <h1
            id="inicio-title"
            className="text-6xl font-extrabold tracking-[-0.03em] text-balance text-[var(--primary-chile)] sm:text-7xl lg:text-8xl dark:text-white dark:[text-shadow:0_2px_16px_rgba(0,0,0,0.45)]"
          >
            {INICIO_HEADER.title}
          </h1>
        </div>
      </div>
    </header>
  )
}
