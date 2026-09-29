#!/usr/bin/env node
/**
 * set-html-lang.mjs — runs after every build (npm "postbuild").
 *
 * The root layout renders <html lang="en">; the localized pages under
 * out/<prefix>/ (/ja/, /ko/, /zh-cn/, /zh-tw/) are in another language.
 * In the browser an inline script corrects the attribute before first
 * paint; this writes it into the static HTML too, for readers and
 * crawlers without JavaScript. The prefixes and tags are read from
 * src/lib/i18n/locales.ts, the one list of interface languages.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const OUT = 'out'
if (!existsSync(OUT)) { console.log('set-html-lang: no out/ directory, skipped'); process.exit(0) }

const src = readFileSync('src/lib/i18n/locales.ts', 'utf8')
const locales = [...src.matchAll(/path: '([a-z-]+)', lang: '([A-Za-z-]+)'/g)].map(m => ({ path: m[1], lang: m[2] }))
if (!locales.length) { console.error('set-html-lang: no locales found in src/lib/i18n/locales.ts'); process.exit(1) }

let n = 0
for (const { path, lang } of locales) {
  const dir = join(OUT, path)
  if (!existsSync(dir)) continue
  const walk = d => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.html')) {
        const html = readFileSync(p, 'utf8')
        const fixed = html.replace(/<html lang="en"/, `<html lang="${lang}"`)
        if (fixed !== html) { writeFileSync(p, fixed); n++ }
      }
    }
  }
  walk(dir)
}
console.log(`set-html-lang: set lang on ${n} localized page(s)`)
