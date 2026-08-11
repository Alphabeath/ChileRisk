import { ExternalLink } from "lucide-react"

import type {
  SimulacroBodyBlock,
  SimulacroBodyLink,
  SimulacroDetail,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type ContentGroup = {
  kind: "content"
  headings: string[]
  blocks: SimulacroBodyBlock[]
}

type BodyGroup =
  | ContentGroup
  | { kind: "action"; headings: string[]; block: SimulacroBodyBlock }
  | { kind: "steps"; block: SimulacroBodyBlock }
  | { kind: "callout"; block: SimulacroBodyBlock }
  | { kind: "sae_notice"; block: SimulacroBodyBlock }

export function SimulacroDetailBody({ item }: { item: SimulacroDetail }) {
  const comunas = item.participating_comunas.filter(Boolean)
  const groups = groupBodyBlocks(item.body_blocks ?? [])

  return (
    <div className="bg-background">
      {(item.summary || comunas.length > 0) && (
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
              {item.summary ? (
                <p className="text-base leading-7 text-muted-foreground">
                  {item.summary}
                </p>
              ) : null}
              {comunas.length > 0 ? (
                <div className="border-t border-border pt-5">
                  <p className="font-mono text-[10px] font-semibold tracking-[1.2px] text-foreground uppercase">
                    {comunas.length === 1
                      ? "Comuna participante"
                      : "Comunas participantes"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {comunas.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {groups.map((group, index) => (
        <BodyGroupView key={`body-group-${index}`} group={group} index={index} />
      ))}
    </div>
  )
}

function groupBodyBlocks(
  blocks: readonly SimulacroBodyBlock[],
): BodyGroup[] {
  const groups: BodyGroup[] = []
  let current: ContentGroup | null = null

  const flushContent = () => {
    if (!current) return
    const payload = current.blocks[0]
    if (
      current.headings.length > 0 &&
      current.blocks.length === 1 &&
      payload?.kind === "link_list" &&
      (payload.links?.length ?? 0) > 0
    ) {
      groups.push({
        kind: "action",
        headings: current.headings,
        block: payload,
      })
    } else {
      groups.push(current)
    }
    current = null
  }

  for (const block of blocks) {
    if (block.kind === "heading" && block.title) {
      if (current && current.headings.length > 0 && current.blocks.length === 0) {
        current.headings.push(block.title)
      } else {
        flushContent()
        current = {
          kind: "content",
          headings: [block.title],
          blocks: [],
        }
      }
      continue
    }

    if (
      block.kind === "steps" ||
      block.kind === "callout" ||
      block.kind === "sae_notice"
    ) {
      flushContent()
      groups.push({ kind: block.kind, block })
      continue
    }

    if (!current) {
      current = { kind: "content", headings: [], blocks: [block] }
    } else {
      current.blocks.push(block)
    }
  }
  flushContent()
  return groups
}

function BodyGroupView({
  group,
  index,
}: {
  group: BodyGroup
  index: number
}) {
  if (group.kind === "steps") {
    const items = group.block.items ?? []
    if (items.length === 0) return null
    const headingId = `simulacro-steps-${index}`
    return (
      <section
        className="border-b border-border"
        aria-labelledby={group.block.title ? headingId : undefined}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {group.block.title ? (
              <h2
                id={headingId}
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {group.block.title}
              </h2>
            ) : null}
            <ol className="mt-6 overflow-hidden border border-border bg-card">
              {items.map((step, stepIndex) => (
                <li
                  key={`${index}-step-${stepIndex}`}
                  className="flex gap-4 border-b border-border px-4 py-5 last:border-b-0 sm:gap-5 sm:px-5"
                >
                  <span
                    className="flex min-h-10 w-12 shrink-0 items-center border-l-4 border-[var(--drill-accent)] pl-3 font-mono text-sm font-bold tabular-nums text-foreground"
                    aria-hidden
                  >
                    {String(stepIndex + 1).padStart(2, "0")}
                  </span>
                  <p className="min-w-0 pt-1 text-sm leading-6 text-muted-foreground sm:text-base">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    )
  }

  if (group.kind === "callout" && group.block.text) {
    return (
      <section className="border-b border-border bg-[color-mix(in_oklch,var(--drill-accent)_8%,var(--background))]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-4xl border-l-4 border-[var(--drill-accent)] pl-5">
            {group.block.title ? (
              <p className="font-mono text-[10px] font-semibold tracking-[1.2px] text-foreground uppercase">
                {group.block.title}
              </p>
            ) : null}
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              {group.block.text}
            </p>
            <LinkList links={group.block.links} className="mt-4" />
          </div>
        </div>
      </section>
    )
  }

  if (group.kind === "sae_notice") {
    return (
      <section className="border-b border-border bg-[color-mix(in_oklch,var(--drill-accent)_10%,var(--background))]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-4xl border border-[color-mix(in_oklch,var(--drill-accent)_45%,var(--border))] bg-card p-5 sm:p-6">
            <p className="font-mono text-[10px] font-semibold tracking-[1.2px] text-foreground uppercase">
              {group.block.title ?? "Mensaje SAE"}
            </p>
            {group.block.text ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                {group.block.text}
              </p>
            ) : null}
            <LinkList links={group.block.links} className="mt-4" />
          </div>
        </div>
      </section>
    )
  }

  if (group.kind === "action") {
    return (
      <section className="border-b border-[var(--drill-accent)] bg-[var(--drill-accent)] text-[var(--drill-ink)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-5">
            <GroupHeadings headings={group.headings} action />
            <LinkList links={group.block.links} action />
          </div>
        </div>
      </section>
    )
  }

  if (group.kind === "content") {
    return (
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <GroupHeadings headings={group.headings} />
            {group.blocks.map((block, blockIndex) => (
              <ContentBlock
                key={`${index}-content-${blockIndex}`}
                block={block}
              />
            ))}
          </div>
        </div>
      </section>
    )
  }
  return null
}

function GroupHeadings({
  headings,
  action = false,
}: {
  headings: readonly string[]
  action?: boolean
}) {
  return (
    <>
      {headings.map((heading, index) =>
        index === 0 ? (
          <h2
            key={`heading-${index}`}
            className={cn(
              "text-2xl font-bold tracking-tight sm:text-3xl",
              action ? "text-[var(--drill-ink)]" : "text-foreground",
            )}
          >
            {heading}
          </h2>
        ) : (
          <h3
            key={`heading-${index}`}
            className={cn(
              "text-xl font-bold tracking-tight sm:text-2xl",
              action ? "text-[var(--drill-ink)]" : "text-foreground",
            )}
          >
            {heading}
          </h3>
        ),
      )}
    </>
  )
}

function ContentBlock({ block }: { block: SimulacroBodyBlock }) {
  if (block.kind === "paragraph" && block.text) {
    return (
      <p className="text-base leading-7 text-muted-foreground">{block.text}</p>
    )
  }

  if (block.kind === "link_list" && (block.links?.length ?? 0) > 0) {
    return (
      <div>
        {block.title ? (
          <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {block.title}
          </h3>
        ) : null}
        <LinkList
          links={block.links}
          className={block.title ? "mt-3" : undefined}
        />
      </div>
    )
  }

  return null
}

function LinkList({
  links,
  className,
  action = false,
}: {
  links?: SimulacroBodyLink[] | null
  className?: string
  action?: boolean
}) {
  if (!links?.length) return null
  return (
    <ul className={cn("space-y-2", className)}>
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-11 max-w-full items-center gap-2 border px-4 py-2 text-sm font-semibold tracking-wide whitespace-normal text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              action
                ? "border-[var(--drill-ink)] bg-[var(--drill-ink)] text-[var(--drill-accent)] hover:opacity-90 focus-visible:ring-[var(--drill-ink)]"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            <span>{link.label}</span>
            <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  )
}
