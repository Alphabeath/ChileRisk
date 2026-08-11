"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { ScrollRoot } from "@/components/disasters/scroll-reveal"
import { SimulacroDetailBody } from "@/components/simulacros/simulacro-detail-body"
import { SimulacroDetailHero } from "@/components/simulacros/simulacro-detail-hero"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSimulacro } from "@/hooks/use-simulacros"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import { DRILL_TYPE_COLORS } from "@/lib/simulacros"
import { cn } from "@/lib/utils"

export function SimulacroDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, isError, error } = useSimulacro(slug)
  const accent = data
    ? DRILL_TYPE_COLORS[data.drill_type].accent
    : DRILL_TYPE_COLORS.otro.accent

  return (
    <ScrollRoot
      className={cn("h-full overflow-y-auto", CITIZEN_NAVBAR_PAD_TOP_CLASS)}
    >
      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !data ? (
        <DetailMissing slug={slug} message={error?.message} />
      ) : (
        <article
          style={
            {
              "--drill-accent": accent,
              "--drill-ink": DRILL_TYPE_COLORS[data.drill_type].ink,
            } as CSSProperties
          }
        >
          <SimulacroDetailHero item={data} />
          <SimulacroDetailBody item={data} />
          <footer className="border-t border-border bg-[var(--primary-chile)]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-14 lg:px-8">
              <div className="max-w-xl">
                <p className="font-mono text-[10px] font-semibold tracking-[1.2px] text-white/70 uppercase">
                  Fuente oficial
                </p>
                <p className="mt-2 text-lg font-bold tracking-tight text-white">
                  Información publicada por SENAPRED. Consulta la fuente oficial
                  para actualizaciones.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/simulacros"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "min-h-11 border-white/40 bg-transparent text-white hover:bg-white/10",
                  )}
                >
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Volver al calendario
                </Link>
                <a
                  href={data.detail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "min-h-11 bg-white text-[var(--primary-chile)] hover:bg-white/90",
                  )}
                >
                  Ver en SENAPRED
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            </div>
          </footer>
        </article>
      )}
    </ScrollRoot>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-0">
      <div className="min-h-[28rem] bg-muted px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-2/3 max-w-xl" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

function DetailMissing({
  slug,
  message,
}: {
  slug: string
  message?: string
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-mono text-[10px] font-semibold tracking-[1.2px] text-muted-foreground uppercase">
        Simulacro no encontrado
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        No hay detalle para «{slug}»
      </h1>
      <p className="text-sm text-muted-foreground">
        {message ??
          "El ejercicio puede haberse archivado o aún no sincronizado desde SENAPRED."}
      </p>
      <Link
        href="/simulacros"
        className={cn(buttonVariants({ size: "default" }), "mt-2 w-fit")}
      >
        Volver al calendario
      </Link>
    </div>
  )
}
