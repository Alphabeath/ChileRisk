"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState, type FormEvent } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/cuenta"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (!result || result.error) {
        setError("Correo o contraseña incorrectos.")
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.")
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
        autoComplete="current-password"
        required
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
        {pending ? "Entrando…" : "Iniciar sesión"}
      </Button>
      <div className="flex flex-col gap-3 text-sm">
        <Link
          href="/olvide-contrasena"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Olvidé mi contraseña
        </Link>
        <p className="text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Crear una
          </Link>
        </p>
      </div>
    </form>
  )
}
