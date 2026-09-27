# Panorama Open Scholarly Index (POSI)

POSI is a citation index, journal ranking and journal directory published by
Panorama Scholarly Group Ltd. This repository contains the source of the
public website, <https://posi.panorama-sg.com>.

## Scope

| Area | Description |
|---|---|
| Journals | Scholarly journals registered with Crossref or described by OpenAlex, organised by subject category, with a profile page for each journal |
| Core Collection | Journals certified after editorial evaluation |
| Rankings | Ranks, percentiles and quartiles by POSI Citation Score, within subject categories and overall |
| Publications | Publication search with citation export |
| Certificates | Verifiable certificates of indexing and Core Collection certificates |

Methods and policies are published on the site under
[Methodology](https://posi.panorama-sg.com/methodology/) and
[Editorial policy](https://posi.panorama-sg.com/editorial-policy/).

## Development

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
npm run build
```

The build produces a static export in `out/`.

## Licensing

- Source code: MIT License (see `LICENSE`).
- POSI data: CC BY 4.0.
- Third-party metadata keeps its original licence.
- Bundled fonts: SIL Open Font License 1.1.

## Responsible use

POSI rankings describe journals. They are not a measure of individual articles
or researchers and should not be the sole basis for hiring, promotion or
funding decisions. See
[Responsible use](https://posi.panorama-sg.com/responsible-use/).

## Contact

Panorama Scholarly Group Ltd., Hong Kong SAR. <posi@panorama-sg.com>
