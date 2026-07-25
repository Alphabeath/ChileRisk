"use client"

import { useEffect, useRef, useState } from "react"
import {
  MapPin as MapPinIcon,
  Menu as MenuIcon,
  MessageCircle,
  Send as SendIcon,
} from "lucide-react"

import {
  AssistantHistoryDrawer,
  AssistantHistorySidebar,
} from "@/components/assistant/assistant-history"
import {
  AssistantMessageRow,
  type AssistantUiMessage,
} from "@/components/assistant/assistant-message"
import { Button } from "@/components/ui/button"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  sendChatStreaming,
  useActiveAlerts,
  useChatThread,
  useChatThreads,
  useNearestComuna,
  useUserProfile,
} from "@/hooks"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import type { ChatMessageIn, ChatResponse } from "@/lib/types"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "¿Qué incluye mi plan de emergencia?",
  "¿Qué alertas me afectan ahora?",
  "¿Hay un simulacro próximo en mi región?",
  "¿Cuál es el punto de encuentro más cercano?",
  "¿Qué debo hacer ante un tsunami?",
]

const WELCOME: AssistantUiMessage = {
  id: "welcome",
  role: "assistant",
  content: "¿En qué puedo ayudarte?",
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function AssistantChat() {
  const { data: profile } = useUserProfile()
  const { data: alerts, isLoading: alertsLoading } = useActiveAlerts()
  const { data: threads, refetch: refetchThreads } = useChatThreads()
  const [threadId, setThreadId] = useState<string | null>(null)
  const { data: threadDetail } = useChatThread(threadId)
  const [messages, setMessages] = useState<AssistantUiMessage[]>([WELCOME])
  const [input, setInput] = useState("")
  const hydratedThreadRef = useRef<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<"idle" | "pending" | "ready" | "denied">(
    "idle",
  )
  const { data: nearestComuna, isLoading: nearestLoading } = useNearestComuna(coords)
  const [sending, setSending] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const geoRequestedRef = useRef(false)
  const coordsRef = useRef(coords)
  const nearestRef = useRef(nearestComuna)
  const profileRef = useRef(profile)
  const geoStatusRef = useRef(geoStatus)
  const nearestLoadingRef = useRef(nearestLoading)
  coordsRef.current = coords
  nearestRef.current = nearestComuna
  profileRef.current = profile
  geoStatusRef.current = geoStatus
  nearestLoadingRef.current = nearestLoading

  useEffect(() => {
    if (!threadId || !threadDetail || threadDetail.id !== threadId) return
    if (hydratedThreadRef.current === threadId) return
    hydratedThreadRef.current = threadId
    setMessages(
      threadDetail.messages.map((m) => ({
        id: m.id,
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
        tools: m.tool_trace ?? undefined,
        sources: m.tool_trace?.filter((t) => t.ok).map((t) => t.summary),
      })),
    )
  }, [threadId, threadDetail])

  function requestGeo() {
    if (!navigator.geolocation) {
      setGeoStatus("denied")
      return
    }
    setGeoStatus("pending")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoStatus("ready")
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  useEffect(() => {
    if (geoRequestedRef.current) return
    geoRequestedRef.current = true
    requestGeo()
  }, [])

  function selectThread(id: string) {
    hydratedThreadRef.current = null
    setThreadId(id)
    setHistoryOpen(false)
  }

  function startNewThread() {
    abortRef.current?.abort()
    hydratedThreadRef.current = null
    setThreadId(null)
    setMessages([WELCOME])
    setHistoryOpen(false)
    inputRef.current?.focus()
  }

  const locationLabel =
    nearestComuna?.name ??
    (geoStatus === "denied" ? profile?.home_comuna_name : null) ??
    null

  async function waitForLocation(timeoutMs = 8000): Promise<{
    lat?: number
    lon?: number
    comuna_code?: number
  }> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (geoStatusRef.current === "denied") break
      const c = coordsRef.current
      const n = nearestRef.current
      if (c && n) {
        return { lat: c.lat, lon: c.lon, comuna_code: n.cod_comuna }
      }
      if (c && !nearestLoadingRef.current) {
        return {
          lat: c.lat,
          lon: c.lon,
          comuna_code: n?.cod_comuna ?? profileRef.current?.home_comuna_code ?? undefined,
        }
      }
      await new Promise((r) => setTimeout(r, 150))
    }
    const c = coordsRef.current
    return {
      lat: c?.lat,
      lon: c?.lon,
      comuna_code:
        nearestRef.current?.cod_comuna ??
        profileRef.current?.home_comuna_code ??
        undefined,
    }
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const history: ChatMessageIn[] = [
      ...messages
        .filter((m) => m.id !== "welcome" && !m.pending)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: trimmed },
    ]

    const userMsg: AssistantUiMessage = { id: newId(), role: "user", content: trimmed }
    const pendingId = newId()
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: pendingId, role: "assistant", content: "", pending: true },
    ])
    setInput("")
    setSending(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const location = await waitForLocation()

    try {
      const response = await sendChatStreaming(
        {
          messages: history,
          thread_id: threadId,
          comuna_code: location.comuna_code,
          lat: location.lat,
          lon: location.lon,
        },
        {
          onToken: (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === pendingId
                  ? { ...m, content: m.content + chunk, pending: true }
                  : m,
              ),
            )
          },
        },
        controller.signal,
      )
      applyFinal(pendingId, response)
      if (response.thread_id) {
        hydratedThreadRef.current = response.thread_id
        setThreadId(response.thread_id)
      }
      void refetchThreads()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No pude completar la consulta."
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                content: `**Error:** ${message}`,
                pending: false,
              }
            : m,
        ),
      )
    } finally {
      setSending(false)
    }
  }

  function applyFinal(pendingId: string, response: ChatResponse) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              content: response.reply,
              sources: response.sources,
              tools: response.tool_calls_used,
              pending: false,
            }
          : m,
      ),
    )
  }

  const showSuggestions = messages.length === 1 && messages[0]?.id === "welcome"
  const alertCount = alerts?.length ?? 0
  const locationPending =
    geoStatus === "pending" || (geoStatus === "ready" && nearestLoading)

  const historyProps = {
    threads: threads ?? [],
    activeThreadId: threadId,
    onSelect: selectThread,
    onNew: startNewThread,
  }

  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[248px_minmax(0,1fr)]">
      <AssistantHistorySidebar {...historyProps} className="h-full" />

      <section
        className={cn(
          "relative flex min-h-0 flex-col overflow-hidden",
          "border border-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl",
          "bg-black/30 supports-[backdrop-filter]:bg-black/20",
          GLASS_MICA_INTERACTIVE_CLASS,
        )}
      >
        <AssistantHistoryDrawer
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          {...historyProps}
        />

        {/* Brand band — hamburger + brand; stats only on lg, right-aligned */}
        <header className="relative shrink-0 overflow-hidden border-b border-white/10">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-chile)]/35 via-red-950/30 to-[var(--secondary-chile)]/20"
            aria-hidden
          />
          <div className="relative flex items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setHistoryOpen(true)}
              className="shrink-0 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Abrir historial"
            >
              <MenuIcon />
            </Button>

            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center border border-[var(--primary-chile)]/40 bg-[var(--primary-chile)]/25 sm:size-10"
                aria-hidden
              >
                <MessageCircle className="size-4 text-sky-100 sm:size-5" />
              </span>
              <div className="min-w-0">
                <p className={cn(PREPARATION_EYEBROW_CLASS, "text-sky-200/80")}>
                  Asistente ciudadano
                </p>
                <h1 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                  ChileRisk
                </h1>
              </div>
            </div>

            <div className="hidden shrink-0 items-stretch gap-3 lg:flex">
              <div className="flex min-w-[7.5rem] max-w-[12rem] flex-col gap-0.5 text-right">
                <span className="flex items-center justify-end gap-1 text-[9px] font-semibold uppercase tracking-[1.2px] text-white/45">
                  <MapPinIcon className="size-2.5" aria-hidden />
                  Ubicación
                </span>
                {geoStatus === "denied" ? (
                  <button
                    type="button"
                    onClick={requestGeo}
                    className="truncate text-sm font-semibold text-white/55 underline-offset-2 hover:text-sky-100 hover:underline"
                  >
                    Activar GPS
                  </button>
                ) : (
                  <span
                    className={cn(
                      "truncate text-sm font-semibold",
                      locationLabel
                        ? "text-sky-100"
                        : locationPending
                          ? "text-white/40"
                          : "text-white/55",
                    )}
                  >
                    {locationLabel
                      ? locationLabel
                      : locationPending
                        ? "Detectando…"
                        : "Sin ubicación"}
                  </span>
                )}
              </div>
              <div className="flex min-w-[5.5rem] flex-col gap-0.5 text-right">
                <span className="text-[9px] font-semibold uppercase tracking-[1.2px] text-white/45">
                  Alertas activas
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    alertsLoading
                      ? "text-white/40"
                      : alertCount > 0
                        ? "text-[var(--secondary-chile)]"
                        : "text-white/45",
                  )}
                >
                  {alertsLoading ? "…" : alertCount}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Conversation fills the viewport */}
        <div className="relative min-h-0 flex-1">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_38%,rgba(0,50,160,0.12),transparent_72%)]"
            aria-hidden
          />
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="absolute inset-0">
              <MessageScrollerViewport className="px-4 py-5 sm:px-6">
                <MessageScrollerContent
                  className={cn(
                    "mx-auto min-h-full w-full max-w-3xl gap-5",
                    showSuggestions ? "justify-center" : "justify-end",
                  )}
                >
                  {showSuggestions ? (
                    <div className="flex w-full flex-col items-center gap-6 px-2 py-6 text-center">
                      <div className="relative flex size-14 items-center justify-center">
                        <span
                          className="pointer-events-none absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(0,50,160,0.30),transparent_70%)]"
                          aria-hidden
                        />
                        <span
                          className="absolute inset-0 animate-pulse border border-[var(--primary-chile)]/30"
                          aria-hidden
                        />
                        <span className="flex size-14 items-center justify-center border border-[var(--primary-chile)]/40 bg-[var(--primary-chile)]/20">
                          <MessageCircle
                            className="size-7 text-sky-100"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-sky-200/70")}>
                          Asistente ChileRisk
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                          ¿En qué te ayudo hoy?
                        </h2>
                        <p className="mx-auto max-w-md text-sm leading-relaxed text-white/55">
                          Consulta tu plan de emergencia, alertas que te afectan,
                          simulacros, puntos de encuentro y guías ante desastres.
                        </p>
                      </div>
                      <div className="flex w-full max-w-2xl flex-wrap justify-center gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={sending}
                            onClick={() => void send(s)}
                            className={cn(
                              "border border-white/12 bg-white/[0.04] px-3 py-2 text-left text-[13px] leading-snug text-white/70 normal-case",
                              "transition-all hover:-translate-y-px hover:border-[var(--primary-chile)]/45 hover:bg-[var(--primary-chile)]/15 hover:text-white",
                              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--primary-chile)]/45",
                              "disabled:pointer-events-none disabled:opacity-50",
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <MessageScrollerItem
                        key={m.id}
                        messageId={m.id}
                        scrollAnchor={m.role === "user"}
                      >
                        <AssistantMessageRow message={m} />
                      </MessageScrollerItem>
                    ))
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton className="border-white/15 bg-black/70 text-white hover:bg-black/80 hover:text-white" />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        {/* Composer pinned to the bottom */}
        <div className="shrink-0 border-t border-white/10 bg-black/20 px-3 py-3 backdrop-blur-sm sm:px-5">
          <form
            className="flex items-end gap-2 border border-white/12 bg-black/25 p-2 transition-colors focus-within:border-[var(--primary-chile)]/60"
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              disabled={sending}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              className="field-sizing-content max-h-44 min-h-[2.75rem] flex-1 resize-none rounded-none border-0 bg-transparent px-2.5 py-1.5 text-sm leading-relaxed text-white shadow-none placeholder:text-white/40 focus-visible:border-0 focus-visible:ring-0"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className="h-10 shrink-0 bg-[var(--primary-chile)] px-4 text-white hover:bg-[var(--primary-chile)]/90 disabled:opacity-40"
            >
              {sending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SendIcon data-icon="inline-start" />
              )}
              Enviar
            </Button>
          </form>

          <p className="mt-2 text-center text-[10px] leading-snug text-white/30">
            <span className="hidden sm:inline">
              Enter enviar · Shift+Enter salto ·{" "}
            </span>
            Complemento informativo · no reemplaza canales oficiales SERNAPRED/ONEMI
          </p>
        </div>
      </section>
    </div>
  )
}
