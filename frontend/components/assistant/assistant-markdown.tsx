"use client"

import Link from "next/link"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

function isInternalHref(href: string | undefined): href is string {
  if (!href) return false
  return href.startsWith("/") && !href.startsWith("//")
}

const components: Components = {
  p: ({ children }) => (
    <p className="my-0 leading-relaxed text-white/85 [&:not(:first-child)]:mt-3">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-white/90">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 text-white/85">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 flex list-decimal flex-col gap-1.5 pl-5 text-white/85">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => {
    if (isInternalHref(href)) {
      return (
        <Link
          href={href}
          className="font-medium text-sky-300 underline underline-offset-3 hover:text-white"
        >
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-sky-300 underline underline-offset-3 hover:text-white"
      >
        {children}
      </a>
    )
  },
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"))
    if (isBlock) {
      return (
        <code
          className={cn(
            "block overflow-x-auto rounded-none border border-white/10 bg-slate-950/60 p-3 font-mono text-[12px] text-white/80",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded-none border border-white/10 bg-slate-950/50 px-1 py-0.5 font-mono text-[12px] text-white/80"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-none">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-white/25 pl-3 text-white/65 italic">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-white">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1 text-sm font-semibold tracking-tight text-white">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-3 mb-1 text-sm font-semibold text-white/95">{children}</h4>
  ),
  hr: () => <hr className="my-4 border-white/10" />,
}

export function AssistantMarkdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col text-sm", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
