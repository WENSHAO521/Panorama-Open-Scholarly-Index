// LCC top-level category → keyword list for broad subject matching.
// DOAJ subjects are LCC subclasses (e.g. "Dermatology", "Physics") that often
// don't contain the top-level name, so we match on characteristic keywords.
export const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Medicine: [
    'medicine', 'health', 'clinical', 'surgery', 'surgical', 'pharmacol',
    'pharmacy', 'nursing', 'dentistry', 'dental', 'psychiatr', 'psychol',
    'dermatol', 'ophthalmol', 'pediat', 'oncol', 'pathol', 'physiol',
    'anatom', 'biochem', 'microbiolog', 'virolog', 'immunolog', 'epidemiol',
    'cardiol', 'neurolog', 'orthoped', 'radiolog', 'urolog', 'gastroenterol',
    'hematol', 'endocrinol', 'gynecol', 'obstetric', 'rehabilit', 'toxicol',
    'nutrit', 'infect', 'neoplasm', 'tumor', 'cancer', 'therapeut',
    'diagnos', 'biomedic', 'public health',
  ],
  Science: [
    'science', 'physic', 'chemistr', 'biolog', 'mathemat', 'statistic',
    'astronom', 'geolog', 'ecolog', 'botan', 'zoolog', 'genetic', 'molecul',
    'evolution', 'geophysic', 'meteorolog', 'oceanograph', 'paleontol',
    'crystallograph', 'spectroscop', 'biophysic', 'natural history',
  ],
  Technology: [
    'technolog', 'engineer', 'computer', 'software', 'electrical',
    'mechanical', 'aerospace', 'nuclear', 'materials of', 'manufactur',
    'industrial', 'transport', 'robotic', 'telecommunication', 'electronic',
    'information system', 'computing', 'optic', 'photonic', 'construct', 'mining',
  ],
  'Social Sciences': [
    'social science', 'sociolog', 'economic', 'political', 'anthropolog',
    'demograph', 'criminolog', 'public administration', 'communication',
    'gender', 'international relation', 'social work',
  ],
  Agriculture: [
    'agricultur', 'agron', 'horticultur', 'forestry', 'fisher', 'aquacultur',
    'veterinar', 'animal culture', 'animal husbandry', 'crop', 'soil science',
    'food supply', 'food process', 'plant patholog', 'entomolog',
  ],
  Education: [
    'education', 'pedagogic', 'teaching', 'learning', 'curriculum', 'training',
  ],
  Law: [
    'law', 'legal', 'jurisprudence', 'legislation', 'criminal', 'constitutional',
    'human rights',
  ],
  'Language and Literature': [
    'language', 'literature', 'linguistic', 'philolog', 'translation', 'poetry', 'rhetoric',
  ],
  Philosophy: [
    'philosophy', 'ethic', 'logic', 'metaphysic', 'epistemolog',
  ],
  History: [
    'history', 'historical', 'archaeolog', 'heritage', 'civilization', 'ancient', 'medieval',
  ],
  Geography: [
    'geography', 'cartograph', 'environment', 'climatol', 'geographic', 'geograph',
    'regional planning',
  ],
  'Fine Arts': [
    'fine art', 'music', 'theater', 'theatre', 'dance', 'cinema', 'film',
    'architecture', 'sculpture', 'painting', 'photograph', 'visual art',
    'performing art', 'decorative', 'drawing', 'design',
  ],
  Religion: [
    'religion', 'theolog', 'spiritual', 'faith', 'christian', 'islam',
    'buddhis', 'hinduism', 'jewish',
  ],
}

export function matchSubject(subjects: string[] | null | undefined, subject: string): boolean {
  const keywords = SUBJECT_KEYWORDS[subject] ?? [subject.toLowerCase()]
  return !!subjects?.some(subj => {
    const lower = subj.toLowerCase()
    return keywords.some(kw => lower.includes(kw))
  })
}

export function primarySubject(subjects: string[] | null | undefined): string | null {
  if (!subjects?.length) return null
  for (const top of Object.keys(SUBJECT_KEYWORDS)) {
    if (matchSubject(subjects, top)) return top
  }
  return null
}
