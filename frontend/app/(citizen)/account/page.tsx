"use client"

import { signOut, useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export default function AccountPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8 pt-16">
        <p className="text-white/55">Cargando sesión...</p>
      </div>
    )
  }

  const user = session?.user

  return (
    <div className="flex items-center justify-center p-8 pt-16">
      <div className={cn(GLASS_PANEL_CLASS, "w-full max-w-md p-8")}>
        <h1 className="text-xl font-semibold tracking-wide text-white/90 uppercase">
          Cuenta
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Sesión activa en ChileRisk.
        </p>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
              Nombre
            </dt>
            <dd className="mt-1 text-white/90">{user?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
              Email
            </dt>
            <dd className="mt-1 text-white/90">{user?.email || "—"}</dd>
          </div>
        </dl>

        <Button
          type="button"
          variant="outline"
          className="mt-8 w-full border-white/15 bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}