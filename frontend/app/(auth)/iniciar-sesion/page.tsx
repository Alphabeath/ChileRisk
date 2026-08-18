import { Suspense } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function IniciarSesionPage() {
  return (
    <AuthShell
      title="Iniciar sesión"
      description="El monitor es público. La cuenta guarda tu comuna y preferencias."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
