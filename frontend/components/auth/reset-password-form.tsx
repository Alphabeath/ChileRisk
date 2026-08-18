"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { resetPassword } from "@/lib/api"
import { authErrorMessage } from "@/lib/auth-errors"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!token || !email) {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-foreground">
          Este enlace está incompleto. Solicita uno nuevo para restablecer tu
          contraseña.
        </p>
        <Link
          href="/olvide-contrasena"
          className="text-sm text-foreground underline-offset-4 hover:underline"
        >
          Pedir un enlace nuevo
        </Link>
      </div>
    )
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await resetPassword({ email, token, password })
      router.push("/iniciar-sesion")
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <AuthField
        id="email"
        label="Correo"
        type="email"
        value={email}
        readOnly
        disabled
      />
      <AuthField
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        hint="Mínimo 8 caracteres."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={pending}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Guardando…" : "Restablecer contraseña"}
      </Button>
    </form>
  )
}
