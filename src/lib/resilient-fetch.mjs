/**
 * resilient-fetch.mjs: downloads for the build scripts that survive GitHub's
 * intermittent 502/503/504s (2026-11-08: a release download returned 504 for
 * about a minute and failed the site-data publish).
 *
 * Three layers, in order:
 *   1. retries with exponential backoff (5 s, 10 s, 20 s, 40 s by default) on a
 *      network error, a timeout, a 429 or any 5xx; other 4xx answers are final;
 *   2. for a github.com release download (…/releases/download/<tag>/<name> or
 *      …/releases/latest/download/<name>), the same asset through the REST API
 *      (api.github.com …/releases/assets/<id>), a separate front end;
 *   3. the last good copy of that URL from the download cache, which every
 *      successful download refreshes. It is kept in .next/cache/ (preserved by
 *      next build, by Cloudflare Pages' build cache and by actions/cache in the
 *      publish workflow), or POSI_DOWNLOAD_CACHE. A stale copy beats a failed
 *      build: the data is at most one refresh old, and the log says so.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RELEASE_URL = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/(?:download\/([^/]+)|latest\/download)\/([^/?#]+)$/

/** A status worth retrying: rate limited or a server-side failure. */
export const retryable = status => status === 408 || status === 429 || status >= 500

class HttpError extends Error {
  constructor(status, url) { super(`${status} ${url}`); this.status = status }
}

/**
 * @param {object} o
 * @param {string} [o.cacheDir]    where last good copies live; none disables the cache
 * @param {string} [o.userAgent]
 * @param {string} [o.token]       GitHub token, sent to api.github.com only
 * @param {number} [o.tries]       attempts per URL (default 5)
 * @param {number} [o.baseDelayMs] first backoff (default 5000), doubled each retry
 * @param {number} [o.timeoutMs]   per attempt (default 180000)
 * @param {string} [o.label]       log prefix
 * @param {typeof fetch} [o.fetchImpl]
 */
export function createFetcher(o = {}) {
  const {
    cacheDir, userAgent = 'posi-build', token, tries = 5, baseDelayMs = 5000, timeoutMs = 180_000,
    label = 'fetch', fetchImpl = fetch,
  } = o
  const warn = msg => console.warn(`${label}: ${msg}`)

  async function once(url, accept) {
    const headers = { 'User-Agent': userAgent }
    if (accept) headers.Accept = accept
    if (token && url.startsWith('https://api.github.com/')) headers.Authorization = `Bearer ${token}`
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers })
    if (!res.ok) throw new HttpError(res.status, url)
    return Buffer.from(await res.arrayBuffer())
  }

  async function withRetries(url, accept, n = tries) {
    for (let i = 1; ; i++) {
      try { return await once(url, accept) } catch (e) {
        const final = e instanceof HttpError && !retryable(e.status)
        if (final || i >= n) throw e
        const wait = baseDelayMs * 2 ** (i - 1)
        warn(`${e.message}; retry ${i} of ${n - 1} in ${Math.round(wait / 1000)} s`)
        await new Promise(r => setTimeout(r, wait))
      }
    }
  }

  /** The same release asset through the REST API. */
  async function viaApi(url) {
    const m = RELEASE_URL.exec(url)
    if (!m) return null
    const [, owner, repo, tag, name] = m
    const rel = `https://api.github.com/repos/${owner}/${repo}/releases/${tag ? `tags/${encodeURIComponent(decodeURIComponent(tag))}` : 'latest'}`
    const release = JSON.parse((await withRetries(rel, 'application/vnd.github+json', 3)).toString('utf-8'))
    const asset = release.assets?.find(a => a.name === decodeURIComponent(name))
    if (!asset) throw new HttpError(404, `${url} (no asset ${name} on ${release.tag_name})`)
    return withRetries(asset.url, 'application/octet-stream', 3)
  }

  const keyOf = url => createHash('sha256').update(url).digest('hex').slice(0, 32)

  function save(url, body) {
    if (!cacheDir) return
    try {
      mkdirSync(cacheDir, { recursive: true })
      const k = keyOf(url)
      writeFileSync(join(cacheDir, `${k}.tmp`), body)
      renameSync(join(cacheDir, `${k}.tmp`), join(cacheDir, `${k}.bin`))
      writeFileSync(join(cacheDir, `${k}.json`), JSON.stringify({ url, saved_at: new Date().toISOString(), bytes: body.length }))
    } catch (e) { warn(`could not cache ${url} (${e.message})`) }
  }

  function load(url) {
    if (!cacheDir) return null
    const k = keyOf(url)
    const bin = join(cacheDir, `${k}.bin`)
    if (!existsSync(bin)) return null
    let savedAt = 'an unknown time'
    try { savedAt = JSON.parse(readFileSync(join(cacheDir, `${k}.json`), 'utf-8')).saved_at } catch { /* meta is optional */ }
    return { body: readFileSync(bin), savedAt }
  }

  /** A Buffer, or parsed JSON with as = 'json'. A 404 is final and never served from the cache. */
  return async function get(url, as = 'json') {
    let body
    try {
      body = await withRetries(url)
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) throw e
      let err = e
      try {
        body = await viaApi(url)
        if (body) warn(`${e.message}; downloaded through the GitHub API instead`)
      } catch (e2) { err = new Error(`${e.message}; GitHub API: ${e2.message}`) }
      if (!body) {
        const cached = load(url)
        if (!cached) throw err
        warn(`${err.message}; using the cached copy from ${cached.savedAt}`)
        return as === 'json' ? JSON.parse(cached.body.toString('utf-8')) : cached.body
      }
    }
    // Parse before caching, so a garbled answer never replaces a good copy.
    const out = as === 'json' ? JSON.parse(body.toString('utf-8')) : body
    save(url, body)
    return out
  }
}
