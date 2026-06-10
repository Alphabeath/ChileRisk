import { Suspense } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Nueva contraseña"
      description="Elige una contraseña nueva para tu cuenta."
    >
      <Suspense fallback={<p className="text-sm text-white/45">Cargando...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}