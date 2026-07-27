import { Mail, User } from "lucide-react"

import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export function AccountProfileCard({
  name,
  email,
  className,
}: {
  name: string | null | undefined
  email: string | null | undefined
  className?: string
}) {
  return (
    <section
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-5 p-5 sm:p-6",
        className,
      )}
    >
      <header>
        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>Perfil</p>
        <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-white/90">
          <User className="size-5 shrink-0 text-sky-300/80" aria-hidden />
          Datos de sesión
        </h2>
        <p className="mt-1 text-[12.5px] leading-snug text-white/50">
          Información de tu cuenta ChileRisk. El nombre y el email vienen del
          inicio de sesión.
        </p>
      </header>

      <dl className="flex flex-col gap-4">
        <div>
          <dt className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>
            Nombre
          </dt>
          <dd className="mt-1.5 text-sm text-white/90">{name?.trim() || "—"}</dd>
        </div>
        <div>
          <dt
            className={cn(
              PREPARATION_EYEBROW_CLASS,
              "flex items-center gap-1.5 text-white/45",
            )}
          >
            <Mail className="size-3" aria-hidden />
            Email
          </dt>
          <dd className="mt-1.5 break-all text-sm text-white/90">
            {email?.trim() || "—"}
          </dd>
        </div>
      </dl>
    </section>
  )
}
