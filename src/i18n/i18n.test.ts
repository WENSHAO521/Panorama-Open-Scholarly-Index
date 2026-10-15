// node --test src/i18n/  (npm test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LOCALES, DEFAULT_LOCALE, URL_PREFIX, localePath, stripLocale } from './config.ts'
import { getMessages } from './index.ts'
import { PRIMARY_STRUCTURE, UTILITY_STRUCTURE, FOOTER_STRUCTURE, primaryNav, utilityNav, footerNav } from '../lib/site-nav.ts'
import { DOCS_STRUCTURE, docsNav } from '../lib/docs-nav.ts'

test('English is the default and has no path prefix, so its addresses do not change', () => {
  assert.equal(DEFAULT_LOCALE, 'en')
  assert.equal(URL_PREFIX.en, '')
  assert.equal(localePath('en', '/journals/'), '/journals/')
  assert.equal(localePath('en', '/'), '/')
})

test('localePath leaves external, protocol-relative and relative addresses alone', () => {
  for (const href of ['https://example.org/x', '//example.org/x', 'mailto:a@b.c', '#top', 'journals/']) {
    for (const l of LOCALES) assert.equal(localePath(l, href), href)
  }
})

test('stripLocale returns paths without a language prefix unchanged', () => {
  for (const p of ['/', '/journals/', '/journal/abc/', '/zh-not-a-prefix/']) assert.equal(stripLocale(p), p)
})

test('every language has a message file for the whole structure, and nothing is left over', () => {
  for (const l of LOCALES) {
    const m = getMessages(l)
    const primary = m.nav.primary as Record<string, { label: string; links?: Record<string, { label: string }> }>
    assert.deepEqual(Object.keys(primary), PRIMARY_STRUCTURE.map(g => g.id))
    for (const g of PRIMARY_STRUCTURE) {
      assert.ok(primary[g.id].label, `${l}: primary ${g.id}`)
      assert.deepEqual(Object.keys(primary[g.id].links ?? {}), (g.links ?? []).map(x => x.id), `${l}: primary ${g.id} links`)
      for (const x of g.links ?? []) assert.ok(primary[g.id].links![x.id].label, `${l}: primary ${g.id}.${x.id}`)
    }
    const utility = m.nav.utility as Record<string, string>
    assert.deepEqual(Object.keys(utility), UTILITY_STRUCTURE.map(x => x.id))
    const footer = m.nav.footer as Record<string, { title: string; links: Record<string, string> }>
    assert.deepEqual(Object.keys(footer), FOOTER_STRUCTURE.map(c => c.id))
    for (const c of FOOTER_STRUCTURE) {
      assert.ok(footer[c.id].title)
      assert.deepEqual(Object.keys(footer[c.id].links), c.links.map(x => x.id), `${l}: footer ${c.id}`)
    }
    const docs = m.docs as Record<string, { title: string; blurb: string; links: Record<string, string> }>
    assert.deepEqual(Object.keys(docs), DOCS_STRUCTURE.map(s => s.id))
    for (const s of DOCS_STRUCTURE) {
      assert.ok(docs[s.id].title && docs[s.id].blurb)
      assert.deepEqual(Object.keys(docs[s.id].links), s.links.map(x => x.id), `${l}: docs ${s.id} links`)
    }
  }
})

test('the resolved navigation keeps the addresses of the structure, all internal and with a trailing slash', () => {
  for (const l of LOCALES) {
    const m = getMessages(l)
    const hrefs = [
      ...primaryNav(m.nav).flatMap(g => [...(g.href ? [g.href] : []), ...(g.links ?? []).map(x => x.href), ...(g.match ?? [])]),
      ...utilityNav(m.nav).map(x => x.href),
      ...footerNav(m.nav).flatMap(c => c.links.map(x => x.href)),
      ...docsNav(m.docs).flatMap(s => s.links.map(x => x.href)),
    ]
    assert.ok(hrefs.length > 50)
    for (const h of hrefs) assert.match(h, /^\/([a-z0-9-]+\/)*$/, h)
  }
})

test('every message is a non-empty string', () => {
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') assert.ok(v.trim(), path)
    else for (const [k, x] of Object.entries(v as object)) walk(x, `${path}.${k}`)
  }
  for (const l of LOCALES) walk(getMessages(l), l)
})
