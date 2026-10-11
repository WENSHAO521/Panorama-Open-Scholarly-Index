#!/usr/bin/env node
/**
 * append-alias-redirects.mjs (postbuild)
 *
 * When the discovered journals come from the data layer, a journal the old directory listed under two
 * codes keeps one; the other code's URL redirects to it. The aliases are written by sync-live-data.mjs
 * to src/lib/generated/discovered-aliases.json; this adds them to out/_redirects (Cloudflare Pages).
 * Nothing to do when that file is absent.
 */
import { existsSync, readFileSync, appendFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const aliasFile = join(ROOT, 'src/lib/generated/discovered-aliases.json')
const target = join(ROOT, 'out/_redirects')
if (!existsSync(aliasFile) || !existsSync(target)) process.exit(0)
const aliases = JSON.parse(readFileSync(aliasFile, 'utf-8'))
const lines = Object.entries(aliases).map(([from, to]) => `/journal/${from}/ /journal/${to}/ 301`)
if (lines.length) appendFileSync(target, `\n# Journals the old directory held under two codes\n${lines.join('\n')}\n`)
console.log(`append-alias-redirects: ${lines.length} redirects`)
