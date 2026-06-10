import { SignJWT } from "jose"

export async function createBackendApiToken(payload: {
  sub: string
  email?: string | null
  name?: string | null
}) {
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev-change-me-in-production"
      : undefined)
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }

  return new SignJWT({
    sub: payload.sub,
    email: payload.email ?? undefined,
    name: payload.name ?? undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret))
}