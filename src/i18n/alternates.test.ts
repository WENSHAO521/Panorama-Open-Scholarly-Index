// node --test src/i18n/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localePath, stripLocale } from './config.ts'
import { availableLocales, localizedHref, pageAlternates, sitemapLanguages, LOCALE_TABLE, TRANSLATED_PATHS, type LocaleTable } from './alternates.ts'

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
  for (const p of ['/journal/abc/', '/pqf/']) {
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
    // Documentation pages sit in the (docs) route group, which shares their sidebar.
    const at = (dir: string) => existsSync(new URL(`../app/zh${dir}${p}page.tsx`, import.meta.url))
    assert.ok(at('') || at('/(docs)'), p)
  }
})
