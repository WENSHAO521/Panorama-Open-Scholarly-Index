// node --test src/lib/i18n/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import {
  LOCALE_PATHS, hasLocalizedCopy, localeFromPath, localeFromSegment, localizeHref, localizedPath, translate, unlocalizedPath,
} from './locales.ts'

test('URL prefixes map to locales and back', () => {
  assert.deepEqual(LOCALE_PATHS, ['ja', 'ko', 'zh-cn', 'zh-tw'])
  assert.equal(localeFromSegment('zh-cn'), 'zh-Hans')
  assert.equal(localeFromSegment('ZH-TW'), 'zh-Hant')
  assert.equal(localeFromSegment('en'), null)
  assert.equal(localeFromSegment(undefined), null)
  assert.equal(localeFromPath('/ko/'), 'ko')
  assert.equal(localeFromPath('/journals/'), null)
  assert.equal(localizedPath('/', 'ja'), '/ja/')
  assert.equal(localizedPath('/', 'en'), '/')
  assert.equal(unlocalizedPath('/zh-cn/'), '/')
  assert.equal(unlocalizedPath('/zh-cn'), '/')
  assert.equal(unlocalizedPath('/zh-cn/about/'), '/about/')
  assert.equal(unlocalizedPath('/journals/'), '/journals/')
})

test('hrefs move between languages, except pages that exist once', () => {
  assert.equal(localizeHref('/journals/?q=cell#top', 'ko'), '/ko/journals/?q=cell#top')
  assert.equal(localizeHref('/ja/about/', 'zh-Hant'), '/zh-tw/about/')
  assert.equal(localizeHref('/ja/about/', 'en'), '/about/')
  assert.equal(localizeHref('/rankings/P1.01/', 'ja'), '/ja/rankings/P1.01/')
  assert.equal(localizeHref('/rankings/edition/2026/', 'ja'), '/ja/rankings/edition/2026/')
  assert.equal(localizeHref('/journal/?code=abc', 'ja'), '/ja/journal/?code=abc')
  for (const once of ['/journal/afs/', '/publishers/elsevier/', '/rankings/edition/2026/P1.01/', '/data/meta/x.json', '/favicon.svg']) {
    assert.equal(hasLocalizedCopy(once), false, once)
    assert.equal(localizeHref(once, 'ja'), once)
  }
  assert.equal(localizeHref('https://doi.org/10.1/x', 'ja'), 'https://doi.org/10.1/x')
  assert.equal(localizeHref('//cdn.example/x', 'ja'), '//cdn.example/x')
})

test('the generated localized routes are up to date and match the unlocalized list', () => {
  execFileSync('node', ['scripts/gen-locale-routes.mjs', '--check'], { stdio: 'pipe' })
  const gen = readFileSync('scripts/gen-locale-routes.mjs', 'utf8')
  const excluded = JSON.parse(gen.match(/EXCLUDED = (\[.*\])/)![1].replaceAll("'", '"')) as string[]
  // Each excluded route directory, with sample params, has no localized copy.
  for (const dir of excluded) {
    const url = '/' + dir.replace(/\[[^\]]+\]/g, 'x') + '/'
    assert.equal(hasLocalizedCopy(url), false, url)
  }
})

test('translate falls back to English and fills placeholders', () => {
  assert.equal(translate('ja', 'Journals'), 'ジャーナル')
  assert.equal(translate('ja', 'Not a message'), 'Not a message')
  assert.equal(translate('zh-Hans', 'Journal Citation Rankings {year}', { year: 2026 }), '2026 年期刊引文排名')
  assert.equal(translate('en', 'Journal Citation Rankings {year}', { year: 2026 }), 'Journal Citation Rankings 2026')
})
