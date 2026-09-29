// node --test src/lib/i18n/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LOCALE_PATHS, localeFromPath, localeFromSegment, localizedPath, translate, unlocalizedPath } from './locales.ts'

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
  assert.equal(unlocalizedPath('/journals/'), '/journals/')
})

test('translate falls back to English and fills placeholders', () => {
  assert.equal(translate('ja', 'Journals'), 'ジャーナル')
  assert.equal(translate('ja', 'Not a message'), 'Not a message')
  assert.equal(translate('zh-Hans', 'Journal Citation Rankings {year}', { year: 2026 }), '2026 年期刊引文排名')
  assert.equal(translate('en', 'Journal Citation Rankings {year}', { year: 2026 }), 'Journal Citation Rankings 2026')
})
