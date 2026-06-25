/**
 * Cloudflare Pages Function — proxy for the Korean National Library ISBN API.
 * Deployed automatically alongside the static site; runs on Cloudflare's edge.
 *
 * Required env var (set in Cloudflare Pages dashboard → Settings → Variables):
 *   NLK_API_KEY  — cert_key issued by https://www.data.go.kr/data/3078982/openapi.do
 *
 * Usage: GET /api/nlk-isbn?isbn=9791158391485
 */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn || !/^\d{10}$|^\d{13}$/.test(isbn.replace(/[-\s]/g, ''))) {
    return json({ error: 'Invalid or missing isbn parameter' }, 400)
  }

  const certKey = env.NLK_API_KEY
  if (!certKey) {
    // Key not configured — return 503 so the client falls back gracefully
    return json({ error: 'NLK_API_KEY not configured', docs: [] }, 503)
  }

  const apiUrl =
    `https://www.nl.go.kr/seoji/SearchApi.do` +
    `?cert_key=${encodeURIComponent(certKey)}` +
    `&result_style=json` +
    `&page_no=1` +
    `&page_size=1` +
    `&isbn=${encodeURIComponent(isbn.replace(/[-\s]/g, ''))}`

  let upstream
  try {
    upstream = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      // 8-second timeout
      signal: AbortSignal.timeout(8000),
    })
  } catch (err) {
    return json({ error: 'Upstream fetch failed', docs: [] }, 502)
  }

  if (!upstream.ok) {
    return json({ error: `NLK responded ${upstream.status}`, docs: [] }, 502)
  }

  const data = await upstream.json()
  return json(data, 200)
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=86400', // cache ISBN responses 24 h
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
