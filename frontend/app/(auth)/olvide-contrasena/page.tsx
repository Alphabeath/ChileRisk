import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function OlvideContrasenaPage() {
  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te enviaremos un enlace si el correo tiene una cuenta."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
