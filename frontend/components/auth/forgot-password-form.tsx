"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { requestPasswordReset } from "@/lib/api"
import { authErrorMessage } from "@/lib/auth-errors"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-foreground">
          Si ese correo tiene una cuenta, te enviamos un enlace para
          restablecer la contraseña. Revisa también la carpeta de no deseados.
        </p>
        <Link
          href="/iniciar-sesion"
          className="text-sm text-foreground underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <AuthField
        id="email"
        label="Correo"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={pending}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
      <Link
        href="/iniciar-sesion"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  )
}
