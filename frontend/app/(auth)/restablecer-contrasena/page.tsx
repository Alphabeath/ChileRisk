import { Suspense } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function RestablecerContrasenaPage() {
  return (
    <AuthShell
      title="Nueva contraseña"
      description="Elige una contraseña de al menos 8 caracteres."
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
