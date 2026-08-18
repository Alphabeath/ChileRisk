import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegistroPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      description="Usa tu correo. No hace falta para consultar el monitor."
    >
      <RegisterForm />
    </AuthShell>
  )
}
