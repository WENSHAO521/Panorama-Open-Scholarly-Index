#!/usr/bin/env node
/**
 * build-logos.mjs
 *
 * Writes the POSI logo and the marks journals display on their own websites
 * to public/logos/ (described at /logos/):
 *
 *   posi-logo.svg, posi-logo-white.svg        the logo: mark and name
 *   posi-mark.svg                             the square mark alone
 *   posi-indexed[-dark|-mono].svg             horizontal mark, any indexed journal
 *   posi-indexed-stacked[-dark].svg           stacked mark, any indexed journal
 *   posi-core[-dark|-mono].svg                horizontal mark, Core Collection only
 *   posi-core-stacked[-dark].svg              stacked mark, Core Collection only
 *
 * Indexed marks carry a light grey panel; Core Collection marks a navy panel
 * and band, so the two read differently at a glance. Every journal mark
 * carries the site address, where the journal's status can be checked.
 *
 * Text is converted to outlines from the bundled IBM Plex Sans (SIL OFL), so
 * the files render identically on any website, whatever fonts it loads. PNG
 * copies (2x) sit beside each SVG; they are rendered from these SVGs and must
 * be re-rendered whenever a design here changes.
 *
 * Usage: node scripts/build-logos.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fontkitModule from '@pdf-lib/fontkit'

const fontkit = fontkitModule.default ?? fontkitModule
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/logos')
const loadFont = f => fontkit.create(readFileSync(join(ROOT, 'src/assets/fonts', f)))
const SEMIBOLD = loadFont('IBMPlexSans-SemiBold.ttf')
const REGULAR = loadFont('IBMPlexSans-Regular.ttf')

const C = {
  ink: '#13171c', muted: '#59636e', line: '#d3d8de', panel: '#eef1f4', white: '#ffffff',
  navy: '#1c4f8f', navyTint: '#b7c8de', red: '#e30613', dark: '#141a21', darkPanel: '#232b35', darkMuted: '#9ba6b2',
}
const NAME = 'Panorama Open Scholarly Index'
const SITE = 'posi.panorama-sg.com'

const r = n => Math.round(n * 100) / 100

/** Laid-out text: its width, and a function drawing it at (x, baseline). */
function text(str, { size, font = SEMIBOLD, tracking = 0 }) {
  const run = font.layout(str)
  const k = size / font.unitsPerEm
  const advances = run.positions.map(p => p.xAdvance * k + tracking)
  const width = advances.reduce((s, a) => s + a, 0) - tracking
  const draw = (x, y, fill) => {
    let pen = x
    const paths = run.glyphs.map((g, i) => {
      const d = g.path.toSVG()
      const at = pen
      pen += advances[i]
      return d ? `<path transform="translate(${r(at)} ${r(y)}) scale(${+k.toFixed(6)} ${-k.toFixed(6)})" d="${d}"/>` : ''
    }).join('')
    return `<g fill="${fill}">${paths}</g>`
  }
  return { width, draw }
}

/** The square mark (as src/app/icon.svg) in a size x size box. */
function mark(x, y, size, ink, red = C.red) {
  const u = size / 64
  const sq = (px, py, w, h, c) => `<rect x="${r(x + px * u)}" y="${r(y + py * u)}" width="${r(w * u)}" height="${r(h * u)}" fill="${c}"/>`
  return sq(7, 7, 22, 22, ink) + sq(35, 7, 22, 22, red) + sq(7, 35, 22, 22, ink) + sq(35, 35, 22, 7, ink)
}

function svg(width, height, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r(width)}" height="${r(height)}" viewBox="0 0 ${r(width)} ${r(height)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`
}

function logo(ink) {
  const name = text(NAME, { size: 22 })
  return svg(58 + name.width + 2, 48, mark(0, 0, 48, ink) + name.draw(58, 32, ink), NAME)
}

// Horizontal mark: a square panel holding the POSI mark, then three lines of
// type — the status, the index's name, the address.
function horizontal({ label, theme, title }) {
  const H = 64
  const P = 64
  const pad = 14
  const lab = text(label, { size: 8.5, tracking: 1.5 })
  const name = text(NAME, { size: 13.5 })
  const site = text(SITE, { size: 8.5, font: REGULAR, tracking: 0.2 })
  const W = P + pad + Math.max(lab.width, name.width, site.width) + pad
  const t = theme
  const body =
    `<rect x="0.5" y="0.5" width="${r(W - 1)}" height="${H - 1}" rx="3" fill="${t.bg}" stroke="${t.border}"/>` +
    `<path d="M3.5 0.5H${P}V${H - 0.5}H3.5A3 3 0 0 1 0.5 ${H - 3.5}V3.5A3 3 0 0 1 3.5 0.5Z" fill="${t.panel}" stroke="${t.border}"/>` +
    mark((P - 34) / 2, (H - 34) / 2, 34, t.markInk, t.markRed) +
    lab.draw(P + pad, 22, t.label) + name.draw(P + pad, 39.5, t.name) + site.draw(P + pad, 53, t.site)
  return svg(W, H, body, title)
}

// Stacked mark: the POSI mark over the name, above a band naming the status.
function stacked({ band, theme, title }) {
  const W = 168
  const H = 172
  const Bh = 38
  const t = theme
  const l1 = text('Panorama Open', { size: 14.5 })
  const l2 = text('Scholarly Index', { size: 14.5 })
  const site = text(SITE, { size: 8.5, font: REGULAR, tracking: 0.2 })
  const b = text(band, { size: 9, tracking: 1.8 })
  const cx = w => (W - w) / 2
  const body =
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="3" fill="${t.bg}" stroke="${t.border}"/>` +
    `<path d="M0.5 ${H - Bh}H${W - 0.5}V${H - 3.5}A3 3 0 0 1 ${W - 3.5} ${H - 0.5}H3.5A3 3 0 0 1 0.5 ${H - 3.5}Z" fill="${t.band}" stroke="${t.border}"/>` +
    mark((W - 44) / 2, 16, 44, t.stackMarkInk ?? t.markInk, t.markRed) +
    l1.draw(cx(l1.width), 84, t.name) + l2.draw(cx(l2.width), 102, t.name) + site.draw(cx(site.width), 120, t.site) +
    b.draw(cx(b.width), H - Bh / 2 + 3.2, t.bandText)
  return svg(W, H, body, title)
}

const INDEXED = { bg: C.white, border: C.line, panel: C.panel, markInk: C.ink, markRed: C.red, label: C.muted, name: C.ink, site: C.muted, band: C.panel, bandText: C.ink }
const INDEXED_DARK = { bg: C.dark, border: C.dark, panel: C.darkPanel, markInk: C.white, markRed: C.red, label: C.darkMuted, name: C.white, site: C.darkMuted, band: C.darkPanel, bandText: C.white }
// The stacked mark sits on the card, not the navy panel, so it keeps the ink squares.
const CORE = { bg: C.white, border: C.navy, panel: C.navy, markInk: C.white, stackMarkInk: C.ink, markRed: C.red, label: C.navy, name: C.ink, site: C.muted, band: C.navy, bandText: C.white }
const CORE_DARK = { bg: C.navy, border: C.navy, panel: '#153e72', markInk: C.white, markRed: C.red, label: C.navyTint, name: C.white, site: C.navyTint, band: '#153e72', bandText: C.white }
const MONO = { bg: C.white, border: C.ink, panel: C.ink, markInk: C.white, markRed: C.white, label: C.ink, name: C.ink, site: C.ink }

const INDEXED_TITLE = `Indexed in the ${NAME}`
const CORE_TITLE = `${NAME} Core Collection`

const files = {
  'posi-logo.svg': logo(C.ink),
  'posi-logo-white.svg': logo(C.white),
  'posi-mark.svg': svg(64, 64, mark(0, 0, 64, '#111111'), 'POSI'),
  'posi-indexed.svg': horizontal({ label: 'INDEXED IN', theme: INDEXED, title: INDEXED_TITLE }),
  'posi-indexed-dark.svg': horizontal({ label: 'INDEXED IN', theme: INDEXED_DARK, title: INDEXED_TITLE }),
  'posi-indexed-mono.svg': horizontal({ label: 'INDEXED IN', theme: MONO, title: INDEXED_TITLE }),
  'posi-indexed-stacked.svg': stacked({ band: 'INDEXED JOURNAL', theme: INDEXED, title: INDEXED_TITLE }),
  'posi-indexed-stacked-dark.svg': stacked({ band: 'INDEXED JOURNAL', theme: INDEXED_DARK, title: INDEXED_TITLE }),
  'posi-core.svg': horizontal({ label: 'CORE COLLECTION', theme: CORE, title: CORE_TITLE }),
  'posi-core-dark.svg': horizontal({ label: 'CORE COLLECTION', theme: CORE_DARK, title: CORE_TITLE }),
  'posi-core-mono.svg': horizontal({ label: 'CORE COLLECTION', theme: MONO, title: CORE_TITLE }),
  'posi-core-stacked.svg': stacked({ band: 'CORE COLLECTION', theme: CORE, title: CORE_TITLE }),
  'posi-core-stacked-dark.svg': stacked({ band: 'CORE COLLECTION', theme: CORE_DARK, title: CORE_TITLE }),
}

mkdirSync(OUT, { recursive: true })
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content)
  console.log(`build-logos: ${name} (${(content.length / 1024).toFixed(1)} KB)`)
}
