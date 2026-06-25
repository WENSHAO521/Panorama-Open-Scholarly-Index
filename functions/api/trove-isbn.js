/**
 * Cloudflare Pages Function — proxy for National Library of Australia Trove API v3.
 * Requires TROVE_API_KEY env var (free registration at trove.nla.gov.au/about/create-something/using-api).
 * Falls back gracefully (503) when the key is not configured.
 *
 * Usage: GET /api/trove-isbn?isbn=9780143010012
 */
export async function onRequestGet({ request, env }) {
  const apiKey = env.TROVE_API_KEY
  if (!apiKey) return json({ found: false, error: 'API key not configured' }, 503)

  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)

  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) {
    return json({ error: 'Invalid isbn' }, 400)
  }

  const params = new URLSearchParams({
    q: `isbn:${clean}`,
    category: 'book',
    encoding: 'json',
    key: apiKey,
    n: '1',
    bulkHarvest: 'false',
  })

  let upstream
  try {
    upstream = await fetch(
      `https://api.trove.nla.gov.au/v3/result?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(10000),
      }
    )
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `Trove ${upstream.status}` }, 502)

  let data
  try {
    data = await upstream.json()
  } catch {
    return json({ found: false, error: 'Invalid JSON from Trove' }, 502)
  }

  // Trove v3: response.zone[].records.work[]
  const zones = data?.response?.zone
  if (!Array.isArray(zones) || zones.length === 0) return json({ found: false }, 200)

  let work = null
  for (const zone of zones) {
    const works = zone?.records?.work
    if (Array.isArray(works) && works.length > 0) { work = works[0]; break }
    if (works && !Array.isArray(works)) { work = works; break }
  }
  if (!work?.title) return json({ found: false }, 200)

  const contributors = Array.isArray(work.contributor)
    ? work.contributor
    : work.contributor ? [work.contributor] : []

  const year = work.issued?.match?.(/\d{4}/)?.[0] ?? null

  return json({
    found: true,
    title: work.title,
    authors: contributors,
    year,
    publisher: null,
  }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

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
