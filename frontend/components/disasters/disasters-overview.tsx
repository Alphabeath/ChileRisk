import { Reveal } from "@/components/disasters/scroll-reveal"
import { Button } from "@/components/ui/button"
import { SENAPRED_RECOMENDACIONES_URL } from "@/lib/senapred-guides"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

export function DisastersIntroduction() {
  return (
    <section
      aria-labelledby="desastres-intro-title"
      className="border-b border-border bg-background py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-end gap-10 px-4 text-center sm:px-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-14 md:text-left lg:px-8">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            Preparación ciudadana
          </p>
          <div
            className="mx-auto mt-3 h-1 w-14 bg-[#0167b7] dark:bg-sky-300 md:mx-0"
            aria-hidden
          />
          <h2
            id="desastres-intro-title"
            className="mt-5 text-[clamp(2.2rem,3.8vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.035em] text-balance text-foreground"
          >
            Conocer la amenaza
            <span className="block">para decidir</span>
            <span className="block">a tiempo</span>
          </h2>
        </div>
        <div className="mx-auto max-w-[62ch] border-t border-border pt-5 md:mx-0">
          <p className="text-center text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8 md:text-left">
            Guías oficiales de SENAPRED sobre amenazas naturales y antrópicas.
            ChileRisk las organiza por prioridad y enfoque inclusivo, sin
            modificar el contenido ni las ilustraciones oficiales.
          </p>
        </div>
      </div>
    </section>
  )
}

/** Encabezado editorial de cada banda: eyebrow, rail corto, título y count. */
export function DisastersBandHeader({
  eyebrow,
  title,
  count,
  titleId,
}: {
  eyebrow: string
  title: string
  count: number
  titleId?: string
}) {
  return (
    <Reveal>
      <header className="text-center md:text-left">
        <div className="flex items-center justify-center gap-3 md:justify-start">
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-[#0167b7] uppercase dark:text-sky-300">
            {eyebrow}
          </p>
          <span className="hidden font-mono text-[10px] tracking-[1.2px] text-muted-foreground uppercase sm:inline">
            · {count} guías
          </span>
        </div>
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
        <p className="mt-3 font-mono text-[10px] tracking-[1.2px] text-muted-foreground uppercase sm:hidden">
          {count} guías
        </p>
      </header>
    </Reveal>
  )
}

export function DisastersClosing() {
  return (
    <section
      aria-labelledby="desastres-referencia-title"
      className="relative overflow-hidden bg-[var(--primary-chile)] py-16 text-white sm:py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.18))]"
      />
      <div
        className={cn(
          INNER_WRAPPER_CLASS,
          "relative grid items-stretch gap-8 text-center lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:gap-12 lg:text-left",
        )}
      >
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-blue-100/80 uppercase">
            Referencia oficial
          </p>
          <div className="mx-auto mt-3 h-1 w-14 bg-white lg:mx-0" aria-hidden />
          <h2
            id="desastres-referencia-title"
            className="mt-5 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Guías oficiales
            <span className="block">de preparación SENAPRED</span>
          </h2>
          <p className="mt-6 text-base leading-7 text-blue-50 sm:text-lg sm:leading-8">
            Contenido e ilustraciones oficiales de SENAPRED. ChileRisk los
            presenta sin modificar, organizados por amenaza y enfoque.
          </p>
        </div>

        <aside className="flex flex-col justify-between border border-white/25 bg-white/5 p-5 text-center sm:p-6 lg:text-left">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[1.4px] text-blue-100/80 uppercase">
              Fuente
            </p>
            <p className="mt-4 text-xl leading-8 font-bold text-balance sm:text-2xl">
              Recomendaciones oficiales ante amenazas
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-8 w-full border-white bg-white text-[var(--primary-chile)] hover:bg-transparent hover:text-white focus-visible:ring-white lg:w-auto"
            render={
              <a
                href={SENAPRED_RECOMENDACIONES_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            nativeButton={false}
          >
            Ver en SENAPRED
          </Button>
        </aside>
      </div>
    </section>
  )
}
