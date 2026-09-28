// Where the browser loads POSI's data files from. They are published on the
// data layer (posi-data-delivery serves the site-data release at
// https://data.posi.panorama-sg.com/site/v1/), so this site is a front end
// and its deploy carries no data. In development they come from this site's
// own /data routes. NEXT_PUBLIC_DATA_BASE overrides both.
// "v1" is the file format: a change the deployed pages cannot read is
// published as v2 alongside v1 (see .github/workflows/publish-site-data.yml).

export const DATA_BASE: string = process.env.NEXT_PUBLIC_DATA_BASE
  ?? (process.env.NODE_ENV === 'development' ? '/data' : 'https://data.posi.panorama-sg.com/site/v1')

/** URL of a data file, from its path under /data/ ("j/0141.json"). */
export const dataUrl = (path: string) => `${DATA_BASE}/${path}`
