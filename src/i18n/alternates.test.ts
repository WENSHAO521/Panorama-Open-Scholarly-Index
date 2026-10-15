// node --test src/i18n/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localePath, stripLocale } from './config.ts'
import { availableLocales, pageAlternates, sitemapLanguages, LOCALE_TABLE, TRANSLATED_PATHS, type LocaleTable } from './alternates.ts'

type L = 'en' | 'zh-Hans'
// A second language that has translated two pages, to exercise what a single published language cannot.
const two: LocaleTable<L> = {
  locales: ['en', 'zh-Hans'],
  defaultLocale: 'en',
  prefix: { en: '', 'zh-Hans': '/zh' },
  htmlLang: { en: 'en', 'zh-Hans': 'zh-Hans' },
  translated: { en: null, 'zh-Hans': ['/journals/', '/docs/'] },
}

test('with only English published, no page has an alternate language', () => {
  assert.deepEqual(LOCALE_TABLE.locales, ['en'])
  assert.deepEqual(TRANSLATED_PATHS, { en: null })
  for (const p of ['/', '/journals/', '/docs/', '/journal/abc/']) {
    assert.deepEqual(availableLocales(p), ['en'])
    assert.deepEqual(pageAlternates(p), { canonical: p })
    assert.equal(sitemapLanguages(p, 'https://posi.panorama-sg.com'), undefined)
  }
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
