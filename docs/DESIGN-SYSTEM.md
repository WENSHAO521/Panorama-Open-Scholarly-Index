# POSI Design System: the catalogue card

Exact, archival, a little warm. The site is set like a library catalogue card and a printed citation index:
warm paper, ink text, hairline rules, one ink-blue brand. No gradients, glass, glows or decorative motifs.
(November 2026 redesign, made with the unslop method by Damir Sokolovsky, CC BY 4.0. It replaces the
October 2026 deep-green palette.)

Type: page titles and the home headline in **Newsreader** (display serif; Chinese pages keep the sans), the
interface in **IBM Plex Sans** (15px body; weights 400 and 500, 600 only for rare emphasis), identifiers and codes
in **IBM Plex Mono**. Labels are sentence case, never uppercase with wide tracking. Sizes come from a short scale:
12, 13, 14, 15, 16, 18, 22/24/28 (section titles), 40 to 60 (home headline). All fonts are vendored in `src/fonts`.

Shape: controls and tags `--posi-radius` (8px), panels and cards `--posi-radius-lg` (12px), the grade strip and
the catalogue card 6px. Spacing on a 4px grid. Depth from hairlines; light shadows only on the catalogue card and
menus. One easing curve, `--ease` (`cubic-bezier(0.22, 1, 0.36, 1)`); transitions name their properties.

## Tokens
Single source: `src/styles/posi-tokens.css` (`--posi-*`). `src/app/globals.css` keeps the older short
names (`--ink`, `--teal`, `--line`, `--verified` …) as **aliases** so existing components follow the palette
(`--teal` now means the ink-blue brand). New code uses `--posi-*`; components never hold raw hex.

| Token | Light | Dark |
|---|---|---|
| canvas (paper) | #F7F4EE | #161513 |
| surface | #FDFBF7 | #1C1A18 |
| surface-soft | #F1ECE3 | #24221F |
| brand / hover | #1F4370 / #173559 | #A9C0DE / #C3D3EA |
| text | #1F1B16 | #EFE9DE |
| text-2 | #3B352E | #D6CFC3 |
| muted | #5E554A | #AAA398 |
| border | #E3DCCF | #34312C |
| border-strong (controls, ≥3:1) | #8A8175 | #6E675D |

Schemes: Light (default) and Dark. `ThemeToggle`, a sun and a moon, stores the choice in this browser's
localStorage; `THEME_SCRIPT` applies it before first paint. Print always uses a light, high-contrast token set.

## Brand use
The ink blue is the one strong hue in the chrome: the primary button (one per screen), links, the selection and
the current quartile/zone fills. Navigation shows the current section as ink text over a 2px ink rule, not a tint.
The `--posi-accent*` names remain for older code and now resolve to the brand. The Panorama red (`#e30613`) is
the logo's and the catalogue card's heading rule only.

## Signature: call numbers
Identifiers (POSI IDs, ISSNs, PSC codes such as `P1.02`) are set in Plex Mono, on a ruled `.id-tag` where they
stand alone. Headline figures sit under a 1px ink rule (`.stat-strip`), like the totals line of a printed index.

## The home page catalogue card
The home hero's one rich object: a Core Collection journal (real data: PSC code, POSI ID, ISSN, title, publisher,
PQF, AJR, article count) set as a catalogue card with a red heading rule and the rod hole. The journal is picked by
the build day from Core journals that have a PQF score, an AJR rating and a Latin-script title.

## Status (never colour alone)
success `--posi-success*`, warning, caution, danger, info; each has `-bg` and `-border`. A status always
carries its word or an icon. `Badge` maps every variant to one tone.

Record states (Verified, Current, Needs check …) are neutral tags with a coloured dot (`.chip-dot`), never a brand
fill: brand fills belong to buttons, Core Collection and C-Q1. Links to Web of Science, Scopus and PubMed
are outlined secondary buttons with a small marker in the index's colour (`.index-mark`), so other sites never
outshine POSI's own actions.

| Concept | Display |
|---|---|
| Core Collection | brand-soft fill, text "Core Collection" |
| Indexed | plain text "Indexed" |
| Official | brand-soft fill, text "Official" |
| Provisional | **dashed** border + the word "Provisional" |
| Unranked / Not yet ranked | muted text, "C-Q unranked", "Zone unassigned" |
| C-Q1 … C-Q4 | Q1 brand fill, Q2 brand-soft, Q3 neutral, Q4 outline |
| Zone 1 … 4 | outlined; Zone 1 brand-soft fill + brand border, Zone 2 brand text, Zone 3 ink-2, Zone 4 muted |
| PQF, AJR, PNCI, C-Q, POSI Zone | always the full acronym in the label ("AJR A+", "C-Q1", "Zone 2") |

## Charts
- Categorical (subject domains): `--posi-cat-1…6` + `--posi-cat-neutral`, low chroma, separate dark set.
  Identity is also in legend text and labels.
- Sequential (map, bars): one hue, `--posi-brand` mixed into `--posi-surface` in 5 log bins; legend lists every bin.
- Two-series line/bars: `--series-1/2` = cat-1/cat-2.

## Components
Buttons (`.btn`, `.btn-primary`, `.btn-sm`: hover, focus ring, disabled = faded + dashed + not-allowed,
`aria-busy` spinner), inputs (`.input`: hover, focus, disabled, `aria-invalid`), `.notice[-success|-warning|-error]`,
`.empty`, `.dtable` + `.table-scroll` (dense tables; mobile scrolls sideways, no column hidden), skeleton pulse
(reduced-motion aware), print rules.

## Fixed marks (not themed)
Panorama block mark: ink blocks follow text colour (as before), the red block is fixed `#e30613`; files in
`public/logos` and certificate documents/PDF/seal are untouched.

## Verification log
- Text/background pairs: all >= 4.5:1 in Light and Dark (scripted); runtime audit of 20 pages x Light/Dark x desktop/mobile found no failing text.
- Categorical chart colours: minimum pairwise CIELAB distance >= 9 under protanopia, deuteranopia and tritanopia simulation (Machado 2009), >= 20 for normal vision.
- Not yet covered: pixel-level visual regression baselines, `next build` static export, certificate artefact recolouring (deliberately untouched).
