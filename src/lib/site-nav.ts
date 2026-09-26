// Primary navigation. One source for the header menu and the footer.

export interface NavLink { label: string; href: string; description?: string }
export interface NavGroup { label: string; href?: string; links?: NavLink[] }

export const PRIMARY_NAV: NavGroup[] = [
  { label: 'Publications', href: '/publications/' },
  {
    label: 'Journals',
    links: [
      { label: 'Browse journals', href: '/journals/', description: 'Every indexed journal, by subject category' },
      { label: 'Core Collection', href: '/core-collection/', description: 'Journals certified after editorial evaluation' },
      { label: 'Open access directory', href: '/journals/open-access/', description: 'Open access journals by subject' },
      { label: 'Publishers', href: '/publishers/', description: 'Publishers and their journals' },
      { label: 'Subject categories', href: '/subjects/', description: 'The PSC subject classification' },
    ],
  },
  {
    label: 'Rankings',
    links: [
      { label: 'Journal Rankings', href: '/rankings/', description: 'Ranks, percentiles and quartiles by subject category' },
      { label: 'Overall ranking', href: '/rankings/all/', description: 'All ranked journals in one list' },
      { label: 'Lifecycle ratings', href: '/ratings/', description: 'AJR ratings for Core Collection journals' },
      { label: 'Citation Score (PCS)', href: '/pcs/', description: 'How the ranking metric is calculated' },
    ],
  },
  {
    label: 'Services',
    links: [
      { label: 'Certificate of indexing', href: '/certificate/', description: 'For authors of indexed publications' },
      { label: 'Verify a certificate', href: '/certificate/verify/', description: 'Check a certificate number' },
      { label: 'Journal certification', href: '/certification/', description: 'Apply for the Core Collection' },
      { label: 'Journal badges', href: '/badges/', description: 'Badges for Core Collection journals' },
    ],
  },
  { label: 'Data', href: '/datasets/' },
  {
    label: 'About',
    links: [
      { label: 'About POSI', href: '/about/' },
      { label: 'Documentation', href: '/docs/' },
      { label: 'Editorial policies', href: '/coverage/policy/' },
      { label: 'Responsible use', href: '/responsible-use/' },
      { label: 'News', href: '/announcements/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
]

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: 'Search',
    links: [
      { label: 'Publications', href: '/publications/' },
      { label: 'Journals', href: '/journals/' },
      { label: 'Publishers', href: '/publishers/' },
      { label: 'Subject categories', href: '/subjects/' },
      { label: 'Journal Rankings', href: '/rankings/' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Certificate of indexing', href: '/certificate/' },
      { label: 'Verify a certificate', href: '/certificate/verify/' },
      { label: 'Journal certification', href: '/certification/' },
      { label: 'Data downloads', href: '/datasets/' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About POSI', href: '/about/' },
      { label: 'Documentation', href: '/docs/' },
      { label: 'Editorial policies', href: '/coverage/policy/' },
      { label: 'Responsible use', href: '/responsible-use/' },
      { label: 'News', href: '/announcements/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of use', href: '/terms/' },
      { label: 'Privacy policy', href: '/privacy/' },
      { label: 'Conflict of interest', href: '/coi/' },
      { label: 'Operator information', href: '/operator/' },
    ],
  },
]
