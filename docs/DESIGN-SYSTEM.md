# POSI Design System — Japanese Editorial Academic

Restrained, exact, professional. Deep green brand, 卯の花 canvas, 利休鼠 greys, 墨 text, 枯茶 accent.
No gradients, glass, heavy shadows or decorative motifs.

Shape (since the October 2026 redesign): controls and chips-in-groups use `--posi-radius` (6px), panels and cards
`--posi-radius-lg` (10px) with `--posi-shadow-card` (a barely-there shadow; none in dark), stand-alone chips are pills.
Body text is 15px. The header is one row (no utility strip); the theme switch sits at its right, the language
switch in the footer and mobile menu.

## Tokens
Single source: `src/styles/posi-tokens.css` (`--posi-*`). `src/app/globals.css` keeps the older short
names (`--ink`, `--teal`, `--line`, `--verified` …) as **aliases** so existing components follow the palette.
New code uses `--posi-*`; components never hold raw hex.

| Token | Light | Dark |
|---|---|---|
| canvas | #F7F7F5 | #161C1A |
| surface | #FFFFFF | #1F2724 |
| surface-soft | #F0F1EE | #27302C |
| brand / hover | #244D40 / #1B3F35 | #BFD2C3 / #D6E4D9 |
| text | #1D2521 | #EAE7DD |
| muted | #56605A | #B3BDB6 |
| border | #E1E3DF | #3A4540 |
| accent (fills, rules) | #AB8760 | #D1B58A |
| accent-text | #81603A | #D1B58A |
| border-strong (controls, ≥3:1) | #7E8A83 | #6C7A72 |

Schemes: Light (default) and Dark. `ThemeToggle`, a sun and a moon (utility bar; mobile menu), stores the choice in
this browser's localStorage; `THEME_SCRIPT` applies it before first paint. The operating system's setting is not followed.
Print always uses a light, high-contrast token set.

## Accent use
枯茶 is sparing: the active-nav underline, dropdown top rule, focus ring on filled buttons, selection tint.
Text in accent colour uses `--posi-accent-text` (AA).

## Status (never colour alone)
success `--posi-success*`, warning, caution, danger, info; each has `-bg` and `-border`. A status always
carries its word or an icon. `Badge` maps every variant to one tone.

Neutrals carry only a slight green bias (October 2026 colour pass), so the brand green stays the one strong hue.
Record states (Verified, Current, Needs check …) are neutral pills with a coloured dot (`.chip-dot`), never a green
fill: green fills belong to the brand (buttons, Core Collection, C-Q1). Links to Web of Science, Scopus and PubMed
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
