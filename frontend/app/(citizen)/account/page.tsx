"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { UserCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CitizenPageHero,
  HeroEyebrow,
} from "@/components/layout/citizen-page-hero"
import { useUpdateUserProfile, useUserProfile } from "@/hooks"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import {
  PREPARATION_PAGE_INNER_CLASS,
  PREPARATION_PAGE_SHELL_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

function HomeComunaForm({
  initialCode,
  homeName,
}: {
  initialCode: number | null
  homeName: string | null
}) {
  const updateProfile = useUpdateUserProfile()
  const [comunaInput, setComunaInput] = useState(
    initialCode != null ? String(initialCode) : "",
  )
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  async function saveComuna() {
    setSaveMsg(null)
    const raw = comunaInput.trim()
    const code = raw === "" ? null : Number(raw)
    if (raw !== "" && (!Number.isInteger(code) || code! < 1001)) {
      setSaveMsg("Código CUT inválido")
      return
    }
    try {
      const updated = await updateProfile.mutateAsync(code)
      setSaveMsg(
        updated.home_comuna_name
          ? `Guardado: ${updated.home_comuna_name}`
          : "Comuna de hogar limpiada",
      )
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "No se pudo guardar")
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <input
        value={comunaInput}
        onChange={(e) => setComunaInput(e.target.value)}
        placeholder="ej. 13101"
        className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
      />
      {homeName ? <p className="text-xs text-white/50">{homeName}</p> : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={updateProfile.isPending}
        className="border-white/15 bg-transparent text-white/80 hover:bg-white/[0.06]"
        onClick={() => void saveComuna()}
      >
        Guardar comuna
      </Button>
      {saveMsg ? <p className="text-xs text-white/55">{saveMsg}</p> : null}
    </div>
  )
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const { data: profile, isLoading: profileLoading } = useUserProfile()

  if (status === "loading" || profileLoading) {
    return (
      <div className={PREPARATION_PAGE_SHELL_CLASS}>
        <div className={PREPARATION_PAGE_INNER_CLASS}>
          <p className="text-white/55">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  const user = session?.user

  return (
    <div className={PREPARATION_PAGE_SHELL_CLASS}>
      <div className={PREPARATION_PAGE_INNER_CLASS}>
        <CitizenPageHero
          gradientClass="bg-gradient-to-br from-[var(--primary-chile)]/55 via-slate-950/70 to-emerald-950/45"
          watermark={
            <UserCircle
              className="pointer-events-none absolute -right-6 top-1/2 size-40 -translate-y-1/2 text-white/[0.08] sm:size-56 lg:size-64"
              strokeWidth={1}
              aria-hidden
            />
          }
          eyebrow={
            <HeroEyebrow className="border-white/20 bg-white/10 text-white/80">
              Perfil
            </HeroEyebrow>
          }
          title="Cuenta"
          description="Sesión activa en ChileRisk. Gestiona tu comuna de hogar y cierra sesión."
        />

        <div
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "w-full max-w-md p-8",
          )}
        >
          <dl className="space-y-4 text-sm">
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
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
                Comuna de hogar (CUT)
              </dt>
              <dd>
                <HomeComunaForm
                  key={profile?.home_comuna_code ?? "none"}
                  initialCode={profile?.home_comuna_code ?? null}
                  homeName={profile?.home_comuna_name ?? null}
                />
              </dd>
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
    </div>
  )
}
