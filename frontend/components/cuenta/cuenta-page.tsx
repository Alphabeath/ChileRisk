"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { useMemo, useState, type FormEvent } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useComunasCatalog, useMe, useUpdateMe } from "@/hooks/use-account"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import type { UserProfile } from "@/lib/types"
import { cn } from "@/lib/utils"

export function CuentaPage() {
  const { status } = useSession()

  if (status === "loading") {
    return (
      <main
        className={cn(
          "h-full overflow-y-auto px-6 pb-12",
          CITIZEN_NAVBAR_PAD_TOP_CLASS,
        )}
      >
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pt-10">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </main>
    )
  }

  if (status !== "authenticated") {
    return (
      <main
        className={cn(
          "mx-auto flex h-full w-full max-w-lg flex-col justify-center gap-6 overflow-y-auto px-6 pb-12",
          CITIZEN_NAVBAR_PAD_TOP_CLASS,
        )}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cuenta
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Inicia sesión para guardar tu comuna y preferencias de aviso. El
            monitor sigue siendo público.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/iniciar-sesion" />} nativeButton={false}>
            Iniciar sesión
          </Button>
          <Button
            variant="outline"
            render={<Link href="/registro" />}
            nativeButton={false}
          >
            Crear cuenta
          </Button>
        </div>
      </main>
    )
  }

  return <CuentaProfile />
}

function CuentaProfile() {
  const me = useMe()

  if (me.isPending) {
    return (
      <main
        className={cn(
          "h-full overflow-y-auto px-6 pb-12",
          CITIZEN_NAVBAR_PAD_TOP_CLASS,
        )}
      >
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pt-10">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </main>
    )
  }

  if (me.isError || !me.data) {
    return (
      <main
        className={cn(
          "mx-auto flex h-full w-full max-w-lg flex-col justify-center gap-4 overflow-y-auto px-6 pb-12",
          CITIZEN_NAVBAR_PAD_TOP_CLASS,
        )}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Cuenta
        </h1>
        <p className="text-sm text-destructive" role="alert">
          No se pudo cargar tu perfil. Vuelve a intentar o inicia sesión de
          nuevo.
        </p>
        <Button
          variant="outline"
          onClick={() => void signOut({ callbackUrl: "/iniciar-sesion" })}
        >
          Cerrar sesión
        </Button>
      </main>
    )
  }

  return <CuentaProfileForm key={me.data.id} profile={me.data} />
}

function CuentaProfileForm({ profile }: { profile: UserProfile }) {
  const { update } = useSession()
  const comunas = useComunasCatalog(true)
  const save = useUpdateMe()
  const [name, setName] = useState(profile.name ?? "")
  const [homeComuna, setHomeComuna] = useState(
    profile.home_comuna_code != null ? String(profile.home_comuna_code) : "",
  )
  const [notifyAlerts, setNotifyAlerts] = useState(profile.notify_email_alerts)
  const [notifySimulacros, setNotifySimulacros] = useState(
    profile.notify_email_simulacros,
  )
  const [message, setMessage] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, { code: number; name: string }[]>()
    for (const item of comunas.data ?? []) {
      const list = map.get(item.region_name) ?? []
      list.push({ code: item.cod_comuna, name: item.name })
      map.set(item.region_name, list)
    }
    return Array.from(map.entries())
  }, [comunas.data])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      const profile = await save.mutateAsync({
        name: name.trim(),
        home_comuna_code: homeComuna ? Number(homeComuna) : null,
        notify_email_alerts: notifyAlerts,
        notify_email_simulacros: notifySimulacros,
      })
      await update({ name: profile.name })
      setMessage("Cambios guardados.")
    } catch {
      setMessage("No se pudieron guardar los cambios.")
    }
  }

  return (
    <main
      className={cn(
        "h-full overflow-y-auto px-6 pb-12",
        CITIZEN_NAVBAR_PAD_TOP_CLASS,
      )}
    >
      <form
        className="mx-auto flex w-full max-w-lg flex-col gap-6 pt-10"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cuenta
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Estos datos personalizan ChileRisk. El monitor sigue abierto sin
            cuenta.
          </p>
        </div>

        <AuthField
          id="cuenta-email"
          label="Correo"
          type="email"
          value={profile.email}
          readOnly
          disabled
        />
        <AuthField
          id="cuenta-name"
          label="Nombre"
          type="text"
          autoComplete="name"
          required
          minLength={1}
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={save.isPending}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cuenta-comuna"
            className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground"
          >
            Comuna de hogar
          </label>
          <select
            id="cuenta-comuna"
            className="h-11 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
            value={homeComuna}
            onChange={(event) => setHomeComuna(event.target.value)}
            disabled={save.isPending || comunas.isPending}
          >
            <option value="">Sin comuna</option>
            {grouped.map(([region, items]) => (
              <optgroup key={region} label={region}>
                {items.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-3 border-t border-border pt-5">
          <legend className="text-sm font-medium text-foreground">
            Avisos por correo
          </legend>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Se guardan en tu cuenta. ChileRisk todavía no envía estos avisos.
          </p>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={notifyAlerts}
              onChange={(event) => setNotifyAlerts(event.target.checked)}
              disabled={save.isPending}
            />
            Alertas oficiales
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={notifySimulacros}
              onChange={(event) => setNotifySimulacros(event.target.checked)}
              disabled={save.isPending}
            />
            Simulacros SENAPRED
          </label>
        </fieldset>

        {message ? (
          <p
            className={cn(
              "text-sm",
              save.isError ? "text-destructive" : "text-foreground",
            )}
            role="status"
          >
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void signOut({ callbackUrl: "/inicio" })}
          >
            Cerrar sesión
          </Button>
        </div>
      </form>
    </main>
  )
}
