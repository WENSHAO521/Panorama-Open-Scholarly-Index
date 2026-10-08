import { test } from 'node:test'
import assert from 'node:assert/strict'
import { psgArticle, psgBook, psgWebpage, psgInText, psgAuthors } from './psg.ts'

// Examples are the ones on the /psg-format/ page.

test('journal article matches the specification example', () => {
  assert.equal(
    psgArticle({
      authors: [{ family: 'Smith', given: 'John A.' }, { family: 'Lee', given: 'Helen K.' }, { family: 'Wang', given: 'Ming' }],
      year: 2024, title: 'Artificial Intelligence and Administrative Reform in Local Government',
      journal: 'Journal of Public Governance and Society', volume: '12', issue: '2', pages: '45-63', doi: '10.1234/abc',
    }),
    'Smith, John A., Helen K. Lee, and Ming Wang. 2024. “Artificial Intelligence and Administrative Reform in Local Government.” Journal of Public Governance and Society 12, no. 2: 45-63. https://doi.org/10.1234/abc',
  )
})

test('two authors, article number, DOI given as a URL', () => {
  assert.equal(
    psgArticle({ authors: [{ family: 'Chen', given: 'Li' }, { family: 'Park', given: 'Sungho' }], year: '2023', title: 'Digital Learning Anxiety', journal: 'Educational Psychology Review', volume: '35', issue: '2', pages: 'Article 108', doi: 'https://doi.org/10.1/x' }),
    'Chen, Li, and Sungho Park. 2023. “Digital Learning Anxiety.” Educational Psychology Review 35, no. 2: Article 108. https://doi.org/10.1/x',
  )
})

test('title-only entry, question-mark titles and initials get no doubled stops', () => {
  assert.equal(psgArticle({ authors: [], year: 2025, title: 'Attention Is All You Need', doi: '10.1/y' }), '2025. “Attention Is All You Need.” https://doi.org/10.1/y')
  assert.equal(psgArticle({ authors: [{ family: 'Kim', given: 'M.' }], year: 2020, title: 'Why?', journal: 'J' }), 'Kim, M. 2020. “Why?” J.')
})

test('HTML rendering escapes input and italicises the journal', () => {
  const f = { em: (s: string) => `<em>${s}</em>`, esc: (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;') }
  assert.equal(psgArticle({ authors: [], year: 2020, title: 'A <b> & B', journal: 'J & K' }, f), '2020. “A &lt;b> &amp; B.” <em>J &amp; K</em>.')
})

test('book matches the specification example', () => {
  assert.equal(
    psgBook({ authors: [{ family: 'Giddens', given: 'Anthony' }], year: '1991', title: 'Modernity and Self-Identity', subtitle: 'Self and Society in the Late Modern Age', place: 'Stanford', publisher: 'Stanford University Press' }),
    'Giddens, Anthony. 1991. Modernity and Self-Identity: Self and Society in the Late Modern Age. Stanford: Stanford University Press.',
  )
})

test('webpage matches the specification example', () => {
  assert.equal(
    psgWebpage({ author: 'Panorama Scholarly Group', year: '2026', title: 'Publication Ethics', accessDate: 'June 24, 2026', url: 'https://example.com/publication-ethics' }),
    'Panorama Scholarly Group. 2026. “Publication Ethics.” Accessed June 24, 2026. https://example.com/publication-ethics',
  )
})

test('in-text citations', () => {
  const p = (...f: string[]) => f.map(family => ({ family }))
  assert.equal(psgInText(p('Smith'), 2024), '(Smith 2024)')
  assert.equal(psgInText(p('Smith', 'Lee'), 2024), '(Smith and Lee 2024)')
  assert.equal(psgInText(p('Smith', 'Lee', 'Wang'), 2024), '(Smith, Lee, and Wang 2024)')
  assert.equal(psgInText(p('Smith', 'Lee', 'Wang', 'Kim'), 2024), '(Smith et al. 2024)')
  assert.equal(psgInText([], null), '(n.d.)')
  assert.equal(psgInText([{ name: 'Ming Wang' }], 2024), '(Wang 2024)')
})

test('authors without split names fall back to the display name', () => {
  assert.equal(psgAuthors([{ name: 'Panorama Group' }]), 'Panorama Group')
  assert.equal(psgAuthors([{ name: 'A B' }, { name: 'C D' }]), 'A B, and C D')
})
