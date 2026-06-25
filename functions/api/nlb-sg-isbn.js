/**
 * Cloudflare Pages Function — proxy for Singapore National Library Board (NLB) API.
 * Requires NLB_SG_API_KEY env var (free registration at opendata.nlb.gov.sg).
 * Falls back gracefully (503) when the key is not configured.
 *
 * Usage: GET /api/nlb-sg-isbn?isbn=9789810755034
 */
export async function onRequestGet({ request, env }) {
  const apiKey = env.NLB_SG_API_KEY
  if (!apiKey) return json({ found: false, error: 'API key not configured' }, 503)

  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)

  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) {
    return json({ error: 'Invalid isbn' }, 400)
  }

  let upstream
  try {
    upstream = await fetch(
      `https://api2.nlb.gov.sg/content/catalogue/v3/GetTitles?ISBN=${encodeURIComponent(clean)}`,
      {
        headers: {
          'X-App-Code': apiKey,
          'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `NLB-SG ${upstream.status}` }, 502)

  let data
  try {
    data = await upstream.json()
  } catch {
    return json({ found: false, error: 'Invalid JSON from NLB' }, 502)
  }

  const titles = data?.titles
  if (!Array.isArray(titles) || titles.length === 0) return json({ found: false }, 200)

  const item = titles[0]
  // TitleName often includes " / by Author" — strip the contributor part
  const rawTitle = item.TitleName ?? ''
  const title = rawTitle.split(' / ')[0].trim() || rawTitle.trim()
  if (!title) return json({ found: false }, 200)

  const authors = item.Author
    ? [item.Author, ...(item.OtherAuthors ? [item.OtherAuthors] : [])].filter(Boolean)
    : []

  const year = item.PublishYear
    ? String(item.PublishYear).match(/\d{4}/)?.[0] ?? null
    : null

  return json({
    found: true,
    title,
    authors,
    year,
    publisher: item.Publisher ?? null,
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
