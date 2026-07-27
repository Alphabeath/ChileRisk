"use client"

import { useSession } from "next-auth/react"
import { UserCircle } from "lucide-react"

import { AccountHomeComunaCard } from "@/components/account/account-home-comuna-card"
import { AccountProfileCard } from "@/components/account/account-profile-card"
import { AccountSessionCard } from "@/components/account/account-session-card"
import { CitizenPageHero } from "@/components/layout/citizen-page-hero"
import { useUserProfile } from "@/hooks"
import {
  PREPARATION_PAGE_INNER_CLASS,
  PREPARATION_PAGE_SHELL_CLASS,
} from "@/lib/preparation-ui"

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
          title="Cuenta"
          description="Define tu comuna de hogar para personalizar riesgo y alertas. Revisa tu perfil y cierra sesión cuando quieras."
        />

        <div className="mt-6 flex flex-col gap-4 lg:mt-8 lg:grid lg:grid-cols-2 lg:gap-5">
          <AccountProfileCard name={user?.name} email={user?.email} />
          <AccountHomeComunaCard
            key={profile?.home_comuna_code ?? "none"}
            initialCode={profile?.home_comuna_code ?? null}
            homeName={profile?.home_comuna_name ?? null}
          />
          <AccountSessionCard className="lg:col-span-2" />
        </div>
      </div>
    </div>
  )
}
