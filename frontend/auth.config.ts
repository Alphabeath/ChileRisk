import type { NextAuthConfig } from "next-auth"

const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "dev-change-me-in-production"
    : undefined)

export default {
  secret: authSecret,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
} satisfies NextAuthConfig