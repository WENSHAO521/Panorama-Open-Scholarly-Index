import { test } from 'node:test'
import assert from 'node:assert/strict'
import { footnoteArticle, footnoteBook, footnoteDataset, footnoteWebpage } from './footnote.ts'
import { cleanTitle, initials, plausibleYear, spaceInitials, splitName, titleStop } from './cite-text.ts'

test('journal article: full note and short note', () => {
  assert.deepEqual(
    footnoteArticle({
      authors: [{ family: 'Smith', given: 'John A.' }, { family: 'Lee', given: 'Helen K.' }, { family: 'Wang', given: 'Ming' }],
      year: 2024, title: 'Artificial Intelligence and Administrative Reform in Local Government',
      journal: 'Journal of Public Governance and Society', volume: '12', issue: '2', pages: '45-63', doi: '10.1234/abc',
    }),
    {
      full: 'John A. Smith, Helen K. Lee, and Ming Wang, “Artificial Intelligence and Administrative Reform in Local Government,” Journal of Public Governance and Society 12, no. 2 (2024): 45–63, https://doi.org/10.1234/abc.',
      short: 'Smith, Lee, and Wang, “Artificial Intelligence and Administrative.”',
    },
  )
})

test('four or more authors become "et al."; a display name is split; a dangling colon is dropped', () => {
  const r = footnoteArticle({
    authors: [{ name: 'P.J Ruiz Lázaro' }, { name: 'Ana Gómez' }, { name: 'Luis Pérez' }, { name: 'Marta Díaz' }],
    year: 2003, title: 'Comentario: Prevención de los factores de riesgo de los trastornos de la conducta alimentaria en adolescentes:',
    journal: 'Atención Primaria', volume: '32', issue: '7', pages: '408-409', doi: 'https://doi.org/10.1157/13053466',
  })
  assert.equal(r.full, 'P. J. Ruiz Lázaro et al., “Comentario: Prevención de los factores de riesgo de los trastornos de la conducta alimentaria en adolescentes,” Atención Primaria 32, no. 7 (2003): 408–409, https://doi.org/10.1157/13053466.')
  assert.equal(r.short, 'Ruiz Lázaro et al., “Comentario.”')
})

test('a question mark stands in for the comma; no journal details', () => {
  const r = footnoteArticle({ authors: [{ family: 'Chen', given: 'Li' }, { family: 'Park', given: 'Sungho' }], year: '2023', title: 'Does Digital Learning Help?' })
  assert.equal(r.full, 'Li Chen and Sungho Park, “Does Digital Learning Help?” (2023).')
  assert.equal(r.short, 'Chen and Park, “Does Digital Learning Help?”')
})

test('book, data set and web page', () => {
  assert.deepEqual(
    footnoteBook({ authors: [{ family: 'Doe', given: 'Jane' }], year: '2020', title: 'Open Science', subtitle: 'A Primer', edition: '2nd', place: 'Singapore', publisher: 'Panorama Press' }),
    { full: 'Jane Doe, Open Science: A Primer, 2nd ed. (Singapore: Panorama Press, 2020).', short: 'Doe, Open Science.' },
  )
  assert.equal(
    footnoteDataset({ authors: [{ name: 'Ming Wang' }], year: 2022, title: 'Survey Responses', kind: 'Data set', publisher: 'Zenodo', doi: '10.5281/zenodo.1' }).full,
    'Ming Wang, Survey Responses (Zenodo, 2022), data set, https://doi.org/10.5281/zenodo.1.',
  )
  assert.deepEqual(
    footnoteWebpage({ author: 'Smith, John', title: 'How to Cite', siteName: 'POSI', accessDate: 'May 1, 2026', url: 'https://example.org/cite' }),
    { full: 'John Smith, “How to Cite,” POSI, accessed May 1, 2026, https://example.org/cite.', short: 'Smith, “How to Cite.”' },
  )
})

test('splitName keeps initials as the given name and particles with the family name', () => {
  assert.deepEqual(splitName('P.J Ruiz Lázaro'), { given: 'P.J', family: 'Ruiz Lázaro' })
  assert.deepEqual(splitName('J. R. R. Tolkien'), { given: 'J. R. R.', family: 'Tolkien' })
  assert.deepEqual(splitName('Ludwig van Beethoven'), { given: 'Ludwig', family: 'van Beethoven' })
  assert.deepEqual(splitName('Juan de la Cruz'), { given: 'Juan', family: 'de la Cruz' })
  assert.deepEqual(splitName('Smith, John A.'), { given: 'John A.', family: 'Smith' })
  assert.equal(splitName('UNESCO'), null)
})

test('initials, titles and years', () => {
  assert.equal(initials('P.J'), 'P. J.')
  assert.equal(initials('John A.'), 'J. A.')
  assert.equal(initials('Jean-Pierre'), 'J.-P.')
  assert.equal(spaceInitials('P.J'), 'P. J.')
  assert.equal(spaceInitials('John A'), 'John A.')
  assert.equal(cleanTitle('Prevención en adolescentes: '), 'Prevención en adolescentes')
  assert.equal(titleStop('Prevención en adolescentes:'), 'Prevención en adolescentes.')
  assert.equal(titleStop('Why?'), 'Why?')
  assert.equal(plausibleYear(2203, new Date('2026-10-23')), false)
  assert.equal(plausibleYear('2027', new Date('2026-10-23')), true)
  assert.equal(plausibleYear(null), false)
})
