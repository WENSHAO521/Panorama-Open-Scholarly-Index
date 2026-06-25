/**
 * Cloudflare Pages Function: proxy for Google Books API (ISBN lookup)
 * Env var required: BOOKS_API (set in Cloudflare Pages dashboard)
 * GET /api/google-isbn?isbn=9780735224292
 */
export async function onRequestGet({ request, env }) {
  const isbn = new URL(request.url).searchParams.get('isbn')
  if (!isbn) return new Response('missing isbn', { status: 400 })

  const apiKey = env.BOOKS_API
  if (!apiKey) {
    return new Response(JSON.stringify({ totalItems: 0 }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const upstream = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
