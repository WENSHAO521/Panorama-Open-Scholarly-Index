#!/usr/bin/env node
/**
 * drop-served-data.mjs — runs after the size check (npm "postbuild").
 *
 * On Cloudflare Pages (CF_PAGES=1) removes out/data/: the pages read their
 * data from the data layer (src/lib/data-base.ts), which serves the same
 * files from the site-data release (.github/workflows/publish-site-data.yml),
 * so the site's deploy carries pages only. Old /data/ links redirect there
 * (public/_redirects). Other builds keep out/data/, which the publish
 * workflow packs.
 */
import { rmSync } from 'fs'

if (process.env.CF_PAGES === '1') {
  rmSync('out/data', { recursive: true, force: true })
  console.log('drop-served-data: removed out/data (served by data.posi.panorama-sg.com/site/v1/)')
}
