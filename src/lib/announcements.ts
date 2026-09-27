export interface Announcement {
  slug: string
  title: string
  date: string // ISO yyyy-mm-dd
  summary: string
  pinned?: boolean
  body: string[] // paragraphs, rendered in order
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    slug: 'posi-zones-trial',
    title: 'POSI Zones: a tiered reading of the Journal Rankings, published as a trial',
    date: '2026-09-27',
    summary:
      'Every ranked journal now also carries a POSI Zone (POSI 分区): Zone 1 for the top 5% of its ranking, Zone 2 for the next 15%, Zone 3 for the next 30% and Zone 4 for the rest. Zones are published as a trial ahead of the December release of record.',
    body: [
      'PCS quartiles divide each ranking into four equal parts. POSI Zones divide the same ranking into four tiers of unequal size, so that the top tier is selective: Zone 1 holds the top 5% of journals, Zone 2 the next 15%, Zone 3 the next 30% and Zone 4 the remaining half.',
      'Zones use exactly the rank and eligibility of the quartiles; only the cut points differ. They are given within each subject category and across all ranked journals, shown beside the quartile on the ranking tables, journal profiles and record pages, and included in the ranking downloads. No journal is placed in a zone by hand, and Core Collection journals follow the same rule as every other journal.',
      'Zones apply to whichever ranking edition is current, including the global edition covering every indexed journal as it is published.',
      'This is a trial. The first release of record will accompany the annual data release in December, and the method may be refined before then, for example with a three-year citation average, a cap on self-citation and separate handling of review journals. Each change will be versioned and announced here. The rule is set out in the methodology.',
    ],
  },
  {
    slug: 'posi-enters-full-operation',
    title: 'POSI is now in full operation, with its first official data release',
    date: '2026-09-27',
    pinned: true,
    summary:
      'Six weeks after its pre-operational launch, POSI moves into full operation and publishes its first official data release, POSI-R-2026.1: 158,242 journals indexed, the 2026 ranking edition, and every certificate, record and dataset open to public verification.',
    body: [
      'On 12 August 2026, POSI opened to the public as a pre-operational service. From today, 27 September 2026, the Panorama Open Scholarly Index is in full operation. Its index, rankings, certification and certificates are maintained as a standing service of Panorama Scholarly Group Ltd., under the published editorial policy and methodology.',
      'Today POSI also publishes its first official data release, POSI-R-2026.1. It is the edition of record for this year: the journal index, the 2026 ranking edition, subject classification and Core Collection records it contains are fixed, citable, and versioned against the methodology they were computed with. Figures cited from POSI should name the release. Later corrections will be issued as numbered revisions, never as silent edits.',
      'POSI now indexes every scholarly journal with an ISSN that is registered with Crossref or described by OpenAlex: 158,242 journals, merged on ISSN so that each appears once, and more than 300 million publications. Every journal has a profile page, every publisher has its own page, and the whole directory can be searched by title, ISSN or publisher.',
      'The 2026 Journal Rankings rank 4,067 journals by the POSI Citation Score, and 2,963 of them within their subject category. Each rank can be traced to the Crossref records it was computed from. The Core Collection is the certified tier: journals enter it only by applying and passing the POSI Quality Framework evaluation, and certification is reviewed at least once a year.',
      'Certificates of indexing are issued to authors on request and can be checked by anyone: the certificate number is recomputed from the publications listed, and each publication is checked again against Crossref, OpenAlex and the POSI index. Core Collection journals receive a certificate of certification linked to their live record.',
      'POSI is built to be checked rather than trusted. Its data are published under CC BY 4.0, its software under the MIT licence, and every change to the curated corpus is released with an audit. The journal directory, publisher data, ranking edition and record files can be downloaded from the Datasets page.',
      'Full operation is a commitment, not an end point. Coverage is refreshed from Crossref and OpenAlex, methodology changes are versioned and announced here before they take effect, and corrections can be requested through the Contact page. We thank the editors, publishers and researchers who used POSI during the pre-operational period and helped shape it.',
    ],
  },
  {
    slug: 'journal-profiles-and-global-index',
    title: 'Every indexed journal now has a profile page',
    date: '2026-09-27',
    summary:
      'POSI now indexes 158,242 journals from Crossref and OpenAlex, and each has a profile page with identifiers, output and citations per year, subject, topics and ranking.',
    body: [
      'The POSI journal index now covers every scholarly journal with an ISSN that is registered with Crossref or described by OpenAlex: 158,242 journals, merged on ISSN so that each appears once.',
      'Each journal has a profile page showing its ISSNs, publisher, country, publications and citations per year, h-index, article processing charge, subject category, leading research topics and PCS-Q ranking, with links to its publications and its website.',
      'Journal search now runs on the POSI index itself, and returns results by title or ISSN immediately.',
      'The documentation has been consolidated into an editorial policy, a methodology page and a data sources page. Earlier addresses redirect to the new pages.',
    ],
  },
  {
    slug: 'subject-classification-0-3',
    title: 'Subject classification update: a stricter confidence rule and a Multidisciplinary group',
    date: '2026-09-27',
    summary:
      'Subject assignments now need a clearer lead before a journal is ranked within a category. General journals such as Science, Nature and The Lancet are listed as Multidisciplinary.',
    body: [
      'Subject categories are computed from each journal’s OpenAlex topics. Long-established general journals carry topics from many fields, and under the previous rule some of them were assigned to a single category with high confidence, which placed them in that category’s ranking.',
      'Under PSC-CROSSWALK-0.3, a high-confidence assignment requires the leading category to hold at least 35% of the journal’s topic mass and at least 1.5 times the next category. Journals where no category or domain dominates are listed as Multidisciplinary. They are ranked across all journals but not within a subject category.',
      'The 2026 ranking edition has been recalculated under the new rule. Overall ranks are unchanged; 2,963 journals now hold a category rank. The rule is described in the methodology.',
    ],
  },
  {
    slug: 'posi-pre-operational-launch',
    title: 'POSI Begins Pre-Operational Launch on August 12, 2026',
    date: '2026-08-12',
    summary:
      'POSI - Panorama Open Scholarly Index - moves into pre-operational launch on August 12, 2026. Journal indexing, lifecycle ratings, subject rankings, and citation analytics are now live for public use.',
    body: [
      'Starting August 12, 2026, POSI (Panorama Open Scholarly Index) is open for public use in a pre-operational capacity. The Core Collection, Early-Stage and Mature journal ratings (AJR-E / AJR-M), PSC subject rankings, and citation analytics are live and available to search, browse, and cite.',
      '"Pre-operational" means the platform, methodology, and data pipelines are running in production, while we continue to expand coverage, refine the PJR citation-ranking framework, and complete the migration to the POSI 2.0 identity corpus. Figures and rankings shown during this period are computed the same way they will be after the pre-operational period ends - nothing is simulated or placeholder data - but coverage and some derived metrics (such as citation quartiles under PJR) are still being built out.',
      'All ratings and rankings remain fully reproducible from public data and open, version-controlled methodology, as described on the Open Data and Methodology pages. Where a figure is provisional - such as the OpenAlex-based citation preview ahead of the first official PJR release - this is disclosed directly on the relevant page.',
      'We will post updates here as coverage expands, new methodology versions are released, and the platform moves from pre-operational to full operational status. Questions or feedback can be sent through the Contact page.',
    ],
  },
  {
    slug: 'posi-2-0-identity-migration-complete',
    title: 'POSI 2.0 Identity Migration Complete',
    date: '2026-08-12',
    summary:
      'Every journal record POSI tracks - 24,205 in total - now has a permanent POSI-J-###### identity, resolved from public evidence and reproducible from a pinned commit. Full detail on the Open Data page.',
    body: [
      'At launch, POSI\'s journal identity system was mid-migration: records used an older, ad-hoc id scheme inherited from earlier tooling. As of today, that migration is complete - all 24,205 journal records POSI tracks, from the manually-curated Core Collection and Global Benchmark down to the large pool of automatically discovered-but-unreviewed records, now carry a permanent POSI-J-###### identity.',
      'Identity was resolved from public evidence, not asserted: primarily ISSN-L via live OpenAlex lookups, falling back through canonical ISSN pairs and OpenAlex Source IDs only where ISSN-L wasn\'t available. Of the records processed today, 1,031 belonged to the Core Collection and Global Benchmark specifically - 874 received a newly minted id, and 157 turned out to already carry one from the earlier discovered-corpus pass, so the existing id was reused rather than duplicated. Every possible duplicate flagged along the way (171 groups) was resolved with real evidence, not string-matching heuristics: 166 confirmed as the same journal and merged, 5 confirmed distinct and kept separate.',
      'This is an identity/data-layer change, not a ranking or scoring change - no PQF, AJR, or citation figure is affected, and every journal\'s URL and short code on this site is unchanged. What it buys going forward: every journal record now has one stable, permanent id that survives title changes, publisher changes, and future re-classification, which is a prerequisite for the frozen, reproducible PJR release process described in the Methodology pages.',
      'Full audit trail - reproducibility verification, per-group duplicate resolution evidence, and the exact commit each batch was minted from - is linked from the Open Data page.',
    ],
  },
]

export function getSortedAnnouncements(): Announcement[] {
  return [...ANNOUNCEMENTS].sort((a, b) => b.date.localeCompare(a.date))
}

export function getAnnouncementBySlug(slug: string): Announcement | undefined {
  return ANNOUNCEMENTS.find(a => a.slug === slug)
}

export function getLatestAnnouncements(limit = 3): Announcement[] {
  return getSortedAnnouncements().slice(0, limit)
}
