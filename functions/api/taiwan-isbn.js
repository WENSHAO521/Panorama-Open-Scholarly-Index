/**
 * Cloudflare Pages Function — proxy for National Central Library of Taiwan (NCL) SRU API.
 * No API key required; this proxy exists solely to bypass CORS restrictions.
 *
 * Usage: GET /api/taiwan-isbn?isbn=9789869601559
 */
export async function onRequestGet({ request }) {
  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)

  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) {
    return json({ error: 'Invalid isbn' }, 400)
  }

  const params = new URLSearchParams({
    version: '1.1',
    operation: 'searchRetrieve',
    query: `isbn=${clean}`,
    recordSchema: 'dc',
    maximumRecords: '1',
  })

  let upstream
  try {
    upstream = await fetch(
      `https://ncltw.alma.exlibrisgroup.com/view/sru/886NCL_INST?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(10000),
      }
    )
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `NCL-TW ${upstream.status}` }, 502)

  const xml = await upstream.text()

  // NCL title format: "Main title : subtitle / " — strip trailing " / "
  const rawTitle = xmlText(xml, 'title')
  if (!rawTitle) return json({ found: false }, 200)
  const title = rawTitle.split(' / ')[0].trim()
  if (!title) return json({ found: false }, 200)

  // NCL Alma uses <dc:contributor> (not creator); Chinese names use "|" as surname/given separator
  const contributors = xmlAll(xml, 'contributor')
  const publisher = xmlText(xml, 'publisher') || null
  const date = xmlText(xml, 'date')
  const year = date.match(/\d{4}/)?.[0] ?? null

  const authors = contributors.map(c => {
    const s = c.replace(/\|/g, '')           // join surname|given
               .replace(/\s*\(.*?\)/g, '')   // strip qualifications in parens
               .replace(/,\s*\d{4}.*$/, '')  // strip ", YYYY-..." and role words after date
               .replace(/,\s*[一-鿿぀-ヿ]+$/, '') // strip ", 役者" style role words
               .trim()
    return s
  }).filter(Boolean)

  return json({ found: true, title, authors, year, publisher }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

function xmlText(xml, tag) {
  const re = new RegExp(
    `<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'i'
  )
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

function xmlAll(xml, tag) {
  const re = new RegExp(
    `<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'gi'
  )
  const out = []
  let m
  while ((m = re.exec(xml)) !== null) {
    const val = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
    if (val) out.push(val)
  }
  return out
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
