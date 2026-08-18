import type { CSSProperties } from "react"
import { ExternalLink } from "lucide-react"

import { Reveal } from "@/components/disasters/scroll-reveal"
import {
  SENAPRED_SIMULACROS_URL,
  SIMULACRO_CLOSING_PARAGRAPHS,
  SIMULACRO_HERO_INTRODUCTION,
  SIMULACRO_IMPORTANCE_ITEMS,
  SIMULACRO_PARTICIPATION_TITLE,
  SIMULACRO_TYPE_CONTENT,
} from "@/lib/simulacros-content"
import type { DrillType } from "@/lib/types"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

const SCENARIOS = [
  {
    type: "sismo_tsunami_borde_costero",
    image: "/data/senapred/img/simulacros/simulacro_tsunami.png",
    background: "#00a6d0",
    ink: "#062b38",
    alt: "Ilustración de una ola de tsunami acercándose al borde costero",
  },
  {
    type: "sismo_tsunami_educacion",
    image: "/data/senapred/img/simulacros/simulacro_educacion.png",
    background: "#0fb1af",
    ink: "#062f2e",
    alt: "Ilustración de estudiantes junto a un punto de encuentro",
  },
  {
    type: "erupcion_volcanica",
    image: "/data/senapred/img/simulacros/simulacro_volcan.png",
    background: "#b33a4a",
    ink: "#ffffff",
    alt: "Ilustración de un volcán activo",
  },
  {
    type: "remocion_en_masa",
    image: "/data/senapred/img/simulacros/simulacro_aluvion.png",
    background: "#6b4a2e",
    ink: "#fff8ef",
    alt: "Ilustración de una remoción en masa entre cerros",
  },
] as const satisfies readonly {
  type: Exclude<DrillType, "otro">
  image: string
  background: string
  ink: string
  alt: string
}[]

type ScenarioStyle = CSSProperties & {
  "--scenario-bg": string
  "--scenario-ink": string
}

function splitReason(reason: string): { lead: string; detail: string } {
  const commaIndex = reason.indexOf(",")
  if (commaIndex === -1) return { lead: reason, detail: "" }
  return {
    lead: reason.slice(0, commaIndex + 1),
    detail: reason.slice(commaIndex + 1).trim(),
  }
}

export function SimulacrosIntroduction() {
  return (
    <>
      <section
        aria-labelledby="simulacros-intro-title"
        className="border-b border-border bg-background py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 text-center sm:px-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-14 md:text-left lg:px-8">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
              Preparación ciudadana
            </p>
            <div
              className="mx-auto mt-3 h-1 w-14 bg-[#0167b7] dark:bg-sky-300 md:mx-0"
              aria-hidden
            />
            <h2
              id="simulacros-intro-title"
              className="mt-5 text-[clamp(2.2rem,3.8vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.035em] text-balance text-foreground"
            >
              Actuar hoy
              <span className="block">para cuidarnos</span>
              <span className="block">siempre</span>
            </h2>
          </div>
          <div className="mx-auto max-w-[62ch] border-t border-border pt-5 md:mx-0">
            <p className="text-center text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8 md:text-left">
              {SIMULACRO_HERO_INTRODUCTION}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="simulacros-importancia-title"
        className="border-b border-border bg-muted/40 py-14 sm:py-16 dark:bg-muted/20"
      >
        <div className={cn(INNER_WRAPPER_CLASS, "simulacros-reasons-sequence")}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
              Por qué importan
            </p>
            <h2
              id="simulacros-importancia-title"
              className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
            >
              ¿Por qué son importantes estos simulacros?
            </h2>
          </div>

          <ol className="mx-auto mt-8 max-w-5xl space-y-3 sm:mt-10">
            {SIMULACRO_IMPORTANCE_ITEMS.map((reason, index) => {
              const { lead, detail } = splitReason(reason)
              return (
                <li
                  key={reason}
                  className="grid overflow-hidden border border-border bg-card text-card-foreground sm:grid-cols-[4.75rem_minmax(0,1fr)]"
                >
                  <span className="flex items-center justify-center border-b border-border bg-[#0167b7] px-3 py-3 font-mono text-xl font-bold text-white tabular-nums dark:bg-sky-400 dark:text-slate-950 sm:border-r sm:border-b-0 sm:text-2xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="px-4 py-4 text-center text-sm leading-6 sm:px-5 sm:py-4 sm:text-left sm:text-[0.95rem] sm:leading-7">
                    <strong className="font-bold text-foreground">{lead}</strong>{" "}
                    <span className="text-muted-foreground">{detail}</span>
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </>
  )
}

export function SimulacrosScenarios() {
  return (
    <section
      className="overflow-x-clip"
      aria-labelledby="simulacros-tipos-title"
    >
      <div className="border-b border-border bg-background py-12 text-center sm:py-14">
        <div className={INNER_WRAPPER_CLASS}>
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Tipos de ejercicio
          </p>
          <h2
            id="simulacros-tipos-title"
            className="mx-auto mt-3 max-w-4xl text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
          >
            ¿Conoces los tipos de simulacro que realiza SENAPRED?
          </h2>
        </div>
      </div>

      {SCENARIOS.map((scenario, index) => {
        const content = SIMULACRO_TYPE_CONTENT[scenario.type]
        const style: ScenarioStyle = {
          "--scenario-bg": scenario.background,
          "--scenario-ink": scenario.ink,
        }

        return (
          <article
            key={scenario.type}
            className="overflow-hidden border-b border-black/10 bg-[var(--scenario-bg)] text-[var(--scenario-ink)]"
            style={style}
          >
            <Reveal
              className="w-full"
              x={index % 2 === 0 ? -96 : 96}
              y={0}
              delay={index * 0.05}
            >
              <div
                className={cn(
                  INNER_WRAPPER_CLASS,
                  "grid items-center gap-5 py-5 text-center md:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] md:gap-8 md:py-6 md:text-left lg:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)]"
                )}
              >
                <div className="flex items-center justify-center md:justify-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scenario.image}
                    alt={scenario.alt}
                    className="h-auto w-full max-w-[9rem] drop-shadow-[0_10px_20px_rgba(0,0,0,0.16)] sm:max-w-[11rem] lg:max-w-[13rem]"
                  />
                </div>

                <div className="flex min-w-0 flex-col items-center justify-center md:items-start">
                  <h3 className="text-xl font-extrabold tracking-tight text-balance sm:text-2xl">
                    {content.title}
                  </h3>
                  <div className="mx-auto mt-2 max-w-[68ch] space-y-2 text-sm leading-6 sm:text-[0.95rem] sm:leading-6 md:mx-0">
                    {content.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </article>
        )
      })}
    </section>
  )
}

export function SimulacrosClosing() {
  return (
    <section
      aria-labelledby="simulacros-entrenamiento-title"
      className="relative overflow-hidden bg-[var(--primary-chile)] py-16 text-white sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.18))]"
      />
      <div className={cn(INNER_WRAPPER_CLASS, "relative")}>
        <div className="grid items-stretch gap-8 text-center lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:gap-12 lg:text-left">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-blue-100/80 uppercase">
              Participación ciudadana
            </p>
            <div
              className="mx-auto mt-3 h-1 w-14 bg-white lg:mx-0"
              aria-hidden
            />
            <h2
              id="simulacros-entrenamiento-title"
              className="mt-5 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              Entrenamiento real
              <span className="block">para una mejor respuesta</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-blue-50 sm:text-lg sm:leading-8">
              <p>{SIMULACRO_CLOSING_PARAGRAPHS[0]}</p>
              <p>{SIMULACRO_CLOSING_PARAGRAPHS[1]}</p>
            </div>
          </div>

          <aside className="flex flex-col justify-between border border-white/25 bg-white/5 p-5 text-center sm:p-6 lg:text-left">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-blue-100/80 uppercase">
                Acción
              </p>
              <p className="mt-4 text-xl leading-8 font-bold text-balance sm:text-2xl">
                {SIMULACRO_PARTICIPATION_TITLE}
              </p>
            </div>
            <a
              href={SENAPRED_SIMULACROS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-white bg-white px-5 py-3 text-xs font-semibold tracking-widest text-[var(--primary-chile)] uppercase transition-colors hover:bg-transparent hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary-chile)] focus-visible:outline-none sm:w-auto"
            >
              Visitar SENAPRED
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}
