import { ApiError } from "@/lib/api"

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Ese correo ya tiene una cuenta."
    if (error.status === 401) return "Correo o contraseña incorrectos."
    if (error.status === 400) return "El enlace no es válido o ya expiró."
  }
  return "No se pudo completar la solicitud. Inténtalo de nuevo."
}
