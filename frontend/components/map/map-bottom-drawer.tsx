"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MAP_WIDE_MIN_QUERY } from "@/lib/citizen-layout"
import { SURFACE_PANEL_SHELL_CLASS } from "@/lib/surface"
import { useCloseOnMediaQuery } from "@/lib/use-close-on-media-query"
import { cn } from "@/lib/utils"

export type MapBottomDrawerTab = Readonly<{
  value: string
  label: string
  icon?: ReactNode
  meta?: ReactNode
  render: (close: () => void) => ReactNode
}>

export function MapBottomDrawer(props: {
  id: string
  title: string
  description: string
  defaultValue: string
  tabs: readonly MapBottomDrawerTab[]
}): ReactNode {
  const { id, title, description, defaultValue, tabs } = props
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultValue)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const drawerEpoch = useCloseOnMediaQuery(close, MAP_WIDE_MIN_QUERY)
  const triggerId = `${id}-trigger`

  return (
    <Drawer
      key={drawerEpoch}
      open={open}
      onOpenChange={(nextOpen) => setOpen(nextOpen)}
      triggerId={triggerId}
      swipeDirection="down"
      showSwipeHandle
    >
      <DrawerTrigger
        id={triggerId}
        ref={triggerRef}
        className={cn(
          SURFACE_PANEL_SHELL_CLASS,
          "fixed inset-x-0 bottom-0 z-20 flex min-h-14 w-full flex-col",
          "border-x-0 border-b-0 px-3 pt-1 pb-[env(safe-area-inset-bottom,0px)]",
          "lg:hidden",
          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
        )}
        aria-label={`${title}. Abrir controles del mapa`}
      >
        <span
          className="mx-auto mb-1 h-1 w-10 shrink-0 bg-muted-foreground/50"
          aria-hidden
        />
        <span className="flex min-h-11 w-full min-w-0 items-center justify-center gap-3 text-center">
          {tabs.map((tab) => (
            <span
              key={tab.value}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-center"
            >
              {tab.icon ? (
                <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5">
                  {tab.icon}
                </span>
              ) : null}
              <span className="min-w-0 truncate text-center font-mono text-[9px] font-semibold tracking-[1.2px] text-muted-foreground uppercase">
                {tab.label}
              </span>
              {tab.meta != null ? (
                <span className="shrink-0 font-mono text-[10px] font-semibold text-foreground tabular-nums">
                  {tab.meta}
                </span>
              ) : null}
            </span>
          ))}
        </span>
      </DrawerTrigger>

      <DrawerContent
        finalFocus={triggerRef}
        overlayClassName="lg:hidden motion-reduce:transition-none"
        viewportClassName="lg:hidden"
        className={cn(
          SURFACE_PANEL_SHELL_CLASS,
          "max-h-[min(70dvh,40rem)] lg:hidden",
          "[--drawer-content-max-height:min(70dvh,40rem)]",
          "border-x-0 border-b-0 p-0 pb-[env(safe-area-inset-bottom,0px)]",
          "motion-reduce:transition-none"
        )}
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(String(value))}
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex min-h-14 shrink-0 items-center justify-center border-b border-border px-2">
            <TabsList
              variant="line"
              data-base-ui-swipe-ignore
              className="min-h-11 w-full min-w-0 justify-center gap-1 overflow-x-auto p-0"
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-h-11 min-w-11 flex-1 justify-center px-3 py-2"
                >
                  {tab.icon ? (
                    <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-3.5">
                      {tab.icon}
                    </span>
                  ) : null}
                  <span>{tab.label}</span>
                  {tab.meta != null ? (
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      {tab.meta}
                    </span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                keepMounted={false}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                {tab.render(close)}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}
