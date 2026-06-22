#!/usr/bin/env node
/**
 * calc-discovered-mqs.mjs
 * Post-processes discovered-journals.ts to set metadata_quality_score per journal
 * based on field completeness rather than the hardcoded 30.
 *
 * Usage: node scripts/calc-discovered-mqs.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dir, '../src/lib/discovered-journals.ts')

// MQS formula for discovered journals
// Max = 20 + 15 + 8 + 10 + 10 + 10 + 12 + 5 + 5 + 5 = 100
function calcMqs({ eissn, pissn, pub, country, web, arts, freq, lic }) {
  let s = 20                 // base
  if (eissn)   s += 15      // has electronic ISSN (primary identifier)
  if (pissn)   s += 8       // has print ISSN
  if (pub)     s += 10      // publisher name present
  if (country) s += 10      // registration country known
  if (web)     s += 10      // homepage URL present
  s += 12                   // DOAJ listed (all discovered journals qualify)
  if (arts > 0) s += 5      // has tracked publications
  if (freq)    s += 5       // publication frequency known
  if (lic)     s += 5       // specific license (not generic 'Open Access')
  return Math.min(s, 100)
}

function extractFields(block) {
  const str = (re) => { const m = block.match(re); return m ? m[1] : '' }
  const num = (re) => { const m = block.match(re); return m ? parseInt(m[1], 10) : 0 }

  const eissn   = str(/issn_online:\s*["']([^"']+)["']/)
  const pissn   = str(/issn_print:\s*["']([^"']+)["']/)
  const pub     = str(/publisher:\s*["']([^"']*)["']/)
  // registration_country is more reliable than country for discovered journals
  const rc      = str(/registration_country:\s*["']([^"']+)["']/)
  const co      = str(/[^_]country:\s*["']([^"']+)["']/)
  const web     = str(/website_url:\s*["']([^"']+)["']/)
  const arts    = num(/article_count:\s*(\d+)/)
  const freq    = str(/frequency:\s*["']([^"']*)["']/)
  const lic     = str(/license:\s*["']([^"']+)["']/)

  return {
    eissn:   eissn.length > 0,
    pissn:   pissn.length > 0,
    pub:     pub.length > 0,
    country: rc.length > 0 || co.length > 0,
    web:     web.length > 0,
    arts,
    freq:    freq.length > 0,
    lic:     lic.length > 0 && lic !== 'Open Access',
  }
}

console.log('Reading discovered-journals.ts…')
const src = readFileSync(FILE, 'utf8')

const BEGIN = '// BEGIN:DISCOVERED_JOURNALS'
const END   = '// END:DISCOVERED_JOURNALS'
const beginIdx = src.indexOf(BEGIN)
const endIdx   = src.indexOf(END)

if (beginIdx === -1 || endIdx === -1) {
  console.error('ERROR: markers not found')
  process.exit(1)
}

const header  = src.slice(0, beginIdx + BEGIN.length)
const section = src.slice(beginIdx + BEGIN.length, endIdx)
const footer  = src.slice(endIdx)

// Split section into individual journal blocks (each block: "  {\n    ...\n  },")
// Split on blank lines that precede a `  {`
const blocks = section.split(/\n(?=\n  \{)/)

let patched = 0
const newBlocks = blocks.map(block => {
  if (!block.includes('metadata_quality_score:')) return block
  const fields = extractFields(block)
  const mqs = calcMqs(fields)
  const updated = block.replace(
    /(\s+metadata_quality_score:\s*)\d+(,)/,
    `$1${mqs}$2`
  )
  if (updated !== block) patched++
  return updated
})

const result = header + newBlocks.join('\n') + footer
writeFileSync(FILE, result, 'utf8')
console.log(`Done — patched metadata_quality_score for ${patched.toLocaleString()} journals`)

// Show score distribution
const dist = {}
newBlocks.forEach(block => {
  const m = block.match(/metadata_quality_score:\s*(\d+)/)
  if (m) { const s = m[1]; dist[s] = (dist[s] ?? 0) + 1 }
})
console.log('Score distribution:')
Object.entries(dist).sort(([a], [b]) => Number(b) - Number(a)).forEach(([s, c]) =>
  console.log(`  ${s.padStart(3)}: ${c.toLocaleString()} journals`)
)
