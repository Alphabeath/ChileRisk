import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  INICIO_ACCOUNT_BENEFITS,
  INICIO_ACCOUNT_GUEST,
  INICIO_ACCOUNT_SIGNED_IN,
  INICIO_TERRITORY,
} from "@/lib/inicio-content"
import { cn } from "@/lib/utils"

const INNER_WRAPPER_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

export function InicioAccountInvite({
  authenticated,
}: {
  authenticated: boolean
}) {
  if (authenticated) {
    return (
      <section
        aria-labelledby="inicio-account-title"
        className="border-t border-border bg-background py-14 sm:py-16"
      >
        <div className={cn(INNER_WRAPPER_CLASS, "grid gap-2 lg:grid-cols-5")}>
          <div className="flex flex-col justify-between bg-[var(--primary-chile)] p-6 text-white sm:p-8 lg:col-span-3">
            <div>
              <div className="h-1 w-16 bg-white" aria-hidden />
              <h2
                id="inicio-account-title"
                className="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl"
              >
                {INICIO_ACCOUNT_SIGNED_IN.title}
              </h2>
              <p className="mt-4 max-w-[46ch] text-base leading-7 text-white/80 sm:text-lg">
                {INICIO_ACCOUNT_SIGNED_IN.body}
              </p>
            </div>
            <Button
              size="lg"
              className="mt-10 min-h-12 w-full border-white bg-white text-[var(--primary-chile)] hover:bg-transparent hover:text-white focus-visible:ring-white sm:w-auto"
              render={<Link href="/cuenta" />}
              nativeButton={false}
            >
              {INICIO_ACCOUNT_SIGNED_IN.action}
            </Button>
          </div>
          <aside className="flex flex-col justify-between border border-foreground/12 bg-muted p-6 sm:p-8 dark:border-border dark:bg-card lg:col-span-2">
            <p className="text-2xl font-extrabold tracking-tight text-balance text-foreground sm:text-3xl">
              Nombre, comuna y avisos
            </p>
            <p className="mt-auto pt-8 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              {INICIO_TERRITORY.map((item) => `${item.value} ${item.label}`).join(
                " · ",
              )}
            </p>
          </aside>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="inicio-account-title"
      className="border-t border-border bg-background py-14 sm:py-16"
    >
      <div className={cn(INNER_WRAPPER_CLASS, "grid gap-2 lg:grid-cols-5")}>
        <div className="flex flex-col justify-between bg-[var(--primary-chile)] p-6 text-white sm:p-8 lg:col-span-3">
          <div>
            <div className="h-1 w-16 bg-white" aria-hidden />
            <h2
              id="inicio-account-title"
              className="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              {INICIO_ACCOUNT_GUEST.title}
            </h2>
            <p className="mt-4 max-w-[46ch] text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              {INICIO_ACCOUNT_GUEST.body}
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="min-h-12 border-white bg-white text-[var(--primary-chile)] hover:bg-transparent hover:text-white focus-visible:ring-white"
              render={<Link href="/registro" />}
              nativeButton={false}
            >
              {INICIO_ACCOUNT_GUEST.register}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-12 border-white/70 bg-transparent text-white hover:bg-white hover:text-[var(--primary-chile)] focus-visible:ring-white"
              render={<Link href="/iniciar-sesion" />}
              nativeButton={false}
            >
              {INICIO_ACCOUNT_GUEST.login}
            </Button>
          </div>
          <p className="mt-8 font-mono text-[11px] tracking-wider text-white/70 uppercase">
            {INICIO_TERRITORY.map((item) => `${item.value} ${item.label}`).join(
              " · ",
            )}
          </p>
        </div>

        <ul className="grid gap-2 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
          {INICIO_ACCOUNT_BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="flex flex-col justify-between border border-foreground/12 bg-muted p-5 dark:border-border dark:bg-card sm:p-6"
            >
              <p className="text-lg font-extrabold tracking-tight text-balance text-foreground">
                {benefit.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {benefit.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
