import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractDois, detectFormat, parseInput, parseReferenceText, parseBibtex, parseRis, titleMatches, searchQuery } from './cite-parse.ts'

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

test('reference styles are split into fields', () => {
  const ama = parseReferenceText('Smith J, Lee HK, Wang M. Deep learning for protein folding. Nature Methods. 2020;17(3):45-63. doi:10.1/x')!
  assert.equal(ama.title, 'Deep learning for protein folding')
  assert.equal(ama.journal, 'Nature Methods')
  assert.deepEqual([ama.year, ama.volume, ama.issue, ama.pages], ['2020', '17', '3', '45-63'])
  assert.deepEqual(ama.authors?.[0], { family: 'Smith', given: 'J.' })
  assert.equal(ama.authors?.length, 3)

  const apa = parseReferenceText('Smith, J. A., & Lee, H. K. (2020). Deep learning for protein folding. Nature Methods, 17(3), 45-63.')!
  assert.equal(apa.title, 'Deep learning for protein folding')
  assert.equal(apa.journal, 'Nature Methods')
  assert.deepEqual([apa.year, apa.volume, apa.issue, apa.pages], ['2020', '17', '3', '45-63'])
  assert.deepEqual(apa.authors?.map(a => a.family), ['Smith', 'Lee'])

  const gbt = parseReferenceText('王明, 李华. 数字治理研究[J]. 公共行政研究, 2023, 15(2): 45-58.')!
  assert.equal(gbt.title, '数字治理研究')
  assert.deepEqual([gbt.year, gbt.volume, gbt.issue, gbt.pages], ['2023', '15', '2', '45-58'])

  const chi = parseReferenceText('Smith, John, and Helen Lee. 2024. "AI and Reform." Journal of Governance 12, no. 2: 45-63.')
  assert.equal(chi?.title, 'AI and Reform')
  assert.equal(chi?.year, '2024')
})

test('a bare DOI list is not mistaken for numbered lines', () => {
  const { entries } = parseInput('10.1109/isqed.2011.5770700\n10.1007/978-3-030-71044-6_9\n3) 10.1234/numbered')
  assert.deepEqual(entries.map(e => e.doi), ['10.1109/isqed.2011.5770700', '10.1007/978-3-030-71044-6_9', '10.1234/numbered'])
})

test('IEEE, Harvard, MLA and Chicago references convert to the same fields', () => {
  const want = (r: string) => {
    const e = parseInput(r).entries[0]
    return [e.title?.toLowerCase(), e.journal, e.year, e.volume, e.issue, e.pages?.replace(/[-–]/, '-').replace(/-44$/, '-444'), e.authors.map(a => a.family?.toLowerCase()).join('|')]
  }
  const expected = ['deep learning', 'Nature', '2015', '521', '7553', '436-444', 'lecun|bengio|hinton']
  assert.deepEqual(want('[1] Y. LeCun, Y. Bengio, and G. Hinton, "Deep learning," Nature, vol. 521, no. 7553, pp. 436–444, 2015.'), expected)
  assert.deepEqual(want("LeCun, Y., Bengio, Y. and Hinton, G. (2015) 'Deep learning', Nature, 521(7553), pp. 436–444."), expected)
  assert.deepEqual(want('LeCun Y, Bengio Y, Hinton G. Deep learning. Nature. 2015 May 28;521(7553):436-444.'), expected)
  assert.deepEqual(want('LECUN Y, BENGIO Y, HINTON G. Deep learning[J]. Nature, 2015, 521(7553): 436-444.'), expected)
  assert.deepEqual(want('LeCun, Yann, Yoshua Bengio, and Geoffrey Hinton. 2015. “Deep Learning.” Nature 521 (7553): 436–444.'), expected)
  // "et al." leaves no stray punctuation
  assert.deepEqual(parseInput('LeCun, Yann, et al. "Deep Learning." Nature, vol. 521, no. 7553, 2015, pp. 436-44.').entries[0].authors, [{ family: 'LeCun', given: 'Yann' }])
})
