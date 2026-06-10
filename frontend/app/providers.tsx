"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { useState, type ReactNode } from "react"

import { AppTopLoader } from "@/components/app-top-loader"
import { GlobalTopLoaderBridge } from "@/components/global-top-loader-bridge"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AppTopLoader />
        <GlobalTopLoaderBridge />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}