// node --test src/i18n/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { localePath, stripLocale } from './config.ts'
import { availableLocales, localizedHref, pageAlternates, sitemapLanguages, viewerHref, LOCALE_TABLE, TRANSLATED_PATHS, TRANSLATED_SECTIONS, type LocaleTable } from './alternates.ts'

// A second language that has translated two pages, to exercise what a single published language cannot.
const two: LocaleTable = {
  locales: ['en', 'zh-Hans'],
  defaultLocale: 'en',
  prefix: { en: '', 'zh-Hans': '/zh' },
  htmlLang: { en: 'en', 'zh-Hans': 'zh-Hans' },
  translated: { en: null, 'zh-Hans': ['/journals/', '/docs/'] },
}

test('the published languages: Simplified Chinese under /zh/, starting with the home page', () => {
  assert.deepEqual(LOCALE_TABLE.locales, ['en', 'zh-Hans'])
  assert.equal(TRANSLATED_PATHS.en, null)
  assert.ok(TRANSLATED_PATHS['zh-Hans']?.includes('/'))
  assert.deepEqual(availableLocales('/'), ['en', 'zh-Hans'])
  assert.deepEqual(pageAlternates('/', 'zh-Hans'), {
    canonical: '/zh/',
    languages: { en: '/', 'zh-Hans': '/zh/', 'x-default': '/' },
  })
  for (const p of ['/journal/abc/', '/publishers/elsevier-bv/', '/certificate/verify/']) {
    assert.deepEqual(availableLocales(p), ['en'])
    assert.deepEqual(pageAlternates(p), { canonical: p })
    assert.equal(sitemapLanguages(p, 'https://posi.panorama-sg.com'), undefined)
  }
})

test('a link from a translated page stays in its language only where the target is translated', () => {
  assert.equal(localizedHref('zh-Hans', '/journals/', two), '/zh/journals/')
  assert.equal(localizedHref('zh-Hans', '/journals/?q=nature', two), '/zh/journals/?q=nature')
  assert.equal(localizedHref('zh-Hans', '/pqf/', two), '/pqf/')
  assert.equal(localizedHref('zh-Hans', '/pqf/#scope', two), '/pqf/#scope')
  assert.equal(localizedHref('en', '/journals/', two), '/journals/')
  for (const href of ['https://example.org/x', '//example.org/x', 'mailto:a@b.c', '#top']) assert.equal(localizedHref('zh-Hans', href, two), href)
})

test('a translated page lists both languages, with x-default pointing at English', () => {
  assert.deepEqual(availableLocales('/journals/', two), ['en', 'zh-Hans'])
  assert.deepEqual(pageAlternates('/journals/', undefined, two), {
    canonical: '/journals/',
    languages: { en: '/journals/', 'zh-Hans': '/zh/journals/', 'x-default': '/journals/' },
  })
})

test('the canonical address of a translated page is its own, in its own language', () => {
  assert.equal(pageAlternates('/docs/', 'zh-Hans', two).canonical, '/zh/docs/')
  assert.equal(pageAlternates('/docs/', 'en', two).canonical, '/docs/')
})

test('a page that is not translated has no alternate, even when another language exists', () => {
  assert.deepEqual(availableLocales('/pqf/', two), ['en'])
  assert.deepEqual(pageAlternates('/pqf/', undefined, two), { canonical: '/pqf/' })
})

test('sitemap languages are absolute addresses', () => {
  assert.deepEqual(sitemapLanguages('/journals/', 'https://posi.panorama-sg.com', two), {
    en: 'https://posi.panorama-sg.com/journals/',
    'zh-Hans': 'https://posi.panorama-sg.com/zh/journals/',
    'x-default': 'https://posi.panorama-sg.com/journals/',
  })
})

test('localePath and stripLocale are inverse for a prefixed language', () => {
  for (const p of ['/', '/journals/', '/journal/abc/']) {
    assert.equal(stripLocale(localePath('zh-Hans', p, two.prefix), two.prefix), p)
    assert.equal(stripLocale(localePath('en', p, two.prefix), two.prefix), p)
  }
  assert.equal(localePath('zh-Hans', '/', two.prefix), '/zh/')
  assert.equal(stripLocale('/zh', two.prefix), '/')
  assert.equal(stripLocale('/zhang/', two.prefix), '/zhang/')
})

test('every translated path has its page under src/app/zh, so no switcher or hreflang link points at a 404', async () => {
  const { existsSync } = await import('node:fs')
  for (const p of TRANSLATED_PATHS['zh-Hans'] ?? []) {
    // A journal record page is built by the dynamic route for its code.
    const route = /^\/journal\/[^/]+\/$/.test(p) ? '/journal/[code]/' : /^\/announcements\/[^/]+\/$/.test(p) ? '/announcements/[slug]/' : p
    // Documentation pages sit in the (docs) route group, which shares their sidebar.
    const at = (dir: string) => existsSync(new URL(`../app/zh${dir}${route}page.tsx`, import.meta.url))
    assert.ok(at('') || at('/(docs)'), p)
  }
})

test('the Chinese journal record pages are exactly the Core Collection journals', () => {
  const records = JSON.parse(readFileSync(new URL('../lib/core-collection.json', import.meta.url), 'utf8')) as { journal_code: string; collection_status?: string | null }[]
  const core = records.filter(j => !j.collection_status || j.collection_status === 'core').map(j => j.journal_code).sort()
  const codes = JSON.parse(readFileSync(new URL('./core-journal-codes.json', import.meta.url), 'utf8')) as string[]
  // scripts/sync-corpus.mjs writes both files; they differ only if one was edited by hand.
  assert.deepEqual(codes, core)
  assert.ok(TRANSLATED_PATHS['zh-Hans']?.includes(`/journal/${core[0]}/`))
  assert.equal(localizedHref('zh-Hans', '/journal/?issn=1234-5678'), '/zh/journal/?issn=1234-5678')
  // A record without a static Chinese page opens in the record viewer.
  assert.equal(localizedHref('zh-Hans', '/journal/bench-x-0001/'), '/zh/record/?code=bench-x-0001')
  assert.equal(localizedHref('zh-Hans', '/journal/bench-x-0001/#pqf'), '/zh/record/?code=bench-x-0001#pqf')
  assert.equal(localizedHref('en', '/journal/bench-x-0001/'), '/journal/bench-x-0001/')
})

test('the static English publisher pages open in the Chinese publisher viewer', () => {
  assert.equal(localizedHref('zh-Hans', '/publishers/elsevier-bv/'), '/zh/publisher/?id=elsevier-bv')
  assert.equal(localizedHref('zh-Hans', '/publisher/?id=small-press'), '/zh/publisher/?id=small-press')
  assert.equal(localizedHref('zh-Hans', '/publishers/'), '/zh/publishers/')
  assert.equal(localizedHref('en', '/publishers/elsevier-bv/'), '/publishers/elsevier-bv/')
  // The language switch on an English publisher page goes to the viewer; there is no viewer for a translated page.
  assert.equal(viewerHref('zh-Hans', '/publishers/elsevier-bv/'), '/publisher/?id=elsevier-bv')
  assert.equal(viewerHref('zh-Hans', '/journals/'), null)
  // With no viewer translated, the link stays English.
  assert.equal(localizedHref('zh-Hans', '/publishers/elsevier-bv/', two), '/publishers/elsevier-bv/')
})

test('the publication page and the News list are translated', () => {
  assert.equal(localizedHref('zh-Hans', '/work/?id=W123'), '/zh/work/?id=W123')
  assert.deepEqual(availableLocales('/announcements/'), ['en', 'zh-Hans'])
})

test('a section translated whole has a Chinese route for every English one', async () => {
  const { readdirSync } = await import('node:fs')
  const routes = (dir: URL): string[] => readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(f => f.endsWith('page.tsx')).sort()
  for (const section of TRANSLATED_SECTIONS['zh-Hans']) {
    assert.deepEqual(routes(new URL(`../app/zh${section}`, import.meta.url)), routes(new URL(`../app/(en)${section}`, import.meta.url)), section)
  }
  assert.equal(localizedHref('zh-Hans', '/rankings/P1.01/'), '/zh/rankings/P1.01/')
  assert.equal(localizedHref('zh-Hans', '/journals/subject/P1.01/?oa=1'), '/zh/journals/subject/P1.01/?oa=1')
  assert.equal(localizedHref('zh-Hans', '/rankings/edition/2025/all/'), '/zh/rankings/edition/2025/all/')
  assert.deepEqual(availableLocales('/rankings/all/'), ['en', 'zh-Hans'])
  assert.deepEqual(availableLocales('/rankingsx/'), ['en'])
})
