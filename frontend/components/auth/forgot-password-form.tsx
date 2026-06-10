"use client"

import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (!res.ok) {
      setError("No se pudo procesar la solicitud. Inténtalo más tarde.")
      return
    }

    setMessage(
      "Si el email existe en nuestra base, recibirás un enlace para restablecer tu contraseña.",
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar enlace"}
      </Button>

      <p className="text-center text-sm text-white/45">
        <Link href="/login" className="text-white/75 hover:text-white">
          Volver al login
        </Link>
      </p>
    </form>
  )
}