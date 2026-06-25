/**
 * Cloudflare Pages Function — proxy for Europeana Search API v2.
 * Requires PERSONAL_API_KEY env var set in Cloudflare Pages dashboard.
 * Falls back gracefully (503) when the key is not configured.
 *
 * Usage: GET /api/europeana-isbn?isbn=9781234567890
 */
export async function onRequestGet({ request, env }) {
  const apiKey = env.PERSONAL_API_KEY
  if (!apiKey) return json({ found: false, error: 'API key not configured' }, 503)

  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)

  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) {
    return json({ error: 'Invalid isbn' }, 400)
  }

  const params = new URLSearchParams({
    query: `proxy_dc_identifier:isbn:${clean}`,
    wskey: apiKey,
    rows: '1',
    fl: 'title,dcCreator,dcDate,dcPublisher,type',
    profile: 'minimal',
  })

  let upstream
  try {
    upstream = await fetch(
      `https://api.europeana.eu/record/v2/search.json?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(10000),
      }
    )
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `Europeana ${upstream.status}` }, 502)

  let data
  try {
    data = await upstream.json()
  } catch {
    return json({ found: false, error: 'Invalid JSON from Europeana' }, 502)
  }

  const items = data?.items
  if (!Array.isArray(items) || items.length === 0) return json({ found: false }, 200)

  const item = items[0]
  const rawTitles = item.title ?? []
  const title = Array.isArray(rawTitles) ? rawTitles[0] : rawTitles
  if (!title) return json({ found: false }, 200)

  const creators = Array.isArray(item.dcCreator) ? item.dcCreator : (item.dcCreator ? [item.dcCreator] : [])
  const dates    = Array.isArray(item.dcDate)    ? item.dcDate    : (item.dcDate    ? [item.dcDate]    : [])
  const pubs     = Array.isArray(item.dcPublisher) ? item.dcPublisher : (item.dcPublisher ? [item.dcPublisher] : [])

  const year = dates.map(d => d?.match?.(/\d{4}/)?.[0]).find(Boolean) ?? null
  const publisher = pubs[0] ?? null

  // Europeana stores names in "Lastname, Firstname" convention from library records
  const authors = creators.map(c => {
    if (!c || typeof c !== 'string') return ''
    const s = c.trim()
    const comma = s.indexOf(',')
    if (comma === -1) return s
    const last  = s.slice(0, comma).trim()
    const first = s.slice(comma + 1).trim()
    return first ? `${first} ${last}` : last
  }).filter(Boolean)

  return json({ found: true, title, authors, year, publisher }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=86400',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
