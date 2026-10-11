# POSI Design System — Japanese Editorial Academic

Restrained, exact, professional. Deep green brand, 卯の花 canvas, 利休鼠 greys, 墨 text, 枯茶 accent.
No gradients, glass, heavy shadows, large radii or decorative motifs. Radius is 2px everywhere.

## Tokens
Single source: `src/styles/posi-tokens.css` (`--posi-*`). `src/app/globals.css` keeps the older short
names (`--ink`, `--teal`, `--line`, `--verified` …) as **aliases** so existing components follow the palette.
New code uses `--posi-*`; components never hold raw hex.

| Token | Light | Dark |
|---|---|---|
| canvas | #F8F6F0 | #17231F |
| surface | #FFFFFF | #24332C |
| surface-soft | #F0F2EC | #2C3D33 |
| brand / hover | #244D40 / #1B3F35 | #BFD2C3 / #D6E4D9 |
| text | #2C3430 | #EAE7DD |
| muted | #566659 | #BAC5B9 |
| border | #DEDFD6 | #425249 |
| accent (fills, rules) | #AB8760 | #D1B58A |
| accent-text | #81603A | #D1B58A |
| border-strong (controls, ≥3:1) | #7E8C82 | #6F8277 |

Schemes: Light, Dark, System (default). `ThemeToggle` (utility bar; mobile menu) stores the choice in
this browser's localStorage; `THEME_SCRIPT` applies it before first paint. System = OS preference.
Print always uses a light, high-contrast token set.

## Accent use
枯茶 is sparing: the active-nav underline, dropdown top rule, focus ring on filled buttons, selection tint.
Text in accent colour uses `--posi-accent-text` (AA).

## Status (never colour alone)
success `--posi-success*`, warning, caution, danger, info; each has `-bg` and `-border`. A status always
carries its word or an icon. `Badge` maps every variant to one tone.

| Concept | Display |
|---|---|
| Core Collection | brand-soft fill, text "Core Collection" |
| Indexed | plain text "Indexed" |
| Official | brand-soft fill, text "Official" |
| Provisional | **dashed** border + the word "Provisional" |
| Unranked / Not yet ranked | muted text, "C-Q unranked", "Zone unassigned" |
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
