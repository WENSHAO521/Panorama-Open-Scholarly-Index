import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractDois, detectFormat, parseInput, parseBibtex, parseRis, titleMatches, searchQuery } from './cite-parse.ts'

test('DOIs are found in free text, URLs and trailing punctuation is dropped', () => {
  const text = 'See https://doi.org/10.1234/abc.def, and (doi:10.5555/xyz-1). Again 10.1234/ABC.DEF; also 10.1002/(SICI)1097-4571(199806)49:8<693::AID-ASI4>3.0.CO;2-O'
  assert.deepEqual(extractDois(text), ['10.1234/abc.def', '10.5555/xyz-1', '10.1002/(SICI)1097-4571(199806)49:8'])
})

test('format detection', () => {
  assert.equal(detectFormat('@article{a, title={x}}'), 'bibtex')
  assert.equal(detectFormat('TY  - JOUR\nER  - '), 'ris')
  assert.equal(detectFormat('[{"title":"x"}]'), 'csl')
  assert.equal(detectFormat('10.1234/abc\n10.1234/def'), 'text')
})

test('BibTeX entries are parsed with braces, quotes and bare values', () => {
  const bib = `@article{smith2024,
  author = {Smith, John A. and Helen K. Lee},
  title  = {AI and {Administrative} Reform},
  journal = "Journal of Public Governance",
  year = 2024,
  volume = {12}, number = {2}, pages = {45--63},
  doi = {10.1234/abc}
}
@comment{ignored}
@book{b, title={A Book}, author={Giddens, Anthony}, year={1991}}`
  const e = parseBibtex(bib)
  assert.equal(e.length, 2)
  assert.equal(e[0].title, 'AI and Administrative Reform')
  assert.deepEqual(e[0].authors, [{ family: 'Smith', given: 'John A.' }, { given: 'Helen K.', family: 'Lee' }])
  assert.equal(e[0].journal, 'Journal of Public Governance')
  assert.equal(e[0].year, '2024')
  assert.equal(e[0].pages, '45-63')
  assert.equal(e[0].doi, '10.1234/abc')
  assert.equal(e[1].doi, undefined)
})

test('RIS records are parsed', () => {
  const ris = 'TY  - JOUR\nAU  - Chen, Li\nAU  - Park, Sungho\nT1  - Digital Learning\nJO  - Ed Psych\nPY  - 2023/05/01\nSP  - 10\nEP  - 20\nDO  - 10.9999/q\nER  - \n\nTY  - JOUR\nT1  - Second\nER  - '
  const e = parseRis(ris)
  assert.equal(e.length, 2)
  assert.equal(e[0].year, '2023')
  assert.equal(e[0].pages, '10-20')
  assert.equal(e[0].doi, '10.9999/q')
  assert.equal(e[0].authors.length, 2)
})

test('plain lists: numbering stripped, repeated DOIs merged', () => {
  const { format, entries } = parseInput('1. 10.1234/a\n2) https://doi.org/10.1234/A\n[3] Smith J (2020) Some title. J Foo 1:2')
  assert.equal(format, 'text')
  assert.equal(entries.length, 2)
  assert.equal(entries[1].doi, undefined)
  assert.equal(searchQuery(entries[1]), 'Smith J (2020) Some title. J Foo 1:2')
})

test('title matching accepts the right hit and rejects others', () => {
  assert.ok(titleMatches('Smith J (2020) Deep learning for protein folding. Nature', 'Deep Learning for Protein Folding'))
  assert.ok(!titleMatches('Smith J (2020) Deep learning for protein folding. Nature', 'Protein folding in yeast'))
})
