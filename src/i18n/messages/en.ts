// English interface text. It is the reference: every other language is typed against `typeof en`, so a missing
// key fails `npm run typecheck`. Identifiers, ISSNs, journal and publisher names and the evaluation terms
// (PQF, AJR, PNCI, PCS, C-Q1 to C-Q4, POSI Zone) are not translated and do not belong in these files.
export const en = {
  common: { skipToContent: 'Skip to content', documentation: 'Documentation' },
  header: {
    orgName: 'Panorama Scholarly Group Ltd.',
    brand: 'Panorama Open Scholarly Index',
    brandShort: 'POSI',
    homeLabel: 'POSI home',
    searchLabel: 'Search publications',
    searchPlaceholder: 'Search publications, or enter a DOI',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    colourScheme: 'Colour scheme',
    language: 'Language',
    theme: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    navUtility: 'Utility',
    navPrimary: 'Primary',
    navMobile: 'Mobile',
  },
  footer: {
    blurb: 'The Panorama Open Scholarly Index is a citation index, journal ranking and open access journal directory, published by Panorama Scholarly Group Ltd.',
    openSource: 'POSI is open source. Its data, methods and software are published under open licences.',
    copyrightLead: 'Panorama Scholarly Group Ltd. POSI data are licensed under',
    licenceName: 'CC BY 4.0',
    copyrightTail: 'Third-party metadata remain under their original licences.',
    independence: 'POSI is independent of Web of Science, Scopus and DOAJ.',
  },
  notFound: {
    title: 'This page is not in the index',
    body: 'The address may have moved during the redesign. Search publications and journals, or start from the documentation.',
    searchPublications: 'Search publications',
    browseSources: 'Browse sources',
  },
  nav: {
    primary: {
      journals: {
        label: 'Journals',
        links: {
          browseJournals: { label: 'Browse journals', description: 'Every indexed journal, by subject category' },
          coreCollection: { label: 'Core Collection', description: 'Journals certified after editorial evaluation' },
          openAccessDirectory: { label: 'Open access directory', description: 'Open access journals by subject' },
          publishers: { label: 'Publishers', description: 'Publishers and their journals' },
          subjectCategories: { label: 'Subject categories', description: 'The PSC subject classification' },
        },
      },
      rankings: {
        label: 'Rankings',
        links: {
          citationRankings: {
            label: 'Citation Rankings',
            description: 'PNCI ranks, Citation Quartiles and POSI Zones by subject category',
          },
          allCategories: { label: 'All categories', description: 'Every ranked journal, with its category rank' },
          methodology: {
            label: 'Methodology',
            description: 'PQF, AJR, citation indicators and the ranking method',
          },
        },
      },
      publications: { label: 'Publications' },
      services: {
        label: 'Services',
        links: {
          certificateOfIndexing: { label: 'Certificate of indexing', description: 'For authors of indexed publications' },
          verifyACertificate: { label: 'Verify a certificate', description: 'Check a certificate number' },
          zoneCertificate: {
            label: 'Zone certificate',
            description: 'A journal’s official POSI Zone in its subject category',
          },
          journalCertification: { label: 'Journal certification', description: 'Apply for the Core Collection' },
          citationGenerator: {
            label: 'Citation generator',
            description: 'Convert one or many DOIs, titles or references to PSG, APA, MLA and Chicago',
          },
          pSGCitationFormat: { label: 'PSG citation format', description: 'The PSG author-date citation standard' },
          logosAndJournalMarks: {
            label: 'Logos and journal marks',
            description: 'POSI marks for indexed and Core Collection journals',
          },
        },
      },
      data: { label: 'Data' },
      about: {
        label: 'About',
        links: {
          aboutPOSI: { label: 'About POSI', description: 'Publisher, coverage and independence' },
          editorialPolicy: { label: 'Editorial policy', description: 'Indexing, certification and coverage changes' },
          documentation: { label: 'Documentation', description: 'Data sources, schema and provenance' },
          news: { label: 'News', description: 'Updates and coverage changes' },
          contact: { label: 'Contact', description: 'Corrections, certification and data enquiries' },
        },
      },
    },
    utility: {
      editorialPolicy: 'Editorial policy',
      methodology: 'Methodology',
      documentation: 'Documentation',
      contact: 'Contact',
    },
    footer: {
      search: {
        title: 'Search',
        links: {
          publications: 'Publications',
          journals: 'Journals',
          publishers: 'Publishers',
          subjectCategories: 'Subject categories',
          citationRankings: 'Citation Rankings',
        },
      },
      services: {
        title: 'Services',
        links: {
          certificateOfIndexing: 'Certificate of indexing',
          verifyACertificate: 'Verify a certificate',
          zoneCertificate: 'Zone certificate',
          journalCertification: 'Journal certification',
          citationGenerator: 'Citation generator',
          pSGCitationFormat: 'PSG citation format',
          logosAndJournalMarks: 'Logos and journal marks',
          dataDownloads: 'Data downloads',
        },
      },
      about: {
        title: 'About',
        links: {
          aboutPOSI: 'About POSI',
          editorialPolicy: 'Editorial policy',
          methodology: 'Methodology',
          documentation: 'Documentation',
          news: 'News',
          contact: 'Contact',
        },
      },
      legal: {
        title: 'Legal',
        links: {
          termsOfUse: 'Terms of use',
          privacyPolicy: 'Privacy policy',
          responsibleUse: 'Responsible use',
          conflictOfInterest: 'Conflict of interest',
        },
      },
    },
  },
  docs: {
    about: {
      title: 'About',
      blurb: 'Who publishes POSI, what it covers, and how to reach us.',
      links: {
        aboutPOSI: 'About POSI',
        news: 'News',
        contact: 'Contact',
      },
    },
    policies: {
      title: 'Policies',
      blurb: 'Indexing, certification, coverage changes and appropriate use.',
      links: {
        editorialPolicy: 'Editorial policy',
        responsibleUse: 'Responsible use',
        conflictOfInterest: 'Conflict of interest',
      },
    },
    methodology: {
      title: 'Methodology',
      blurb: 'The evaluation architecture: PQF, AJR, citation indicators and the Citation Rankings.',
      links: {
        methodology: 'Methodology',
        howToReadPOSIGrades: 'How to read POSI grades',
        pQFCoreCollectionEligibility: 'PQF: Core Collection eligibility',
        aJRRatings: 'AJR ratings',
        aJRE: 'AJR-E',
        aJRM: 'AJR-M',
        citationIndicators: 'Citation indicators',
        certificates: 'Certificates',
        pSGCitationFormat: 'PSG citation format',
      },
    },
    data: {
      title: 'Data',
      blurb: 'Sources, record fields, provenance and downloads.',
      links: {
        documentationHome: 'Documentation home',
        dataSourcesAndAccess: 'Data sources and access',
        recordSchema: 'Record schema',
        provenanceAndVerification: 'Provenance and verification',
      },
    },
    legal: {
      title: 'Legal',
      blurb: 'Terms of use and privacy.',
      links: { termsOfUse: 'Terms of use', privacyPolicy: 'Privacy policy' },
    },
  },
}
