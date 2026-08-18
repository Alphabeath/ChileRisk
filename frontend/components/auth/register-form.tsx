"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState, type FormEvent } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { registerAccount } from "@/lib/api"
import { authErrorMessage } from "@/lib/auth-errors"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await registerAccount({ name, email, password })
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (!result || result.error) {
        router.push("/iniciar-sesion")
        return
      }
      router.push("/cuenta")
      router.refresh()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <AuthField
        id="name"
        label="Nombre"
        type="text"
        autoComplete="name"
        required
        minLength={1}
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={pending}
      />
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
      <AuthField
        id="password"
        label="Contraseña"
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
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
      <p className="text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/iniciar-sesion"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
