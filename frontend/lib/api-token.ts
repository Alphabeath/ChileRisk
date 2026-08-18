import { SignJWT } from "jose"

import { requireAuthSecret } from "@/lib/auth-secret"

const GUEST_SUB = "guest"

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
    .sign(new TextEncoder().encode(requireAuthSecret()))
}

/** JWT for public monitor reads when there is no Auth.js session. */
export async function createGuestBackendApiToken() {
  return createBackendApiToken({ sub: GUEST_SUB })
}
