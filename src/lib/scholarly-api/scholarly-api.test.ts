import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyStatus, isTransient } from './errors.ts'
import { normalizeIssn, isValidIssn, issnConflicts, buildIssnIndex, resolveJournal } from './issn.ts'
import { RegistryError } from '../registries.ts'
import { normalizeDoi, mergeWorks } from './dedupe.ts'

test('status codes map to distinct error classes, never to "not found" by default', () => {
  assert.equal(classifyStatus(0), 'unreachable')
  assert.equal(classifyStatus(429), 'rate-limited')
  assert.equal(classifyStatus(403), 'key-missing')
  assert.equal(classifyStatus(404), 'not-found')
  assert.equal(classifyStatus(503), 'unavailable')
  assert.equal(classifyStatus(418), 'bad-response')
  assert.ok(isTransient('timeout') && !isTransient('not-found') && !isTransient('key-missing'))
})

test('ISSN normalisation and checksum', () => {
  assert.equal(normalizeIssn('0317 8471'), null)
  assert.equal(normalizeIssn('03178471'), '0317-8471')
  assert.equal(normalizeIssn('urn:issn:2434-561x'), '2434-561X')
  assert.ok(isValidIssn('0317-8471'))
  assert.ok(isValidIssn('2434-561X'))
  assert.ok(!isValidIssn('0317-8472'))
})

test('ISSN conflicts: invalid, foreign and swapped print/online are flagged, the verified record is not touched', () => {
  const verified = { print: '0317-8471', electronic: '2434-561X' }
  const snapshot = JSON.stringify(verified)
  assert.deepEqual(issnConflicts(verified, ['0317-8471', '2434-561X']), [])
  assert.deepEqual(issnConflicts(verified, ['0317-8472']), [{ kind: 'invalid', issn: '0317-8472' }])
  assert.deepEqual(issnConflicts(verified, ['1050-124X']), [{ kind: 'foreign', issn: '1050-124X' }])
  assert.deepEqual(issnConflicts(verified, [], '2434-561X', '0317-8471'), [{ kind: 'swapped', print: '0317-8471', electronic: '2434-561X' }])
  assert.equal(JSON.stringify(verified), snapshot)
})

test('a journal resolves by any of its ISSNs; ambiguous ISSNs resolve to nothing', () => {
  const a = { id: 'POSI-J-A', issns: ['0317-8471', '2434-561X'] }
  const b = { id: 'POSI-J-B', issns: ['1050-124X', '2434-561X'] }
  const idx = buildIssnIndex([a, b], j => j.issns)
  assert.equal(resolveJournal(idx, ['03178471']), a)
  assert.equal(resolveJournal(idx, ['1050-124X']), b)
  assert.equal(resolveJournal(idx, ['2434-561X']), null)
  assert.equal(resolveJournal(idx, ['0000-0000']), null)
})

test('DOI normalisation', () => {
  assert.equal(normalizeDoi('https://doi.org/10.1234/ABC.def.'), '10.1234/abc.def')
  assert.equal(normalizeDoi('doi:10.1234/x%2Fy'), '10.1234/x/y')
  assert.equal(normalizeDoi('not a doi'), null)
})

test('same DOI merges across providers, citation counts stay separate, title disagreement is flagged', () => {
  const m = mergeWorks([
    { doi: 'https://doi.org/10.1234/A', title: 'A study', year: 2020, source: 'OpenAlex', citations: 10 },
    { doi: '10.1234/a', title: 'A study', year: 2020, source: 'Crossref', citations: 7 },
    { doi: null, title: 'No DOI one', year: 2021, source: 'Zenodo', citations: null },
    { doi: null, title: 'No DOI two', year: 2021, source: 'Zenodo', citations: null },
  ])
  assert.equal(m.length, 3)
  assert.deepEqual(m[0].citationsBySource, [{ source: 'OpenAlex', count: 10 }, { source: 'Crossref', count: 7 }])
  assert.equal(m[0].conflict, false)
  const c = mergeWorks([
    { doi: '10.1234/b', title: 'Alpha', year: 2020, source: 'OpenAlex', citations: 1 },
    { doi: '10.1234/b', title: 'Beta', year: 2020, source: 'Crossref', citations: 1 },
  ])
  assert.equal(c.length, 1)
  assert.equal(c[0].conflict, true)
})

test('RegistryError reports why a request failed', () => {
  assert.equal(new RegistryError('OpenAlex', 0, true).kind, 'timeout')
  assert.equal(new RegistryError('OpenAlex', 0).kind, 'unreachable')
  assert.equal(new RegistryError('OpenAlex', 429).kind, 'rate-limited')
  assert.equal(new RegistryError('OpenAlex', 404).kind, 'not-found')
  assert.equal(new RegistryError('OpenAlex', 0, true).busy, true)
  assert.equal(new RegistryError('OpenAlex', 404).busy, false)
})

test('static data and the public client never embed a private key', async () => {
  const { execSync } = await import('node:child_process')
  const out = execSync("grep -rniE \"(api[_-]?key|secret|bearer )\\s*[:=]\\s*['\\\"][A-Za-z0-9_-]{16,}\" src --include=*.ts --include=*.tsx || true", { encoding: 'utf8' })
  assert.equal(out.trim(), '')
})

test('every host the browser code calls is in the CSP connect-src allow-list', async () => {
  const { readFileSync, readdirSync, statSync } = await import('node:fs')
  const { join } = await import('node:path')
  const csp = /Content-Security-Policy: connect-src ([^;\n]+)/.exec(readFileSync('public/_headers', 'utf8'))![1].split(/\s+/)
  const allowed = new Set(csp.filter(s => s.startsWith('https://')).map(s => new URL(s).host))
  // Server-only: imported by the static PDF route handler and run at build time, never in the browser.
  const BUILD_ONLY = new Set(['src/lib/certificate-pdf.ts'])
  const files: string[] = []
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(p) && !p.endsWith('.test.ts') && !BUILD_ONLY.has(p)) files.push(p) } }
  walk('src')
  // fetch() on a literal URL, and the API base constants the registry adapters build URLs from
  const re = /fetch\(\s*[`'"]https:\/\/([^/'"`$]+)|const (?:API|OPENALEX|CROSSREF|DATACITE|ZENODO|DOI_RA)\b[^=]*=\s*[`'"]https:\/\/([^/'"`]+)|[`'"]https:\/\/(doi\.org)\/doiRA/g
  const used = new Map<string, string>()
  for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(re)) used.set(m[1] ?? m[2] ?? m[3], f)
  assert.ok(used.size >= 6, `scan found too few hosts (${[...used.keys()]})`)
  for (const [host, file] of used) assert.ok(allowed.has(host), `${host} (used in ${file}) is not in connect-src in public/_headers`)
})
