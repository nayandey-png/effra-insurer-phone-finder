# Effra Insurer Phone Finder

A step-by-step tool for UK private-clinic staff (receptionists and practice managers). They pick an insurer and what they need to do, and get the right phone number, phone-menu path, opening hours and tips. Most paths take 2–3 taps.

It's a public Effra web asset, embedded in the Framer site in the same way as the PMI admin cost calculator. It has no backend, no analytics, no external network calls and no `localStorage`.

```
index.html          The tool (markup, CSS, UI). Open it directly in a browser.
src/data.js         ★ ALL insurer data: numbers, menus, hours, tips, Last checked date.
src/engine.js       Routing logic (no data, no DOM).
assets/logos/       Insurer logos (see below).
assets/fonts/       Manrope web font + licence (see "Fonts").
build.js            Builds everything in dist/ from the files above.
test/               npm test: walks every path, checks the table and CSV.
VERIFY.md           Every assumption to confirm with the billing team.
dist/
  InsurerPhoneFinder.framer.tsx   → paste into a Framer code component
  insurer-table.html              → crawlable table, grouped by insurer
  insurer-routes.csv              → the same rows, for a Framer CMS import
  insurer-finder.html             → the built tool as a single file (handy for previewing)
```

## Commands
Needs Node 18 or later. There are no dependencies to install.

```bash
npm test
```

```bash
npm run build
```

```bash
npm run build:framer
```

- `npm test` checks every path ends at a number, every route appears in the table and CSV, the open/closed logic, and the build output.
- `npm run build` regenerates all of `dist/`.
- `npm run build:framer` regenerates only the Framer component (and the preview).

**Always run `npm test` and then `npm run build` after changing anything**, then commit `dist/` too. The tool, table and CSV are all generated from `src/data.js`, so they stay in step as long as you rebuild.

## Updating the data
Everything lives in **`src/data.js`**. The comments at the top of that file explain each field.

- **Change a number or its hours:** find the insurer, then the `lines` section, and edit `number` or `hours`. Every route using that line updates.
  Hours look like `[{ days: "Mon-Fri", from: "09:00", to: "17:00" }]` in UK time on the 24-hour clock. Use `"24/7"`, or `null` if the hours aren't known; `null` hides the hours line (no badge) and leaves the hours cell empty in the table and CSV.
- **Change a menu path:** edit the route's `menu`, e.g. `["1", "2"]` shows "Press 1 → Press 2".
- **Other numbers on a card:** list them in the route's `alternatives`, e.g. `[{ line: "billing", menu: ["4"], label: "Invoicing & payment queries" }]`. They appear below the main number in a secondary "Other … lines" section, collapsed on phones and open on wider screens.
- **Change a tip:** edit `tips` on the route. Tips on a line apply to every route using it, and tips on the insurer apply to all its routes.
- **Change wording of a question or answer:** edit the `questions` section at the bottom.
- **Add a route:** copy an existing route and give it a new `id` and `when`. Then run `npm test`, which tells you if a path now leads nowhere or to two places.
- **Add a new number:** also add it to `SOURCE_NUMBERS` in `test/paths.test.js`. This is a deliberate double-check that every number comes from a source.
- **Leave a source number out on purpose:** add it to `EXCLUDED_SOURCE_NUMBERS` in `test/paths.test.js`, with a comment saying why. The test then checks it stays out of the tool, table and CSV.

To check the whole tree, open **`index.html?debug=1`**. It lists every insurer × query × follow-up path and its result, with assumptions highlighted. The debug view is stripped from the build.

### The "Last checked" date
Edit `lastChecked` near the top of `src/data.js` (e.g. `"February 2027"`) and rebuild. The same value is used in the tool's footer, the table and the CSV.

### The Effra link
The "See how →" link on each result goes to that insurer's Effra page, set by `ctaUrl` on the insurer in `src/data.js`. Bupa, AXA, Aviva, Vitality, WPA and Healix have their own pages. Insurers without a `ctaUrl` (Allianz, Cigna, AXA Global, Bupa Global) use `cta.defaultUrl` (`https://www.effra.io/#how-it-works`). Links open with `target="_top"`, so they navigate the Effra page itself, not the inside of the iframe.

## Logos
Logos live in `assets/logos/`, named by insurer id. All 10 are in place as PNGs:

| Insurer | File |
|---|---|
| Allianz | `allianz.png` |
| Aviva | `aviva.png` |
| AXA | `axa.png` |
| AXA Global | `axa-global.png` |
| Bupa | `bupa.png` |
| Bupa Global | `bupa-global.png` |
| Cigna | `cigna.png` |
| Healix Health | `healix.png` |
| Vitality | `vitality.png` |
| WPA | `wpa.png` |

The build inlines them as data URIs, so the Framer component stays self-contained. If a file is missing, the tool shows a clean initials badge instead. `npm test` checks that every insurer has a logo.

**Replacing a logo:** use **SVG or PNG** (convert WebP or JPEG first), named `<id>.svg` or `<id>.png`. An SVG takes priority over a PNG with the same name. For consistent sizes, prepare it like the current files:
- a **240 × 160 px PNG** with a transparent background;
- the logo centred, with about 8% padding, and its aspect ratio kept;
- outer white or light-grey margins trimmed, but a coloured brand tile (e.g. AXA navy) kept whole;
- no white logo on a transparent background, because it would vanish on the white logo box.

Logos are shown in a 3:2 box: 60 × 40 px on the insurer buttons and 36 × 24 px in the small header chip.

## Brand styling
The brand tokens are CSS custom properties at the top of `index.html` (`:root { --ipf-… }`). They hold Effra's values, read from www.effra.io:

| Token | Value | Used for |
|---|---|---|
| `--ipf-primary` | `#14150d` | buttons, phone number, menu steps (white text on it) |
| `--ipf-text` | `#14150d` | body text |
| `--ipf-muted` | `#515358` | secondary text |
| `--ipf-bg` / `--ipf-surface` | `#ffffff` / `#f7f8f9` | page / result cards |
| `--ipf-border` / `--ipf-border-strong` | `#edeff0` / `#868990` | dividers / option tiles, inputs, outline buttons |
| `--ipf-radius-btn` / `--ipf-radius` | `99px` / `8px` | buttons / cards and option tiles |
| `--ipf-font` | Manrope, then the system font stack | everything (body text weight 500, as on effra.io) |

**Contrast is checked by `npm test`** (`test/contrast.test.js`):
- Text and button labels must reach **4.5:1**.
- The strong border and the focus ring must reach **3:1**.

If you change a colour and a pair fails, the test names the pair. The site's own border colour (`#edeff0`) is too faint to outline a tappable tile, which is why option tiles use the darker `--ipf-border-strong`.

## Fonts
The tool uses **Manrope** (Latin subset, weights 500, 600 and 700, WOFF2) from [`@fontsource/manrope`](https://fontsource.org/fonts/manrope) 5.3.0. The files are in `assets/fonts/`, and the build embeds them in the page, so the Framer component makes no font requests.

Manrope is © The Manrope Project Authors and is used under the **SIL Open Font License 1.1**; the full licence is in `assets/fonts/OFL.txt`.

## Adding the tool to Framer
1. Run `npm run build`.
2. In Framer, go to **Assets → Code → + → New component**, and name it `InsurerPhoneFinder`.
3. Delete the template code and paste the **whole** contents of `dist/InsurerPhoneFinder.framer.tsx`. It's about 80 KB, mostly one long encoded line, which is expected.
4. Drag the component onto the page. Set width to **Fill** (or a fixed width). Height is **Auto**: the component resizes itself as the user moves between steps.
5. **Sync URL** property (default **On**): copies the current step into the page URL (e.g. `?insurer=axa&query=preauth`), so a result can be shared or bookmarked, and opening that link jumps straight to it. Turn it off if it clashes with anything else on the page. URL sync never runs on the Framer canvas, and if the browser blocks it, the tool carries on working without it.

To update later: rebuild, then replace the code in the same Framer component.

The tool runs inside a sandboxed iframe. Phone links and the Effra link open in the main page, and the Copy button falls back gracefully where the clipboard API is blocked.

## Adding the crawlable table
So that Google and LLMs can read the numbers, put the same data on the page as real HTML text below the tool. An Embed may be iframed and not crawled, so the **CMS route is recommended**.

### Option A: Framer CMS (recommended, renders as native page content)
1. Run `npm run build`. This writes `dist/insurer-routes.csv`, with one row per route and these columns:
   `slug, insurer, query, follow_up, number, team, menu_path, hours, tips, alternative, last_checked`
   `hours` is empty where the hours are unknown. `alternative` lists any other numbers for that route, separated by "; ".
2. In Framer, open **CMS → + New Collection**, name it e.g. "Insurer routes", and choose **Import CSV**. (For an existing collection, open its **⋯** menu and choose **Import**.) Select `insurer-routes.csv`.
3. Map the columns. Use `slug` as the **Slug** and `query` as the **Title**, or keep `slug` as the title if Framer asks for one. Import the rest as **Plain Text** fields.
4. On the tool's page, below the component, add a heading (e.g. "Insurer provider phone numbers") and a text line with "Last checked: …".
5. For each insurer, add an **H2** ("AXA provider phone numbers") followed by a **Collection List** of "Insurer routes" with a **filter `insurer` is `AXA`**. Lay out each item as a row: query, follow_up, number, menu_path, hours, tips and alternative.
6. **When the data changes:** rebuild, then re-import the CSV into the same collection. Matching `slug`s update the existing items. Delete items whose slug no longer exists.

### Option B: paste the HTML
`dist/insurer-table.html` is a ready-made, JavaScript-free block. It has the Last checked date at the top, then an `<h2>` per insurer ("AXA provider phone numbers") followed by that insurer's table. Paste it into an **Embed → HTML** component below the tool. Check the published page source (View Source) to confirm the table text appears there; if it doesn't, use Option A.

Either way, `npm test` checks that the table and CSV contain exactly one row per route in the data. Rebuild whenever `src/data.js` changes so the tool and table can't drift apart.

## Accessibility
- Every choice is a real `<button>`, with keyboard navigation and a visible focus ring.
- Focus moves to each new step's heading, and step changes are announced through an `aria-live` region.
- The progress bar has `role="progressbar"`.
- Logos have alt text.
- The layout is mobile-first with large tap targets.
