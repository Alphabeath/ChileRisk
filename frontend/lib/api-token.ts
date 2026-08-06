import { SignJWT } from "jose"

const GUEST_SUB = "guest"

function authSecret(): string {
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev-change-me-generate-a-long-secret"
      : undefined)
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }
  return secret
}

export async function createBackendApiToken(payload: {
  sub: string
  email?: string | null
  name?: string | null
}) {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email ?? undefined,
    name: payload.name ?? undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(authSecret()))
}

/** JWT for unauthenticated monitor reads until NextAuth lands. */
export async function createGuestBackendApiToken() {
  return createBackendApiToken({ sub: GUEST_SUB })
}
