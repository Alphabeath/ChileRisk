import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      description="Regístrate para acceder al monitor y las guías ciudadanas."
    >
      <RegisterForm />
    </AuthShell>
  )
}