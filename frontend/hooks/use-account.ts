import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

import { getComunasCatalog, getMe, updateMe } from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import { STALE } from "@/lib/query-cache"
import type { UserProfileUpdate } from "@/lib/types"

export function useMe() {
  const { status } = useSession()
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMe,
    enabled: status === "authenticated",
    staleTime: STALE.profile,
  })
}

export function useComunasCatalog(enabled = true) {
  return useQuery({
    queryKey: queryKeys.comunasCatalog(),
    queryFn: getComunasCatalog,
    enabled,
    staleTime: STALE.comunas,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UserProfileUpdate) => updateMe(body),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.me(), profile)
    },
  })
}
