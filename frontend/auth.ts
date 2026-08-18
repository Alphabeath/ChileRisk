import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { resolveAuthSecret } from "@/lib/auth-secret"
import { getBackendInternalUrl } from "@/lib/backend-url"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: resolveAuthSecret(),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/iniciar-sesion",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim()
        const password = String(credentials?.password ?? "")
        if (!email || !password) return null

        const res = await fetch(`${getBackendInternalUrl()}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) return null

        const user = (await res.json()) as {
          id: string
          email: string
          name: string | null
        }
        if (!user.id || !user.email) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
      }
      if (trigger === "update" && session && typeof session === "object") {
        const next = session as { name?: string | null }
        if ("name" in next) token.name = next.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.email = typeof token.email === "string" ? token.email : ""
        session.user.name = typeof token.name === "string" ? token.name : null
      }
      return session
    },
  },
})
