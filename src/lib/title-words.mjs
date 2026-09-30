// Journal-title words, shared by the title index (scripts/sync-live-data.mjs
// builds /data/jt/ with them) and the journal search (src/lib/journal-search.ts
// matches queries with them), so a title and a query always split the same way.
//
// Every script is searchable:
//   - Words are runs of letters, marks and digits in any script (Latin,
//     Cyrillic, Greek, Arabic, Hebrew, Hangul, Devanagari and the other Indic
//     scripts, Armenian, Georgian ...), split at spaces and punctuation.
//   - Scripts written without spaces between words (Chinese characters,
//     Japanese kana, Thai, Lao, Khmer, Myanmar) are matched character by
//     character.
//   - Accents and diacritics are ignored (é = e, ё = е, ά = α; Arabic and
//     Hebrew vowel points), as are compatibility forms (full-width letters,
//     ligatures). Latin letters without a decomposition are folded to their
//     usual spelling: ł → l, ø → o, æ → ae, ß → ss, đ → d, ı → i.
//   - A word mixing look-alike Latin, Cyrillic and Greek letters is read in
//     its majority script.

/** Generic words left out of the index. */
export const STOP_WORDS = new Set('journal journals international of and the for in on de la y e des du und der revista research da di del el et les en al'.split(' '))

/** Scripts matched character by character. */
const CHAR_SCRIPTS = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u
const CHAR_SCRIPTS_G = new RegExp(CHAR_SCRIPTS.source, 'gu')
const HAN = /\p{Script=Han}/u

const FOLD = { ł: 'l', ø: 'o', æ: 'ae', ß: 'ss', đ: 'd', ð: 'd', ı: 'i', œ: 'oe', þ: 'th', ə: 'e', ħ: 'h', ŋ: 'n', ς: 'σ' }
const FOLD_RE = new RegExp(`[${Object.keys(FOLD).join('')}]`, 'g')

// Latin combining diacritics; Hebrew points and cantillation; Arabic
// harakat, superscript alef, Quranic marks and tatweel.
const DIACRITICS = /[̀-֑ͯ-ׇؐ-ًؚ-ٰٟۖ-ۭـ]/g

// Look-alike letters, for words that mix Latin with Cyrillic or Greek
// ("Моscоw" typed with a Cyrillic М and о): the minority script's letters are
// read as the majority script's.
const CYRILLIC_TO_LATIN = { а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', у: 'y', х: 'x', і: 'i', ї: 'i', ј: 'j', ѕ: 's', ԁ: 'd', ӏ: 'l' }
const GREEK_TO_LATIN = { α: 'a', β: 'b', ε: 'e', ι: 'i', κ: 'k', ν: 'v', ο: 'o', ρ: 'p', τ: 't', υ: 'u', χ: 'x' }
const LATIN_TO_CYRILLIC = Object.fromEntries(Object.entries(CYRILLIC_TO_LATIN).filter(([c]) => 'авекмнорстухі'.includes(c)).map(([c, l]) => [l, c]))
const count = (w, re) => (w.match(re) ?? []).length

/** A word written in one of Latin, Cyrillic and Greek with look-alike letters of another. */
function unmix(w) {
  const latin = count(w, /[a-z]/g)
  const cyrillic = count(w, /\p{Script=Cyrillic}/gu)
  const greek = count(w, /\p{Script=Greek}/gu)
  if ((latin > 0) + (cyrillic > 0) + (greek > 0) < 2) return w
  if (latin >= cyrillic && latin >= greek) return [...w].map(c => CYRILLIC_TO_LATIN[c] ?? GREEK_TO_LATIN[c] ?? c).join('')
  if (cyrillic > greek) return [...w].map(c => LATIN_TO_CYRILLIC[c] ?? c).join('')
  return w
}

const LCG_OR_DIGIT = /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\p{N}]/u
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u
const MARK = /\p{M}/u

/** Spaces where Latin, Cyrillic, Greek or digits meet another script's
 *  letters ("한국REBT인지" → "한국 REBT 인지"); marks stay with their letter. */
function splitScripts(s) {
  let out = '', prev = 0
  for (const ch of s) {
    const k = LETTER_OR_DIGIT.test(ch) ? (LCG_OR_DIGIT.test(ch) ? 1 : 2) : 0
    if (k && prev && k !== prev) out += ' '
    out += ch
    if (k) prev = k
    else if (!MARK.test(ch)) prev = 0
  }
  return out
}

/**
 * The searchable words of a title or query: lower case, without diacritics
 * and generic words. Words of one letter are dropped, except single
 * characters of the scripts matched character by character.
 * @param {string} t
 * @returns {string[]}
 */
export function titleWords(t) {
  const s = t.normalize('NFKD').replace(DIACRITICS, '').normalize('NFC').toLowerCase()
    .replace(FOLD_RE, c => FOLD[c])
    // modifier letters (ʻ ʼ ʹ) join no word, apart from those of the
    // character-by-character scripts (々, ー)
    .replace(/\p{Lm}/gu, c => (CHAR_SCRIPTS.test(c) ? c : ' '))
    .replace(CHAR_SCRIPTS_G, ' $& ')
  return (splitScripts(s).match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? []).map(unmix)
    .filter(w => (w.length >= 2 || CHAR_SCRIPTS.test(w)) && !STOP_WORDS.has(w))
}

/**
 * Index file a word lives in: its first two letters for a word starting with
 * two of a-z and 0-9 (a file over the size limit is split further by the next
 * letter); one of 64 buckets for Chinese characters ("zh0" … "zh63") and for
 * every other word ("u_0" … "u_63"), so file names stay ASCII.
 * @param {string} w
 * @returns {string}
 */
export function prefixOf(w) {
  if (/^[a-z0-9]{2}/.test(w)) return w.slice(0, 2)
  const n = w.codePointAt(0) % 64
  return HAN.test(w) ? `zh${n}` : `u_${n}`
}

/**
 * True for index files that are never split by the next letter: the buckets
 * (and, as before, any file whose name starts with "zh").
 * @param {string} name
 */
export function neverSplit(name) {
  return name.startsWith('zh') || name.startsWith('u_')
}

/**
 * The part of a split index file a word goes to: its letter at position `at`,
 * or "_" when the word ends there or that letter is not one of a-z and 0-9
 * (so file names stay ASCII).
 * @param {string} w
 * @param {number} at
 */
export function partOf(w, at) {
  const c = w[at]
  return c !== undefined && /[a-z0-9]/.test(c) ? c : '_'
}
