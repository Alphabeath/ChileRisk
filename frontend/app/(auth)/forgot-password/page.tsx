import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te enviaremos un enlace para restablecer tu contraseña."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}