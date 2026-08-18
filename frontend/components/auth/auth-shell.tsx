import Link from "next/link"
import type { ReactNode } from "react"

type AuthShellProps = {
  title: string
  description?: string
  children: ReactNode
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="self-start text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <span className="text-foreground">Chile</span>
          <span className="text-[var(--primary-chile)]">Risk</span>
        </Link>
        <h1 className="mt-10 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  )
}
