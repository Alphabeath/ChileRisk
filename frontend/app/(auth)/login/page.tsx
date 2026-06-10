import Link from "next/link"
import { Suspense } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthShell
      title="Ingresar"
      description="Accede al monitor ciudadano de riesgos en Chile."
      footer={
        <p>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-white/75 hover:text-white">
            Regístrate
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-white/45">Cargando...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}