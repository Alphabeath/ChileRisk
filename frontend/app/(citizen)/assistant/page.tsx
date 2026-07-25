import { AssistantChat } from "@/components/assistant/assistant-chat"
import { PREPARATION_PAGE_SHELL_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export default function AssistantPage() {
  return (
    <div className={cn(PREPARATION_PAGE_SHELL_CLASS, "flex h-dvh max-h-dvh flex-col overflow-hidden")}>
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col px-4 pt-20 pb-3 sm:px-6 sm:pt-24 lg:px-8">
        <AssistantChat />
      </div>
    </div>
  )
}
