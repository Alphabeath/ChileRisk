import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"

type PageStubProps = {
  title: string
  description?: string
}

export function PageStub({ title, description }: PageStubProps) {
  return (
    <main
      className={cn(
        "mx-auto flex h-full w-full max-w-lg flex-col justify-center gap-6 overflow-y-auto px-6 pb-12",
        CITIZEN_NAVBAR_PAD_TOP_CLASS,
      )}
    >
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
          Próximamente
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Esta sección aún no está disponible. Mientras tanto puedes usar el
            monitor de amenazas.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/monitor" />} nativeButton={false}>
          Ir al monitor
        </Button>
        <Button
          variant="outline"
          render={<Link href="/inicio" />}
          nativeButton={false}
        >
          Inicio
        </Button>
      </div>
    </main>
  )
}
