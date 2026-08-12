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
