"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""

  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    })

    setLoading(false)

    if (!res.ok) {
      setError("El enlace no es válido o expiró. Solicita uno nuevo.")
      return
    }

    router.push("/login")
  }

  if (!token || !email) {
    return (
      <div className="space-y-4 text-sm text-white/55">
        <p>El enlace de recuperación no es válido.</p>
        <Link href="/forgot-password" className="text-white/75 hover:text-white">
          Solicitar un nuevo enlace
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando..." : "Restablecer contraseña"}
      </Button>
    </form>
  )
}