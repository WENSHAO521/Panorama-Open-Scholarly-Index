import { test } from 'node:test'
import assert from 'node:assert/strict'
import { titleWords, prefixOf, partOf, neverSplit } from './title-words.mjs'

/** True when every word of the query prefix-matches a word of the title, as the journal search requires. */
const finds = (query: string, title: string) => {
  const q = titleWords(query), t = titleWords(title)
  return q.length > 0 && q.every(w => t.some(x => x.startsWith(w)))
}

test('Latin titles split as before', () => {
  assert.deepEqual(titleWords('Journal of Applied Physics'), ['applied', 'physics'])
  assert.deepEqual(titleWords('Revista de Teoría de la Literatura'), ['teoria', 'literatura'])
  assert.deepEqual(titleWords('Zeitschrift für Naturforschung'), ['zeitschrift', 'fur', 'naturforschung'])
  assert.deepEqual(titleWords('Xiǎoʼér kēyī xuéhuì zázhì'), ['xiao', 'er', 'keyi', 'xuehui', 'zazhi'])
})

test('Latin letters without a decomposition are folded', () => {
  assert.ok(finds('Lodz', 'Łódź Studies in Theology'))
  assert.ok(finds('Łódź', 'Lodz Studies in Theology'))
  assert.ok(finds('Istanbul Universitesi', 'İstanbul Üniversitesi Hukuk Fakültesi Mecmuası'))
  assert.ok(finds('mecmuasi', 'Istanbul Universitesi Hukuk Fakultesi Mecmuası'))
  assert.ok(finds('Straße', 'Strasse und Verkehr'))
  assert.ok(finds('Tidsskrift for Den norske laegeforening', 'Tidsskrift for Den norske lægeforening'))
  assert.ok(finds('Dai hoc', 'Tạp chí Khoa học Đại học'))
})

test('Chinese is matched character by character, as before', () => {
  assert.deepEqual(titleWords('中国科学'), ['中', '国', '科', '学'])
  assert.ok(finds('科学', '中国科学：数学'))
})

test('Japanese kana and kanji are matched character by character', () => {
  assert.ok(finds('皮膚の科学', '皮膚の科学'))
  assert.ok(finds('セラミックス', 'Ceramics Japan = セラミックス : bulletin of the Ceramic Society of Japan'))
  assert.ok(finds('リハビリテーション', 'リハビリテーション医学 : 日本リハビリテーション医学会誌'))
})

test('Cyrillic, Greek, Arabic, Hebrew and Hangul words are searchable', () => {
  assert.deepEqual(titleWords('Агрохимия'), ['агрохимия'])
  assert.ok(finds('агрохим', 'Агрохимия'))
  assert.ok(finds('Вестник Московского университета', 'Вестник Московского университета. Серия 1'))
  assert.ok(finds('ёлка', 'Елка'))
  assert.ok(finds('Επιθεωρηση', 'Επιθεώρηση Κοινωνικών Ερευνών'))
  assert.ok(finds('κοινωνικων ερευνων', 'Επιθεώρηση Κοινωνικών Ερευνών'))
  assert.ok(finds('الدراسات', 'الدراسات الإسلامية'))
  assert.ok(finds('الدراسات', 'الدِّرَاسَات الإسلامية'))
  assert.ok(finds('עיונים', 'עִיּוּנִים בחינוך'))
  assert.ok(finds('인도법', '인도법논총'))
  assert.ok(finds('법학 논총', '법학 논총'))
})

test('Indic, Thai and other scripts are searchable', () => {
  assert.ok(finds('विचार', 'विचार'))
  assert.ok(finds('সাহিত্য', 'সাহিত্য পত্রিকা'))
  assert.ok(finds('ಕನ್ನಡ', 'ಕ್ರಿಸ್ತು ಜಯಂತಿ ಕನ್ನಡ ಸಂಶೋಧನಾ ಪತ್ರಿಕೆ'))
  assert.ok(finds('സംസ്‌കൃതി', 'Indian Journal of Malayalam Language Research Studies - സംസ്‌കൃതി'))
  assert.ok(finds('สังคม', 'วารสารสังคมศาสตร์'))
  assert.ok(finds('ວາລະສານ', 'ວາລະສານວິທະຍາສາດສັງຄົມ'))
  assert.ok(finds('სჯანი', 'სჯანი'))
})

test('words mixing look-alike Latin, Cyrillic and Greek letters', () => {
  assert.ok(finds('Moscow Surgical', 'Моscоw Surgical Journal'))
  assert.ok(finds('Machine Building', 'Proceedings of Higher Educational Institutions Маchine Building'))
  assert.ok(finds('геофизические процессы', 'ГEOФИЗИЧЕСКИЕ ПРОЦЕССЫ И БИОСФЕРА'))
  assert.ok(finds('Asemka', 'Asεmka A Bilingual Literary Journal'))
  assert.deepEqual(titleWords('Москва Moscow'), ['москва', 'moscow'])
  assert.deepEqual(titleWords('SOCIOПРОСТІР'), ['sосіопростір'])
})

test('words split where Latin or digits meet another script', () => {
  assert.deepEqual(titleWords('담론201'), ['담론', '201'])
  assert.deepEqual(titleWords('한국REBT인지행동치료연구'), ['한국', 'rebt', '인지행동치료연구'])
  assert.ok(finds('REBT', '한국REBT인지행동치료연구'))
  assert.deepEqual(titleWords('COVID-19 Journal'), ['covid', '19'])
  assert.deepEqual(titleWords('Covid19'), ['covid19'])
})

test('index files keep ASCII names', () => {
  for (const w of ['physics', 'агрохимия', '인도법논총', 'ș', '科', 'の', 'ว', 'a' + 'ب']) {
    assert.match(prefixOf(titleWords(w)[0] ?? w), /^[a-z0-9_]+$/)
  }
  assert.equal(prefixOf('physics'), 'ph')
  assert.match(prefixOf('科'), /^zh\d+$/)
  assert.match(prefixOf('агрохимия'), /^u_\d+$/)
  assert.ok(neverSplit('zh12') && neverSplit('u_3') && !neverSplit('ph'))
  assert.equal(partOf('physics', 2), 'y')
  assert.equal(partOf('ph', 2), '_')
  assert.equal(partOf('abц', 2), '_')
})
