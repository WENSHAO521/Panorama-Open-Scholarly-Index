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
    slug: 'multilingual-interface-plan',
    title: 'Plan: a multilingual POSI interface, in four stages from October 2026',
    date: '2026-10-12',
    summary:
      'POSI will add interface languages in stages, starting with Simplified Chinese. This notice sets out the stages, what each one delivers, what stays in English on purpose, and how we will report progress. Dates are plans, not commitments.',
    body: [
      'Why. Most of POSI is read by authors and editors outside English-speaking countries, and the certificate and citation tools are used heavily in China. An interface in the reader\'s own language lowers the cost of checking a journal, a ranking or a certificate. We are adding languages in stages so each one can be finished, reviewed and kept up to date before the next begins.',
      'Stage 1, foundation (October to November 2026). Interface text is moved out of the pages into language files, pages gain a language-aware address (for example /zh/journals/) with the current English addresses unchanged, and a language switcher is added to the header and footer. Nothing changes for readers at this stage except the switcher, which offers English only. Done when: every page builds in English from the language files and no existing URL has changed.',
      'Stage 2, Simplified Chinese interface (December 2026 to January 2027). Navigation, search, journal and publication pages, rankings tables, the Core Collection, the certificate and citation tools, and the data pages. Done when: every page reachable from the main menu is available in Simplified Chinese and has been checked by a native-speaking reviewer.',
      'Stage 3, documentation (February to March 2027). The about, editorial policy, methodology, grades, ratings and legal pages. Until a page is translated, the Chinese interface links to its English original and says so. Done when: the pages above are translated and each shows the date of the English version it was translated from.',
      'Stage 4, further languages (from April 2027). Which language comes next is decided by usage and by requests sent through the contact page. A language is added only when a reviewer is available to keep it current.',
      'What stays in English on purpose. Evaluation terms and codes (PQF, AJR, PNCI, PCS, C-Q1 to C-Q4, POSI Zone), POSI-J identifiers, ISSNs, journal and publisher names, and the PSG citation format are identical in every language, so a grade means the same thing wherever it is read. Certificates, their verification pages and the downloadable data files remain in English. Where a translated page and the English page differ, the English page is authoritative.',
      'What does not change. This plan changes presentation only. No PQF, AJR, citation indicator, ranking or Zone is affected, and the evaluation methodology is not altered by translation.',
      'How we will report. The state of each stage (planned, in progress, released) is posted here in News at the end of every stage, and dates are revised in this notice if they move. Corrections to a translation, and requests for a language, can be sent through the contact page.',
    ],
  },
  {
    slug: 'october-2026-updates',
    title: 'October 2026 updates: certificates for DataCite and Zenodo DOIs, PSG citation tools, new journals',
    date: '2026-10-11',
    summary:
      'Indexing certificates now check DOIs registered with DataCite and Zenodo as well as Crossref and OpenAlex, and link each publication to Google Scholar. Publication search and pages draw on DataCite and Zenodo too, the citation generator converts reference lists to PSG in batch, AI Med joins the Core Collection, and 1,654 Wiley journals join the index.',
    body: [
      'Indexing certificates. Each DOI is now checked at the agency that registered it, as named by doi.org. Besides Crossref and OpenAlex, a publication is indexed when DataCite, or Zenodo for a Zenodo DOI, holds it as a journal article that is part of a journal with an ISSN. The check results and the verification page say which source indexed each publication. A journal article whose record names no journal ISSN is now reported as such, not as “not a journal publication”. Google Scholar has no public API and does not allow automated queries, so it cannot be part of the check; each result links to a Google Scholar search so the listing can be confirmed by hand. Certificates issued earlier verify as before.',
      'Publication search and publication pages. DataCite and Zenodo are now sources alongside OpenAlex and Crossref, so DOIs from repositories such as Zenodo, figshare and Dryad resolve, and search keeps working when OpenAlex is busy. DOI lookups go straight to the registry that holds the DOI. When a source cannot be reached, the page now says whether it timed out, was rate limited or was unavailable, and reports “not found” only when a registry actually says so.',
      'Citation generator. References can be converted to the PSG format in batch: lists of DOIs (over 100 at a time), BibTeX, RIS and CSL JSON, and reference text in APA, AMA, Chicago, MLA, GB/T, IEEE and Harvard styles. Articles can also be found by title. Batch output includes PSG in-text citations and a/b year suffixes, as the PSG format page describes.',
      'Journals. AI Med (E-ISSN 3079-4757) has joined the Core Collection. 1,654 Wiley journals with Crossref articles from 2018 onwards that were missing from the index have been added. Those DOAJ does not list are classed as open access, not in DOAJ. Publisher names, titles and print/online ISSNs have been corrected on a number of Wiley records.',
      'Corrections to any record can be requested through the contact page.',
    ],
  },
  {
    slug: 'ajr-1-2',
    title: 'AJR-E-1.2 and AJR-M-1.2: publisher policies and Crossref records as evidence',
    date: '2026-10-03',
    summary:
      'From the October 2026 monthly rerate (7 October), AJR ratings are computed as AJR-E-1.2 and AJR-M-1.2. The formulas are unchanged; evidence a journal’s website does not show can now come from a verified publisher-wide policy or, for licensing and corrections, from the journal’s own Crossref records.',
    body: [
      'From the monthly rerate of 7 October 2026, AJR ratings of Core Collection journals are computed as AJR-E-1.2 and AJR-M-1.2, with Evidence Coverage EC-1.1. The dimensions, weights, thresholds and rating scale are unchanged.',
      'What changes is where the evidence may come from. The journal’s own website comes first. Where it does not show a policy, a publisher-wide policy that POSI has verified as covering all the publisher’s journals now counts for twelve policies (previously six): publication ethics, corrections, authorship, conflicts of interest, AI use, data, similarity checking, research ethics, complaints and appeals, copyright, ownership and advertising. Journal-specific items such as the editorial board, the peer-review process, the access model and fees never come from a publisher.',
      'In addition, the journal’s own Crossref records now count for two items. Of its newest articles published in the last three years (up to 100, at least 20), when at least half carry a licence for the published article, that is evidence of its copyright and licensing terms; when at least half carry a Crossmark update policy, that is its corrections and retractions policy. Statements in individual articles, such as review dates or conflict-of-interest declarations, do not count as the journal’s policy.',
      'A later source only fills what an earlier one could not resolve and never overrides what the journal’s website shows. Ratings published before then keep their AJR-E-1.1 stamp; every rating states its model version and date.',
    ],
  },
  {
    slug: 'ajr-core-collection-only',
    title: 'AJR published for Core Collection journals only',
    date: '2026-10-03',
    pinned: true,
    summary:
      'From 3 October 2026, AJR, the Journal Development Rating, is published for Core Collection journals only. Other journals, including those found through journal search, no longer show an AJR section. No published AJR score or rating changes.',
    body: [
      'From 3 October 2026, AJR (AJR-E and AJR-M) is published for Core Collection journals only: journals that applied for certification and passed the PQF editorial evaluation.',
      'An AJR rating rests on evidence from the journal’s own website: editorial governance, peer review, research integrity and transparency policies. POSI collects and checks this evidence every month for Core Collection journals. For other journals it cannot be collected reliably, since many publisher platforms refuse automated access, so a rating there would rest on too little evidence.',
      'Journals outside the Core Collection no longer show an AJR section, lifecycle stage or rating on their journal pages, in journal search results, in the Citation Ranking tables or in the data files published with each journal record. No journal outside the Core Collection had a published AJR score, so no score or rating is withdrawn.',
      'Core Collection journals are re-rated every month, on the 7th. Citation Rankings, Citation Quartiles, POSI Zones, PNCI and PCS are unchanged. AJR is described on the AJR ratings page and in the methodology.',
    ],
  },
  {
    slug: 'pci-core-collection-only',
    title: 'PCI reported for Core Collection journals only',
    date: '2026-09-30',
    pinned: true,
    summary:
      'From 30 September 2026, PCI, the POSI Citation Impact, is a Core Collection indicator and is reported for Core Collection journals only. Journals outside the Core Collection no longer show a PCI. Ranks, Citation Quartiles and POSI Zones are unchanged.',
    body: [
      'From 30 September 2026, PCI, the POSI Citation Impact, is a Core Collection indicator. It is reported for Core Collection journals only: journals that applied for certification and passed the PQF editorial evaluation.',
      'Journals outside the Core Collection no longer show a PCI on their journal pages, in the evaluation panel, in the Citation Ranking tables or in the data files published with each journal record. Their citation performance continues to be shown by PNCI and PCS.',
      'PCI has never determined a rank, quartile or zone. The official Citation Ranking is based on PNCI, so no rank, Citation Quartile or POSI Zone changes. PQF, AJR, PNCI, PCS and the 2026 Citation Ranking are otherwise as published.',
      'A Core Collection journal shows a PCI once it has citable items in the two-year PCI window. The indicator is described on the citation indicators page and in the methodology.',
    ],
  },
  {
    slug: 'citation-ranking-2026',
    title: 'Publication of the 2026 POSI Citation Ranking',
    date: '2026-09-28',
    pinned: true,
    summary:
      'POSI has published the 2026 Citation Ranking, the first edition under POSI Journal Evaluation Architecture 1.0. Of 158,242 indexed journals evaluated, 50,983 are ranked by PNCI within 30 subject categories, with Citation Quartiles and POSI Zones.',
    body: [
      'On 28 September 2026, POSI published the 2026 Citation Ranking (CITATION-RANK-1.0, PNCI-1.0). It is the first edition computed under POSI Journal Evaluation Architecture 1.0 and supersedes the PCS-based ranking previously published for 2026. PCS continues to be published as a supplementary indicator and does not determine any rank, quartile or zone.',
      'All 158,242 journals in the POSI index were evaluated. 50,983 journals are ranked within their PSC subject category, across 30 categories: 47,847 hold an official ranking and 3,136 a provisional ranking. For each ranked journal, POSI publishes its rank, percentile and Citation Quartile (C-Q1 to C-Q4), and its POSI Zone where the category meets the minimum size.',
      'Journals are ranked by PNCI, the POSI Normalized Citation Indicator, which compares the citations of each item with those of items of the same subject field, publication year and document type. A ranking requires sufficient evidence of citable items, publication years and citation coverage. Journals that do not meet these requirements, or whose subject assignment is not sufficiently certain, are evaluated but not ranked; their journal pages state the ranking status and the reason.',
      'PCI is reported for Core Collection journals only (from 30 September 2026; see the announcement PCI reported for Core Collection journals only). It is descriptive and does not affect rank, quartile or zone.',
      'The ranking can be consulted on the Rankings pages and on each journal page, and downloaded from the Rankings and Datasets pages. The method, including thresholds, tie handling and limitations, is set out in the methodology.',
      'The Citation Ranking is published once a year, in early December. The 2026 edition was published on 28 September, on POSI’s entry into full operation. Journals added to the index during the year are ranked in the next annual edition.',
    ],
  },
  {
    slug: 'journal-evaluation-architecture-1-0',
    title: 'POSI Journal Evaluation Architecture 1.0: PNCI Citation Rankings, AJR Ratings and Citation Quartiles',
    date: '2026-09-28',
    pinned: true,
    summary:
      'POSI now evaluates journals in five separate layers: PQF for Core Collection eligibility, AJR ratings (A+ to D) for lifecycle development, the PCI, PNCI and PCS citation indicators, a Citation Ranking by PNCI within each subject category with Citation Quartiles C-Q1 to C-Q4, and POSI Zones. PCS-based quartiles and the E-Q and M-Q quartiles are retired.',
    body: [
      'PQF decides Core Collection eligibility and nothing else: a score from 0 to 100 and a status of Eligible (70 and above), Review Required (50 to 69.99), Insufficient Evidence (40 to 49.99) or Not Eligible (below 40). PQF is not a citation ranking and does not determine Citation Quartiles or POSI Zones.',
      'AJR rates a journal’s lifecycle and publishing development: AJR-E for journals 12 to 59 months old, AJR-M from 60 months, and an observation period before that. Each gives an AJR Score and an AJR Rating from A+ (90 and above) to D (below 50). AJR Ratings are absolute lifecycle ratings, not citation quartiles; the E-Q and M-Q quartiles are withdrawn and are not converted into ratings.',
      'The official Citation Ranking uses PNCI, the POSI Normalized Citation Indicator: each item’s citations relative to items of the same subject field, publication year and document type. Journals are ranked within their PSC category; tied journals share rank and percentile; the percentile gives the Citation Quartile (C-Q1 at 75 and above) and the POSI Zone (Zone 1 at 95 and above, Zone 2 at 80, Zone 3 at 50). An official ranking needs at least 20 eligible items from two publication years and 90% citation coverage; categories need 20 ranked journals for quartiles and 50 for official zones.',
      'PCS remains published as a supplementary independent citation indicator. It no longer determines any rank, quartile or zone, and the PCS-Q quartiles and the PCS-based zone trial are retired. The first Citation Ranking edition under PNCI-1.0 was computed from item-level citation data and published on 28 September 2026; see the announcement Publication of the 2026 POSI Citation Ranking. Zone certificates issued under the PCS-based trial no longer verify.',
      'The complete method, with formulas, thresholds, tie handling, versions and limitations, is set out in the methodology.',
    ],
  },
  {
    slug: 'global-ranking-edition-2026',
    title: 'The 2026 Journal Rankings now cover every indexed journal',
    date: '2026-09-27',
    summary:
      'The global edition of the 2026 Journal Rankings computes the POSI Citation Score for all 158,242 indexed journals and ranks 103,021 of them, 51,029 within their subject category. Rankings will be refreshed monthly.',
    body: [
      'The 2026 Journal Rankings were first published for the 4,320 journals POSI had curated. The global edition extends them to the whole index: the POSI Citation Score (PCS) has been computed from Crossref for every one of the 158,242 indexed journals, from the works each published in 2022 to 2025 and the citations those works received.',
      '103,021 journals are ranked across all ranked journals, and 51,029 of them also within their subject category. A journal is ranked within a category when its subject assignment is confident and the category holds at least 20 ranked journals; general journals such as Science, Nature and The Lancet are ranked across all journals as Multidisciplinary.',
      'A journal is not ranked when Crossref holds no works for it in the four-year window under any of its ISSNs (50,550 journals, for example journals that have ceased or that register their DOIs with another agency), or when it published fewer than five citable items. These journals keep their profile pages and remain in the index; they are ranked as soon as their citation data allow.',
      'Journals are looked up under each of their ISSNs in turn, so a journal whose first ISSN has fallen out of use is still found under its current one. Each edition passes an automatic quality check before it is published, and the check is recorded with the edition.',
      'The rankings will be refreshed from Crossref and OpenAlex at the start of every month. The global edition is published as a data snapshot; the ranking of record for 2026 will be fixed in the December release. POSI Zones apply to the global edition in the same way, and the full edition can be downloaded, by subject category or as one CSV file, from the Datasets page.',
    ],
  },
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
      'The 2026 Journal Rankings now cover the whole index: 103,021 journals are ranked by the POSI Citation Score, 51,029 of them within their subject category. POSI-R-2026.1 carries the first, 4,067-journal edition; the global edition is published as a data snapshot and becomes the ranking of record with the December release. Each rank can be traced to the Crossref records it was computed from. The Core Collection is the certified tier: journals enter it only by applying and passing the POSI Quality Framework evaluation, and certification is reviewed at least once a year.',
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
