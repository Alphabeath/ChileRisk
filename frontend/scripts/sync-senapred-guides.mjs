/**
 * One-shot vendor: senapred.cl/recomendaciones → frontend/data/senapred/*.json
 * + images under frontend/public/data/senapred/img/<slug>/.
 *
 * Dep-free (Bun fetch + regex over Elementor HTML). Re-run to refresh the
 * snapshot, then commit the diff.
 *
 *   cd frontend && bun run sync:senapred
 */
import { mkdir, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const FRONTEND_DIR = join(dirname(fileURLToPath(import.meta.url)), "..")
const DATA_DIR = join(FRONTEND_DIR, "data", "senapred")
const IMG_ROOT = join(FRONTEND_DIR, "public", "data", "senapred", "img")

const HEADERS = { "User-Agent": "Mozilla/5.0" }

/**
 * Source pages. Slugs are the canonical frontend URLs (`/desastres/<slug>`).
 * `materiales-peligrosos` points at `-2/` directly: the base URL serves a
 * meta-refresh interstitial.
 */
const PAGES = [
  { group: "preparate", slug: "aluviones", url: "https://senapred.cl/aluviones/", title: "Aluviones" },
  { group: "preparate", slug: "calor-extremo", url: "https://senapred.cl/calor-extremo/", title: "Calor intenso o extremo" },
  { group: "preparate", slug: "deslizamientos", url: "https://senapred.cl/deslizamientos/", title: "Deslizamientos" },
  { group: "preparate", slug: "enos", url: "https://senapred.cl/enos/", title: "ENOS – El Niño y La Niña" },
  { group: "preparate", slug: "erupciones-volcanicas", url: "https://senapred.cl/erupciones-volcanicas/", title: "Erupciones Volcánicas" },
  {
    group: "preparate",
    slug: "excursion-en-montana-o-zonas-cordilleranas",
    url: "https://senapred.cl/excursion-en-montana-o-zonas-cordilleranas/",
    title: "Excursión en Montaña o Zonas Cordilleranas",
  },
  { group: "preparate", slug: "heladas", url: "https://senapred.cl/heladas", title: "Heladas" },
  { group: "preparate", slug: "humo-de-incendio-forestal", url: "https://senapred.cl/humo-de-incendio-forestal/", title: "Humo de Incendios Forestales" },
  { group: "preparate", slug: "incendios-estructurales", url: "https://senapred.cl/incendios-estructurales", title: "Incendios Estructurales" },
  { group: "preparate", slug: "incendios-forestales", url: "https://senapred.cl/incendios-forestales/", title: "Incendios Forestales" },
  { group: "preparate", slug: "inundaciones", url: "https://senapred.cl/inundaciones", title: "Inundaciones" },
  { group: "preparate", slug: "invierno", url: "https://senapred.cl/invierno/", title: "Invierno" },
  { group: "preparate", slug: "invierno-zona-austral", url: "https://senapred.cl/invierno-zona-austral/", title: "Invierno – Zona Austral" },
  { group: "preparate", slug: "marejadas", url: "https://senapred.cl/marejadas", title: "Marejadas" },
  { group: "preparate", slug: "materiales-peligrosos", url: "https://senapred.cl/materiales-peligrosos-2/", title: "Materiales Peligrosos" },
  { group: "preparate", slug: "nevadas", url: "https://senapred.cl/nevadas/", title: "Nevadas" },
  {
    group: "preparate",
    slug: "precipitaciones-estivales-altiplanicas",
    url: "https://senapred.cl/precipitaciones-estivales-altiplanicas/",
    title: "Precipitaciones Estivales Altiplánicas",
  },
  { group: "preparate", slug: "sismos", url: "https://senapred.cl/sismos", title: "Sismos" },
  { group: "preparate", slug: "tormenta-de-polvo-2", url: "https://senapred.cl/tormenta-de-polvo-2/", title: "Tormenta de Polvo" },
  { group: "preparate", slug: "tormentas-electricas", url: "https://senapred.cl/tormentas-electricas", title: "Tormentas Eléctricas" },
  { group: "preparate", slug: "tornado-trombas-marinas", url: "https://senapred.cl/tornado-trombas-marinas/", title: "Tornados – Trombas Marinas" },
  { group: "preparate", slug: "tsunami", url: "https://senapred.cl/tsunami/", title: "Tsunami" },
  { group: "inclusiva", slug: "dimension-animal", url: "https://senapred.cl/dimension-animal/", title: "Protección Animal" },
  { group: "inclusiva", slug: "enfoque-de-genero", url: "https://senapred.cl/enfoque-de-genero/", title: "Enfoque de Género" },
  { group: "inclusiva", slug: "lactancia-en-emergencia", url: "https://senapred.cl/lactancia-en-emergencia/", title: "Lactancia en Emergencia" },
]

const NAMED_ENTITIES = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  ndash: "\u2013",
  mdash: "\u2014",
  hellip: "\u2026",
  laquo: "\u00ab",
  raquo: "\u00bb",
  iexcl: "\u00a1",
  iquest: "\u00bf",
  deg: "\u00b0",
}

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m)
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function truncateBlurb(text) {
  if (text.length <= 160) return text
  const cut = text.slice(0, 160)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : 160).trim()}…`
}

/**
 * WordPress safelinks redirect PDFs through Outlook:
 * …/?url=<encoded>&amp;data=… → decode the `url` param to the real PDF.
 */
function normalizeHref(href) {
  if (!href.includes("safelinks.protection.outlook.com")) return href
  const m = href.match(/[?&]url=([^&]+)/)
  if (!m) return href
  try {
    return decodeURIComponent(decodeEntities(m[1]))
  } catch {
    return href
  }
}

/** Resolve a meta-refresh interstitial once (e.g. /materiales-peligrosos/). */
async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  let body = await res.text()
  if (body.includes('http-equiv="refresh"')) {
    const m = body.match(/url=([^"']+)["']/)
    if (m) {
      const next = new URL(m[1], url).toString()
      console.log(`  ↪ meta-refresh → ${next}`)
      const res2 = await fetch(next, { headers: HEADERS })
      if (!res2.ok) throw new Error(`HTTP ${res2.status} for ${next}`)
      body = await res2.text()
    }
  }
  return body
}

/**
 * Content region: the `data-elementor-type="wp-page"` Elementor tree up to
 * `</body>`. (The footer template precedes the page content in document
 * order, so header/footer markers are NOT usable bounds.)
 */
function extractRegion(html) {
  const marker = html.indexOf('data-elementor-type="wp-page"')
  if (marker === -1) throw new Error("no wp-page element — layout changed?")
  const start = html.lastIndexOf("<div", marker)
  let end = html.indexOf("</body>", start)
  if (end === -1) throw new Error("no </body> after wp-page — layout changed?")
  // Some templates place the <footer> AFTER the wp-page tree (dimension-animal,
  // enfoque-de-genero, lactancia) — stop there so footer nav never leaks in.
  const footer = html.indexOf("<footer", start)
  if (footer !== -1 && footer < end) end = footer
  return html.slice(start, end)
}

function findWidgets(region) {
  const widgets = []
  for (const m of region.matchAll(
    /elementor-widget elementor-widget-(heading|text-editor|image|button|theme-site-logo)\b/g,
  )) {
    widgets.push({ type: m[1], idx: m.index })
  }
  widgets.sort((a, b) => a.idx - b.idx)
  // Skip the site-logo variant (header/footer chrome).
  return widgets.filter((w) => w.type !== "theme-site-logo")
}

function parseHeading(chunk) {
  const m = chunk.match(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/)
  if (!m) return null
  return { level: Number(m[1]), text: stripTags(m[2]) }
}

function parseText(chunk) {
  const container = chunk.match(/elementor-widget-container">([\s\S]*?)<\/div>/)
  const body = container ? container[1] : chunk
  const paragraphs = []
  const links = []
  for (const m of body.matchAll(/<(p|ul)[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (m[1] === "p") {
      const anchors = [...m[2].matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      if (anchors.length > 0 && stripTags(m[2].replace(/<a[\s\S]*?<\/a>/g, "")).length === 0) {
        for (const a of anchors) {
          const label = stripTags(a[2])
          if (label) links.push({ label, href: normalizeHref(decodeEntities(a[1])) })
        }
        continue
      }
      const text = stripTags(m[2])
      if (text) paragraphs.push(text)
    } else {
      const bullets = []
      for (const li of m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
        const text = stripTags(li[1])
        if (text) bullets.push(text)
      }
      if (bullets.length > 0) paragraphs.push({ bullets })
    }
  }
  return { paragraphs, links }
}

function parseImage(chunk) {
  const m = chunk.match(/<img[^>]+src="(https:\/\/media\.senapred\.cl[^"]+)"[^>]*>/)
  if (!m) return null
  const alt = chunk.match(/alt="([^"]*)"/)
  return { src: m[1], alt: alt ? decodeEntities(alt[1]) : "" }
}

function parseButton(chunk) {
  const m = chunk.match(/<a[^>]+class="elementor-button[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
  if (!m) return null
  let label = stripTags(m[2])
  if (!label) label = "Descargar"
  return { label, href: normalizeHref(decodeEntities(m[1])) }
}

/** Step icons: SENAPRED reuses the `-150x150`/`icon` naming for its pictograms. */
function isStepIcon(src) {
  const name = src.split("/").pop() ?? ""
  return /icon/i.test(name) || /-150x150/.test(name)
}

/**
 * Section/column background images: Elementor attaches them via
 * `elementor-frontend-inline-css` rules (`.elementor-element-<hash>{…background-image:url(…)}`),
 * NOT <img> tags, so findWidgets misses them. Map each rule's hash to the
 * element's `data-id` inside the page region; the element start index places
 * the image in the block flow. Non-region (header/footer) elements are skipped.
 */
function parseBackgrounds(html, region) {
  const style = html.match(/<style id="elementor-frontend-inline-css">([\s\S]*?)<\/style>/)
  if (!style) return []
  const out = []
  const seen = new Set()
  for (const rule of style[1].matchAll(/([^{}]*)\{([^}]*background-image\s*:\s*url\(["']?([^)"']+)[^}]*)\}/g)) {
    const src = rule[3]
    if (!src.startsWith("https://media.senapred.cl")) continue
    const hash = rule[1].match(/elementor-element-([a-f0-9]+)/)
    if (!hash) continue
    const idx = region.indexOf(`data-id="${hash[1]}"`)
    if (idx === -1 || seen.has(src)) continue
    seen.add(src)
    out.push({ src, idx })
  }
  return out.sort((a, b) => a.idx - b.idx)
}

async function processPage(page, warnings) {
  const html = await fetchHtml(page.url)
  let region
  try {
    region = extractRegion(html)
  } catch (err) {
    throw new Error(`${page.slug}: ${err.message}`)
  }
  const widgetStarts = findWidgets(region)
  // Section/column backgrounds (CSS rules, not <img> tags) merge into the
  // widget flow at their element position.
  const events = [
    ...widgetStarts.map((w) => ({ ...w, kind: "widget" })),
    ...parseBackgrounds(html, region).map((b) => ({ kind: "background", idx: b.idx, src: b.src })),
  ].sort((a, b) => a.idx - b.idx || (a.kind === "widget" ? -1 : 1))
  const parsed = []
  for (let i = 0; i < events.length; i++) {
    const w = events[i]
    if (w.kind === "background") {
      parsed.push({ widget: "background", src: w.src })
      continue
    }
    const chunk = region.slice(w.idx, events[i + 1]?.idx ?? region.length)
    if (w.type === "heading") {
      const h = parseHeading(chunk)
      if (h) parsed.push({ widget: "heading", ...h })
    } else if (w.type === "text-editor") {
      const t = parseText(chunk)
      if (t.paragraphs.length > 0 || t.links.length > 0) parsed.push({ widget: "text", ...t })
    } else if (w.type === "image") {
      const img = parseImage(chunk)
      if (img) parsed.push({ widget: "image", ...img })
    } else if (w.type === "button") {
      const btn = parseButton(chunk)
      if (btn) parsed.push({ widget: "button", ...btn })
    }
  }

  // Assemble sections. h2 opens a section (first h2 is the page title),
  // h3+ becomes a subheading block.
  const sections = []
  const intro = []
  let current = null
  let seenTitle = false

  const pushBlocks = (blocks) => {
    if (current) current.blocks.push(...blocks)
    else intro.push(...blocks)
  }

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i]
    if (item.widget === "heading") {
      if (item.level === 2) {
        if (!seenTitle) {
          seenTitle = true // page title h2 — skip, title comes from PAGES
          current = null
        } else if (item.text.toLowerCase().trim() === "prepárate con senapred") {
          // Trailer nav section → drop it and everything after.
          break
        } else {
          current = { heading: item.text, blocks: [] }
          sections.push(current)
        }
      } else {
        pushBlocks([{ kind: "subheading", text: item.text }])
      }
      continue
    }
    if (item.widget === "background") {
      pushBlocks([{ kind: "background", src: item.src }])
      continue
    }
    if (item.widget === "image") {
      const next = parsed[i + 1]
      if (isStepIcon(item.src) && next && next.widget === "text" && next.paragraphs.length > 0) {
        // Icon + caption pair: merge into a step block, skip the caption widget.
        const caption = next.paragraphs[0]
        const text = typeof caption === "string" ? caption : (caption.bullets ?? []).join(" ")
        pushBlocks([{ kind: "step", icon: item.src, text }])
        i++
      } else {
        pushBlocks([{ kind: "figure", src: item.src, alt: item.alt }])
      }
      continue
    }
    if (item.widget === "button") {
      // Coalesce consecutive buttons into one links block.
      const items = [item]
      while (parsed[i + 1]?.widget === "button") items.push(parsed[++i])
      pushBlocks([{ kind: "links", items: items.map((b) => ({ label: b.label, href: b.href })) }])
      continue
    }
    if (item.widget === "text") {
      if (item.links.length > 0) {
        pushBlocks([{ kind: "links", items: item.links }])
      }
      if (item.paragraphs.length > 0) {
        pushBlocks([
          {
            kind: "text",
            paragraphs: item.paragraphs.map((p) => (typeof p === "string" ? { text: p } : { bullets: p.bullets })),
          },
        ])
      }
    }
  }

  // dimension-animal has no heading widgets at all (title is a banner image) —
    // title comes from the PAGES constant, so a missing h2 is fine; the first
    // heading found is treated as the page title when present.

  // Download referenced images into public/data/senapred/img/<slug>/ and
  // rewrite srcs to the local path.
  const imgDir = join(IMG_ROOT, page.slug)
  await rm(imgDir, { recursive: true, force: true })
  await mkdir(imgDir, { recursive: true })
  const seenUrls = new Set()
  const remap = new Map()

  const collectSrc = (src) => {
    if (!src || seenUrls.has(src)) return
    seenUrls.add(src)
    const basename = src.split("/").pop()?.split("?")[0]
    if (!basename) return
    remap.set(src, `/data/senapred/img/${page.slug}/${basename}`)
  }

  const walkBlocks = (blocks, fn) => {
    for (const b of blocks) {
      if (b.kind === "step") fn(b, "icon")
      else if (b.kind === "figure") fn(b, "src")
      else if (b.kind === "background") fn(b, "src")
    }
  }
  walkBlocks(intro, (b, key) => collectSrc(b[key]))
  for (const s of sections) walkBlocks(s.blocks, (b, key) => collectSrc(b[key]))

  let downloaded = 0
  await Promise.all(
    [...remap.entries()].map(async ([remote, local]) => {
      const dest = join(FRONTEND_DIR, "public", local)
      try {
        const res = await fetch(remote, { headers: HEADERS })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        await writeFile(dest, Buffer.from(await res.arrayBuffer()))
        downloaded++
      } catch (err) {
        warnings.push(`${page.slug}: image failed (${remote}) — ${err.message}`)
        remap.delete(remote) // keep the remote URL in the JSON
      }
    }),
  )

  const remapBlock = (b) => {
    if (b.kind === "step" && remap.has(b.icon)) return { ...b, icon: remap.get(b.icon) }
    if (b.kind === "figure" && remap.has(b.src)) return { ...b, src: remap.get(b.src) }
    if (b.kind === "background" && remap.has(b.src)) return { ...b, src: remap.get(b.src) }
    return b
  }

  const firstText = (() => {
    for (const b of intro) {
      if (b.kind === "text") {
        for (const p of b.paragraphs) if (p.text) return p.text
      }
    }
    for (const s of sections) {
      for (const b of s.blocks) {
        if (b.kind === "text") {
          for (const p of b.paragraphs) if (p.text) return p.text
        }
      }
      break
    }
    return page.title
  })()

  const guide = {
    slug: page.slug,
    group: page.group,
    title: page.title,
    sourceUrl: page.url,
    blurb: truncateBlurb(firstText),
    intro: intro.map(remapBlock),
    sections: sections.map((s) => ({ heading: s.heading, blocks: s.blocks.map(remapBlock) })),
  }
  await writeFile(join(DATA_DIR, `${page.slug}.json`), `${JSON.stringify(guide, null, 2)}\n`)
  return downloaded
}

/**
 * Catalog cards: senapred.cl/recomendaciones → one `cardImage` per guide.
 * Each card is an <a> wrapping a media.senapred.cl <img> (382×187). The href,
 * slashes stripped, IS the guide slug. Downloads to
 * public/data/senapred/img/catalog/<slug>.<ext> and merges `cardImage`
 * (local path) into each guide JSON; the index rebuild picks it up. A failed
 * card leaves the field absent — the frontend falls back to its icon.
 */
async function processCatalog(warnings) {
  let region
  try {
    region = extractRegion(await fetchHtml("https://senapred.cl/recomendaciones/"))
  } catch (err) {
    warnings.push(`recomendaciones: ${err.message}`)
    return
  }

  const slugSet = new Set(PAGES.map((p) => p.slug))
  const bySlug = new Map() // slug → remote URL (first card per slug wins)
  for (const m of region.matchAll(/<a[^>]+href="(\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const img = m[2].match(/<img[^>]+src="(https:\/\/media\.senapred\.cl[^"]+)"/)
    if (!img) continue
    const slug = m[1].replace(/^\/+|\/+$/g, "")
    if (!slugSet.has(slug)) {
      warnings.push(`recomendaciones: card \`/${slug}/\` sin guía local — omitida`)
      continue
    }
    if (!bySlug.has(slug)) bySlug.set(slug, img[1])
  }

  const catalogDir = join(IMG_ROOT, "catalog")
  await mkdir(catalogDir, { recursive: true })
  const seenUrls = new Set()
  const results = new Map() // slug → local path (only on success)

  await Promise.all(
    [...bySlug.entries()].map(async ([slug, remote]) => {
      if (seenUrls.has(remote)) return // dedupe por URL: gana la primera card
      seenUrls.add(remote)
      const name = remote.split("/").pop()?.split("?")[0] ?? ""
      const ext = name.match(/\.([a-zA-Z0-9]+)$/)?.[1]
      if (!ext) {
        warnings.push(`recomendaciones: ${slug}: extensión desconocida — ${remote}`)
        return
      }
      const local = `/data/senapred/img/catalog/${slug}.${ext}`
      const dest = join(FRONTEND_DIR, "public", local)
      try {
        const res = await fetch(remote, { headers: HEADERS })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        await writeFile(dest, Buffer.from(await res.arrayBuffer()))
        results.set(slug, local)
      } catch (err) {
        warnings.push(`recomendaciones: ${slug}: imagen falló (${remote}) — ${err.message}`)
      }
    }),
  )

  // Merge cardImage into each guide JSON (absent if the download failed).
  let merged = 0
  await Promise.all(
    [...results.entries()].map(async ([slug, local]) => {
      const file = join(DATA_DIR, `${slug}.json`)
      try {
        const guide = JSON.parse(await Bun.file(file).text())
        guide.cardImage = local
        await writeFile(file, `${JSON.stringify(guide, null, 2)}\n`)
        merged++
      } catch (err) {
        warnings.push(`recomendaciones: ${slug}: no se pudo mergear cardImage — ${err.message}`)
      }
    }),
  )
  console.log(`✓ catálogo: ${results.size} imágenes · ${merged} cardImage en JSON`)
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true })
  await mkdir(IMG_ROOT, { recursive: true })
  const warnings = []
  let pages = 0
  let images = 0

  for (const page of PAGES) {
    try {
      const n = await processPage(page, warnings)
      pages++
      images += n
      console.log(`✓ ${page.slug} (${n} imágenes)`)
    } catch (err) {
      warnings.push(`${page.slug}: ${err.message}`)
      console.error(`✗ ${page.slug}: ${err.message}`)
    }
  }

  // Catalog cards → cardImage (after guides so the JSONs exist).
  await processCatalog(warnings)

  // index.json in PAGES order (missing pages are skipped, not fabricated).
  const index = []
  for (const page of PAGES) {
    try {
      const guide = JSON.parse(await Bun.file(join(DATA_DIR, `${page.slug}.json`)).text())
      index.push({ slug: guide.slug, title: guide.title, blurb: guide.blurb, group: guide.group, cardImage: guide.cardImage })
    } catch {
      /* failed page — excluded */
    }
  }
  await writeFile(join(DATA_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`)

  console.log(`\n${pages}/${PAGES.length} páginas · ${images} imágenes descargadas · ${warnings.length} warnings`)
  for (const w of warnings) console.warn(`  ⚠ ${w}`)
  if (pages < PAGES.length) process.exit(1)
}

main()
