"use client"

import {
  BookOpen,
  Bot as BotIcon,
  CalendarCheck2,
  ClipboardList,
  Gauge,
  MapPin,
  Siren,
  User as UserIcon,
  UserRound,
  WavesHorizontal,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { AssistantMarkdown } from "@/components/assistant/assistant-markdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import type { ToolCallTrace } from "@/lib/types"
import { cn } from "@/lib/utils"

const TOOL_BADGE_ICONS: Record<string, LucideIcon> = {
  get_family_plan: ClipboardList,
  get_active_alerts: Siren,
  list_simulacros: CalendarCheck2,
  get_comuna_risk: Gauge,
  get_recent_events: WavesHorizontal,
  get_air_quality: Wind,
  find_nearest_meeting_point: MapPin,
  get_disaster_guide: BookOpen,
  get_user_profile: UserRound,
}

export type AssistantUiMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
  tools?: ToolCallTrace[]
  pending?: boolean
}

export function AssistantMessageRow({ message }: { message: AssistantUiMessage }) {
  const isUser = message.role === "user"
  const showThinking = Boolean(message.pending && !message.content)

  return (
    <div
      className={cn(
        "flex w-full min-w-0",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-[min(100%,42rem)] flex-col gap-1.5",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex w-full gap-3 border px-4 py-3",
            isUser
              ? "flex-row-reverse border-[var(--primary-chile)]/40 bg-[var(--primary-chile)]/85 text-white"
              : "border-white/10 bg-white/[0.06] text-white/90",
          )}
        >
          <Avatar
            size="sm"
            className={cn(
              "mt-0.5 size-8 shrink-0 rounded-none border",
              isUser
                ? "border-white/25 bg-white/15"
                : "border-[var(--primary-chile)]/40 bg-[var(--primary-chile)]/25",
            )}
          >
            <AvatarFallback
              className={cn(
                "rounded-none bg-transparent",
                isUser ? "text-white" : "text-sky-100",
              )}
            >
              {isUser ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "mb-1 text-[10px] font-semibold uppercase tracking-[1.2px]",
                isUser ? "text-right text-white/55" : "text-white/40",
              )}
            >
              {isUser ? "Tú" : "Asistente"}
            </p>

            {showThinking ? (
              <span className="inline-flex items-center gap-2 text-sm text-white/55">
                <Spinner className="size-3.5" />
                Consultando…
              </span>
            ) : isUser ? (
              <p className="my-0 whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            ) : (
              <AssistantMarkdown>
                {message.content || (message.pending ? "…" : "")}
              </AssistantMarkdown>
            )}
          </div>
        </div>

        {message.tools && message.tools.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-0.5">
            {message.tools.map((t, index) => {
              const Icon = TOOL_BADGE_ICONS[t.name] ?? Wrench
              return (
                <span
                  key={`${t.name}-${index}`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
                    t.ok
                      ? "border-[var(--primary-chile)]/35 bg-[var(--primary-chile)]/15 text-sky-100"
                      : "border-red-400/30 bg-red-500/10 text-red-200",
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                  {t.summary}
                </span>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
