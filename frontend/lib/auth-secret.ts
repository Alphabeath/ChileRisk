/**
 * HS256 secret shared by Auth.js and the backend proxy JWT.
 * Native `bun run dev` has no frontend/.env; Docker injects AUTH_SECRET.
 */
const DEV_AUTH_SECRET = "dev-change-me-generate-a-long-secret"

export function resolveAuthSecret(): string | undefined {
  return (
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development" ? DEV_AUTH_SECRET : undefined)
  )
}

export function requireAuthSecret(): string {
  const secret = resolveAuthSecret()
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }
  return secret
}
