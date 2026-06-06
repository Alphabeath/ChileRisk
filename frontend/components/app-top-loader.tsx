"use client"

import nprogress from "nprogress"
import { useEffect } from "react"

export const TOP_LOADER_COLOR = "#e53e3e"
const TOP_LOADER_HEIGHT = 3
const TOP_LOADER_Z = 9999

/** nprogress styles + config only (no link/history hooks — bridge owns start/done). */
export function AppTopLoader() {
  useEffect(() => {
    nprogress.configure({
      showSpinner: false,
      trickle: true,
      trickleSpeed: 200,
      minimum: 0.08,
      easing: "ease",
      speed: 200,
      template:
        '<div class="bar" role="bar"><div class="peg"></div></div>',
    })

    const shadow = `box-shadow:0 0 10px ${TOP_LOADER_COLOR},0 0 5px #fc8181`
    const style = document.createElement("style")
    style.textContent = `#nprogress{pointer-events:none}#nprogress .bar{background:${TOP_LOADER_COLOR};position:fixed;z-index:${TOP_LOADER_Z};top:0;left:0;width:100%;height:${TOP_LOADER_HEIGHT}px}#nprogress .peg{display:block;position:absolute;right:0;width:100px;height:100%;${shadow};opacity:1;-webkit-transform:rotate(3deg) translate(0px,-4px);-ms-transform:rotate(3deg) translate(0px,-4px);transform:rotate(3deg) translate(0px,-4px)}#nprogress .spinner{display:none}`
    document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [])

  return null
}