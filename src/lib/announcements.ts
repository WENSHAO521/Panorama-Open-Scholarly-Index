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
    slug: 'posi-pre-operational-launch',
    title: 'POSI Begins Pre-Operational Launch on August 12, 2026',
    date: '2026-08-12',
    pinned: true,
    summary:
      'POSI — Panorama Open Scholarly Index — moves into pre-operational launch on August 12, 2026. Journal indexing, lifecycle ratings, subject rankings, and citation analytics are now live for public use.',
    body: [
      'Starting August 12, 2026, POSI (Panorama Open Scholarly Index) is open for public use in a pre-operational capacity. The Core Collection, Early-Stage and Mature journal ratings (AJR-E / AJR-M), PSC subject rankings, and citation analytics are live and available to search, browse, and cite.',
      '"Pre-operational" means the platform, methodology, and data pipelines are running in production, while we continue to expand coverage, refine the PJR citation-ranking framework, and complete the migration to the POSI 2.0 identity corpus. Figures and rankings shown during this period are computed the same way they will be after the pre-operational period ends — nothing is simulated or placeholder data — but coverage and some derived metrics (such as citation quartiles under PJR) are still being built out.',
      'All ratings and rankings remain fully reproducible from public data and open, version-controlled methodology, as described on the Open Data and Methodology pages. Where a figure is provisional — such as the OpenAlex-based citation preview ahead of the first official PJR release — this is disclosed directly on the relevant page.',
      'We will post updates here as coverage expands, new methodology versions are released, and the platform moves from pre-operational to full operational status. Questions or feedback can be sent through the Contact page.',
    ],
  },
  {
    slug: 'posi-2-0-identity-migration-complete',
    title: 'POSI 2.0 Identity Migration Complete',
    date: '2026-08-12',
    summary:
      'Every journal record POSI tracks — 24,205 in total — now has a permanent POSI-J-###### identity, resolved from public evidence and reproducible from a pinned commit. Full detail on the Open Data page.',
    body: [
      'At launch, POSI\'s journal identity system was mid-migration: records used an older, ad-hoc id scheme inherited from earlier tooling. As of today, that migration is complete — all 24,205 journal records POSI tracks, from the manually-curated Core Collection and Global Benchmark down to the large pool of automatically discovered-but-unreviewed records, now carry a permanent POSI-J-###### identity.',
      'Identity was resolved from public evidence, not asserted: primarily ISSN-L via live OpenAlex lookups, falling back through canonical ISSN pairs and OpenAlex Source IDs only where ISSN-L wasn\'t available. Of the records processed today, 1,031 belonged to the Core Collection and Global Benchmark specifically — 874 received a newly minted id, and 157 turned out to already carry one from the earlier discovered-corpus pass, so the existing id was reused rather than duplicated. Every possible duplicate flagged along the way (171 groups) was resolved with real evidence, not string-matching heuristics: 166 confirmed as the same journal and merged, 5 confirmed distinct and kept separate.',
      'This is an identity/data-layer change, not a ranking or scoring change — no PQF, AJR, or citation figure is affected, and every journal\'s URL and short code on this site is unchanged. What it buys going forward: every journal record now has one stable, permanent id that survives title changes, publisher changes, and future re-classification, which is a prerequisite for the frozen, reproducible PJR release process described in the Methodology pages.',
      'Full audit trail — reproducibility verification, per-group duplicate resolution evidence, and the exact commit each batch was minted from — is linked from the Open Data page.',
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
