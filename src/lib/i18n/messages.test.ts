// node --test src/lib/i18n/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ja from './messages/ja.ts'
import ko from './messages/ko.ts'
import zhHans from './messages/zh-Hans.ts'
import zhHant from './messages/zh-Hant.ts'

const ALL = { ja, ko, 'zh-Hans': zhHans, 'zh-Hant': zhHant }
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

test('every language translates the same strings', () => {
  const keys = Object.keys(ja).sort()
  for (const [code, m] of Object.entries(ALL)) assert.deepEqual(Object.keys(m).sort(), keys, code)
})

test('translations keep their placeholders and are not empty', () => {
  for (const [code, m] of Object.entries(ALL)) {
    for (const [en, tr] of Object.entries(m)) {
      assert.ok(tr.trim(), `${code}: empty translation for "${en}"`)
      assert.deepEqual(placeholders(tr), placeholders(en), `${code}: "${en}"`)
    }
  }
})
