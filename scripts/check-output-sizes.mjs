#!/usr/bin/env node
/**
 * check-output-sizes.mjs — runs after every build (npm "postbuild").
 *
 * Checks the static export against size budgets, naming each file. Hard
 * limits fail the build, so Cloudflare Pages never refuses the production
 * deploy halfway; the browser budget only warns, so a file that grows a little
 * with new data never blocks a deploy (split it instead, e.g. as the title
 * index does: a {"parts": [...]} stub linking to smaller files):
 *
 *   - any file:                     20 MiB (Pages refuses files over 25 MiB)
 *   - data the pages load in the
 *     browser (BROWSER_DIRS below): 1.5 MiB, warning only, so a page never waits on a
 *                                   large download (JSON compresses ~5-8x
 *                                   in transit)
 *   - file count:                   18,000 (Pages allows 20,000)
 *
 * Data grows with every sync, so budgets are checked on every build rather
 * than once. SIZE_CHECK_WARN_ONLY=1 reports without failing.
 */
import { readdirSync, statSync, existsSync } from 'fs'
import { join, relative } from 'path'

const OUT = 'out'
const MiB = 1024 * 1024
const MAX_FILE = 20 * MiB
const MAX_BROWSER_FILE = 1.5 * MiB
const MAX_FILES = 18_000
// Folders under out/data whose files the site's pages fetch in the browser.
const BROWSER_DIRS = ['data/j', 'data/jt', 'data/journals', 'data/records', 'data/scopus', 'data/pubmed', 'data/meta', 'data/publishers']

if (!existsSync(OUT)) { console.log('check-output-sizes: no out/ directory, skipped'); process.exit(0) }

const files = []
const walk = dir => { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) walk(p); else files.push([relative(OUT, p), statSync(p).size]) } }
walk(OUT)

const fmt = b => `${(b / MiB).toFixed(1)} MiB`
const problems = []
const warnings = []
for (const [path, size] of files) {
  const browser = BROWSER_DIRS.some(d => path.startsWith(d + '/'))
  if (size > MAX_FILE) problems.push(`${path} is ${fmt(size)} (limit ${fmt(MAX_FILE)} for any file)`)
  else if (browser && size > MAX_BROWSER_FILE) warnings.push(`${path} is ${fmt(size)} (budget ${fmt(MAX_BROWSER_FILE)} for data loaded by pages)`)
}
if (files.length > MAX_FILES) problems.push(`${files.length} files (limit ${MAX_FILES}; Cloudflare Pages allows 20,000)`)

const largest = [...files].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, s]) => `${p} ${fmt(s)}`).join(', ')
console.log(`check-output-sizes: ${files.length} files; largest: ${largest}`)
for (const w of warnings) console.warn(`check-output-sizes: warning: ${w}`)
if (problems.length) {
  for (const p of problems) console.error(`check-output-sizes: ${p}`)
  if (process.env.SIZE_CHECK_WARN_ONLY !== '1') {
    console.error('check-output-sizes: split these files (see the route that builds them) or raise the budget deliberately')
    process.exit(1)
  }
}
