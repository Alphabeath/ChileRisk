import Link from "next/link"

import {
  KIT_EMERGENCIA_BASIC_ITEMS,
  KIT_EMERGENCIA_CAR_ITEMS,
  KIT_EMERGENCIA_EXTRA_ITEMS,
  KIT_EMERGENCIA_FAMILY_NOTE,
  KIT_EMERGENCIA_INTRODUCTION,
  type KitBasicItem,
} from "@/lib/kit-emergencia-content"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"

export function KitEmergenciaIntroduction() {
  return (
    <section
      aria-labelledby="kit-emergencia-intro-title"
      className="border-b border-border bg-background py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 text-center sm:px-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-14 md:text-left lg:px-8">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Prepárate hoy
          </p>
          <div
            className="mx-auto mt-3 h-1 w-14 bg-[#0167b7] dark:bg-sky-300 md:mx-0"
            aria-hidden
          />
          <h2
            id="kit-emergencia-intro-title"
            className="mt-5 text-[clamp(2.2rem,3.8vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.035em] text-balance text-foreground"
          >
            Arma tu kit
            <span className="block">de emergencia</span>
          </h2>
        </div>
        <div className="mx-auto max-w-[62ch] space-y-4 border-t border-border pt-5 md:mx-0">
          {KIT_EMERGENCIA_INTRODUCTION.map((paragraph) => (
            <p
              key={paragraph}
              className="text-center text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8 md:text-left"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

export function KitEmergenciaBasic() {
  return (
    <section
      aria-labelledby="kit-emergencia-basico-title"
      className="border-b border-border bg-background py-14 sm:py-16"
    >
      <div className={INNER_WRAPPER_CLASS}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Kit básico
          </p>
          <h2
            id="kit-emergencia-basico-title"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
          >
            Kit básico de emergencia que contenga:
          </h2>
        </div>

        <KitItemGrid items={KIT_EMERGENCIA_BASIC_ITEMS} />

        <p className="mx-auto mt-10 max-w-[70ch] text-center text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {KIT_EMERGENCIA_FAMILY_NOTE}
        </p>
      </div>
    </section>
  )
}

function KitItemGrid({ items }: { items: readonly KitBasicItem[] }) {
  return (
    <ul className="mt-8 grid items-stretch gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <li key={item.text} className="h-full">
          <article className="flex h-full flex-col border border-border bg-card">
            <div className="flex min-h-40 flex-1 items-center justify-center bg-muted/40 p-2 dark:bg-muted/20 sm:min-h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                aria-hidden
                className="size-full max-h-44 object-contain sm:max-h-52"
              />
            </div>
            <div className="flex flex-col items-center px-3 py-3 text-center sm:px-4 sm:py-4">
              <h3 className="text-sm leading-6 text-pretty text-foreground sm:text-[0.95rem] sm:leading-7">
                {item.text}
              </h3>
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-3 inline-flex min-h-11 items-center justify-center text-xs font-semibold tracking-widest text-[#0167b7] uppercase dark:text-sky-300"
                >
                  {item.hrefLabel}
                </Link>
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}

function KitListSection({
  eyebrow,
  title,
  titleId,
  items,
  muted,
}: {
  eyebrow: string
  title: string
  titleId: string
  items: readonly KitBasicItem[]
  muted?: boolean
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "border-b border-border py-14 sm:py-16",
        muted ? "bg-muted/40 dark:bg-muted/20" : "bg-background",
      )}
    >
      <div className={INNER_WRAPPER_CLASS}>
        <div className="mx-auto max-w-3xl text-center md:mx-0 md:max-w-none md:text-left">
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            {eyebrow}
          </p>
          <div
            className="mx-auto mt-3 h-1 w-14 bg-[#0167b7] dark:bg-sky-300 md:mx-0"
            aria-hidden
          />
          <h2
            id={titleId}
            className="mt-5 text-[clamp(2rem,3.4vw,3.4rem)] leading-[0.98] font-extrabold tracking-[-0.03em] text-balance text-foreground"
          >
            {title}
          </h2>
        </div>

        <KitItemGrid items={items} />
      </div>
    </section>
  )
}

export function KitEmergenciaExtra() {
  return (
    <KitListSection
      eyebrow="Supervivencia"
      title="Provisiones adicionales de supervivencia"
      titleId="kit-emergencia-extra-title"
      items={KIT_EMERGENCIA_EXTRA_ITEMS}
    />
  )
}

export function KitEmergenciaCar() {
  return (
    <KitListSection
      eyebrow="Movilidad"
      title="Kit de emergencia para el auto"
      titleId="kit-emergencia-auto-title"
      items={KIT_EMERGENCIA_CAR_ITEMS}
      muted
    />
  )
}
