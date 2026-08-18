import type { CSSProperties, ReactNode } from "react"
import { ArrowRight, BookOpen, ExternalLink, FileText } from "lucide-react"
import Link from "next/link"

import { Reveal } from "@/components/disasters/scroll-reveal"
import {
  FAMILIA_PREPARADA_DOCUMENTS,
  FAMILIA_PREPARADA_INTRODUCTION,
  FAMILIA_PREPARADA_INVITATIONS,
  FAMILIA_PREPARADA_STEPS,
  FAMILIA_PREPARADA_TOWN_STREET,
} from "@/lib/familia-preparada-content"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

/** Cards sit inset so Pueblo_002 remains visible at the sides on large screens. */
const CARD_COLUMN_CLASS =
  "mx-auto w-full max-w-3xl px-4 sm:max-w-4xl sm:px-6 lg:max-w-[52rem] xl:max-w-[56rem]"

type FieldStyle = CSSProperties & {
  "--field-bg": string
  "--field-ink": string
}

function fieldStyle(background: string, ink: string): FieldStyle {
  return { "--field-bg": background, "--field-ink": ink }
}

function invitationLead(invitation: string): { lead: string; rest: string } {
  const space = invitation.indexOf(" ")
  if (space === -1) return { lead: invitation, rest: "" }
  return {
    lead: invitation.slice(0, space),
    rest: invitation.slice(space + 1),
  }
}

export function PreparacionTownStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FAMILIA_PREPARADA_TOWN_STREET.src}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-[center_55%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-black/10 dark:bg-black/40"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function PreparacionIntroduction() {
  return (
    <section
      aria-labelledby="preparacion-intro-title"
      className="border-b border-border bg-background py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 text-center sm:px-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-14 md:text-left lg:px-8">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Plan familiar
          </p>
          <div
            className="mx-auto mt-3 h-1 w-14 bg-[#0167b7] dark:bg-sky-300 md:mx-0"
            aria-hidden
          />
          <h2
            id="preparacion-intro-title"
            className="mt-5 text-[clamp(2.2rem,3.8vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.035em] text-balance text-foreground"
          >
            Organizar el hogar
            <span className="block">antes de la</span>
            <span className="block">emergencia</span>
          </h2>
        </div>
        <div className="mx-auto max-w-[62ch] space-y-4 border-t border-border pt-5 md:mx-0">
          {FAMILIA_PREPARADA_INTRODUCTION.map((paragraph) => (
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

export function PreparacionInvitations() {
  return (
    <section
      aria-labelledby="preparacion-invitaciones-title"
      className="border-b border-border bg-background py-14 sm:py-16"
    >
      <div className={INNER_WRAPPER_CLASS}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Con el plan te invitamos a
          </p>
          <h2
            id="preparacion-invitaciones-title"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
          >
            Cuatro compromisos para el hogar
          </h2>
        </div>

        <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 xl:grid-cols-4">
          {FAMILIA_PREPARADA_INVITATIONS.map((invitation) => {
            const { lead, rest } = invitationLead(invitation.text)
            const Icon = invitation.icon
            return (
              <li
                key={invitation.text}
                className="flex flex-col bg-[var(--field-bg)] px-5 py-8 text-center text-[var(--field-ink)] sm:px-6 sm:py-9"
                style={fieldStyle(invitation.background, invitation.ink)}
              >
                <Icon className="mx-auto size-10" strokeWidth={1.75} aria-hidden />
                <p className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl xl:text-2xl">
                  {lead}
                </p>
                <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-6 sm:leading-7">
                  {rest}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function PreparacionSteps() {
  return (
    <section aria-labelledby="preparacion-pasos-title" className="py-8 sm:py-10">
      <div className={cn(CARD_COLUMN_CLASS, "mb-3 bg-[#d97706] py-10 text-center text-[#1f1300] sm:py-12")}>
        <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#5a3408] uppercase">
          Secuencia oficial
        </p>
        <h2
          id="preparacion-pasos-title"
          className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl"
        >
          Conoce los 8 pasos del Familia Preparada
        </h2>
      </div>

      <ol className={cn(CARD_COLUMN_CLASS, "space-y-3")}>
        {FAMILIA_PREPARADA_STEPS.map((step, index) => (
          <li key={step.title}>
            <article
              className="overflow-hidden bg-[var(--field-bg)] text-[var(--field-ink)]"
              style={fieldStyle(step.background, step.ink)}
            >
              <Reveal
                className="w-full"
                x={index % 2 === 0 ? -72 : 72}
                y={0}
                delay={Math.min(index * 0.03, 0.18)}
              >
                <div className="grid items-center gap-4 px-5 py-6 text-center sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:gap-6 sm:px-6 sm:py-7 sm:text-left">
                  <span className="font-mono text-4xl font-bold tabular-nums sm:text-5xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-extrabold tracking-tight text-balance sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mx-auto mt-2 max-w-[68ch] text-sm leading-6 sm:mx-0 sm:text-[0.95rem] sm:leading-7">
                      {step.detail}
                    </p>
                    {step.href ? (
                      step.external ? (
                        <a
                          href={step.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 border-b-2 border-current text-xs font-semibold tracking-widest uppercase"
                        >
                          {step.hrefLabel}
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ) : (
                        <Link
                          href={step.href}
                          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 border-b-2 border-current text-xs font-semibold tracking-widest uppercase"
                        >
                          {step.hrefLabel}
                          <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      )
                    ) : null}
                  </div>
                </div>
              </Reveal>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function PreparacionDocuments() {
  return (
    <section
      aria-labelledby="preparacion-documentos-title"
      className="border-t border-border bg-background py-14 sm:py-16"
    >
      <div className={INNER_WRAPPER_CLASS}>
        <div className="mx-auto max-w-3xl text-center md:mx-0 md:max-w-none md:text-left">
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Biblioteca SENAPRED
          </p>
          <div
            className="mx-auto mt-3 h-1 w-14 bg-[#0167b7] dark:bg-sky-300 md:mx-0"
            aria-hidden
          />
          <h2
            id="preparacion-documentos-title"
            className="mt-5 text-[clamp(2rem,3.4vw,3.4rem)] leading-[0.98] font-extrabold tracking-[-0.03em] text-balance text-foreground"
          >
            Revisa cada paso en detalle
          </h2>
        </div>

        <ul className="mt-8 grid items-stretch gap-3 sm:grid-cols-2">
          {FAMILIA_PREPARADA_DOCUMENTS.map((document) => {
            const DocIcon = document.kind === "PDF" ? FileText : BookOpen
            return (
              <li key={`${document.title}-${document.kind}`} className="h-full">
                <a
                  href={document.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full min-h-44 flex-col border border-border bg-card px-5 py-5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                >
                  <span className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
                    <DocIcon className="size-3.5" aria-hidden />
                    {document.kind}
                  </span>
                  <span className="mt-4 flex-1 text-base font-semibold text-balance text-foreground sm:text-lg">
                    {document.title}
                  </span>
                  <span className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Abrir
                    <ExternalLink className="size-3.5" aria-hidden />
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
