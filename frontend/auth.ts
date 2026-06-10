import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

import authConfig from "./auth.config"

const backendUrl =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") || "http://localhost:8000"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== "string" || typeof password !== "string") {
          return null
        }

        const res = await fetch(`${backendUrl}/api/v1/auth/verify-credentials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          return null
        }

        const user = (await res.json()) as {
          id: string
          email: string
          name: string | null
        }
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const res = await fetch(`${backendUrl}/api/v1/auth/oauth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            provider_account_id: account.providerAccountId,
          }),
        })
        if (!res.ok) {
          return false
        }
        const data = (await res.json()) as { id: string }
        user.id = data.id
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.email = (token.email as string | undefined) ?? session.user.email
        session.user.name = (token.name as string | undefined) ?? session.user.name
      }
      return session
    },
  },
})