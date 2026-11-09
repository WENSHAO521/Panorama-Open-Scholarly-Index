import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createFetcher } from './resilient-fetch.mjs'

type Answer = number | object | string
/** A fetch that answers each URL from a queue: a number is that HTTP status, anything else a 200 body. */
function fakeFetch(routes: Record<string, Answer[]>) {
  const calls: string[] = []
  const impl = async (url: string) => {
    calls.push(url)
    const queue = routes[url] ?? [404]
    const a = queue.length > 1 ? queue.shift()! : queue[0]
    if (typeof a === 'number') return new Response('', { status: a })
    return new Response(typeof a === 'string' ? a : JSON.stringify(a), { status: 200 })
  }
  return { impl: impl as unknown as typeof fetch, calls }
}

const quiet = <T>(fn: () => Promise<T>) => async () => {
  const warn = console.warn
  console.warn = () => {}
  try { return await fn() } finally { console.warn = warn }
}

const ASSET = 'https://github.com/o/r/releases/download/journals-2026-11-02/global-corpus.json.gz'

test('a 504 is retried until it succeeds', quiet(async () => {
  const f = fakeFetch({ 'https://x/a.json': [504, 503, { ok: 1 }] })
  const get = createFetcher({ fetchImpl: f.impl, baseDelayMs: 1 })
  assert.deepEqual(await get('https://x/a.json'), { ok: 1 })
  assert.equal(f.calls.length, 3)
}))

test('a 404 is final: no retry, no API, no cache', quiet(async () => {
  const f = fakeFetch({ 'https://x/a.json': [404] })
  const get = createFetcher({ fetchImpl: f.impl, baseDelayMs: 1 })
  await assert.rejects(get('https://x/a.json'), /404 /)
  assert.equal(f.calls.length, 1)
}))

test('a release download that keeps failing comes through the GitHub API', quiet(async () => {
  const f = fakeFetch({
    [ASSET]: [504],
    'https://api.github.com/repos/o/r/releases/tags/journals-2026-11-02': [{ tag_name: 'journals-2026-11-02', assets: [{ name: 'global-corpus.json.gz', url: 'https://api.github.com/repos/o/r/releases/assets/7' }] }],
    'https://api.github.com/repos/o/r/releases/assets/7': ['corpus'],
  })
  const get = createFetcher({ fetchImpl: f.impl, baseDelayMs: 1, tries: 2 })
  assert.equal((await get(ASSET, 'buffer')).toString(), 'corpus')
}))

test('when GitHub and its API both fail, the last good copy is used', quiet(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'rf-'))
  try {
    const good = fakeFetch({ [ASSET]: ['v1'] })
    await createFetcher({ fetchImpl: good.impl, cacheDir: dir })(ASSET, 'buffer')

    const OTHER = 'https://github.com/o/r/releases/download/t/other.gz'
    const down = fakeFetch({ [ASSET]: [504], [OTHER]: [504], 'https://api.github.com/repos/o/r/releases/tags/journals-2026-11-02': [502], 'https://api.github.com/repos/o/r/releases/tags/t': [502] })
    const get = createFetcher({ fetchImpl: down.impl, cacheDir: dir, baseDelayMs: 1, tries: 2 })
    assert.equal((await get(ASSET, 'buffer')).toString(), 'v1')

    // with no cached copy the error still surfaces
    await assert.rejects(get(OTHER, 'buffer'), /504/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
}))

test('an answer that is not valid JSON does not replace the cached copy', quiet(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'rf-'))
  try {
    const url = 'https://x/current.json'
    await createFetcher({ fetchImpl: fakeFetch({ [url]: [{ v: 1 }] }).impl, cacheDir: dir })(url)
    await assert.rejects(createFetcher({ fetchImpl: fakeFetch({ [url]: ['<html>'] }).impl, cacheDir: dir })(url))
    const get = createFetcher({ fetchImpl: fakeFetch({ [url]: [500] }).impl, cacheDir: dir, baseDelayMs: 1, tries: 1 })
    assert.deepEqual(await get(url), { v: 1 })
  } finally { rmSync(dir, { recursive: true, force: true }) }
}))
