"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"

import { DemoLoginCard } from "@/components/auth/demo-login-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEMO_LOGIN } from "@/lib/demo-login"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  async function signInWith(creds: { email: string; password: string }) {
    setError(null)
    const result = await signIn("credentials", {
      email: creds.email,
      password: creds.password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email o contraseña incorrectos.")
      return false
    }

    router.push(callbackUrl)
    router.refresh()
    return true
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await signInWith({ email, password })
    setLoading(false)
  }

  async function handleDemoSignIn() {
    setEmail(DEMO_LOGIN.email)
    setPassword(DEMO_LOGIN.password)
    setDemoLoading(true)
    await signInWith({
      email: DEMO_LOGIN.email,
      password: DEMO_LOGIN.password,
    })
    setDemoLoading(false)
  }

  const busy = loading || demoLoading

  return (
    <div className="space-y-6">
      <DemoLoginCard onUseAccount={handleDemoSignIn} busy={busy} />

      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-white/45 transition-colors hover:text-white/75"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </div>
  )
}
