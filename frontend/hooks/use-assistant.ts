"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getChatThread,
  getNearestComuna,
  getUserProfile,
  listChatThreads,
  postChat,
  streamChat,
  updateUserProfile,
  type ChatStreamHandlers,
} from "@/lib/api"
import { queryKeys } from "@/lib/queries"
import type { ChatRequest, ChatResponse } from "@/lib/types"

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000,
  })
}

export function useNearestComuna(coords: { lat: number; lon: number } | null) {
  return useQuery({
    queryKey: queryKeys.nearestComuna(coords?.lat ?? 0, coords?.lon ?? 0),
    queryFn: () => getNearestComuna(coords!),
    enabled: Boolean(coords),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateUserProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (home_comuna_code: number | null) =>
      updateUserProfile({ home_comuna_code }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.userProfile() })
    },
  })
}

export function useChatThreads() {
  return useQuery({
    queryKey: queryKeys.chatThreads(),
    queryFn: listChatThreads,
    staleTime: 30 * 1000,
  })
}

export function useChatThread(threadId: string | null) {
  return useQuery({
    queryKey: queryKeys.chatThread(threadId ?? ""),
    queryFn: () => getChatThread(threadId!),
    enabled: Boolean(threadId),
  })
}

export function useSendChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ChatRequest) => postChat(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.chatThreads() })
    },
  })
}

export async function sendChatStreaming(
  body: ChatRequest,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  return streamChat(body, handlers, signal)
}
