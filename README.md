# dataSpace-portfolio

Web archive for the B-DS201 **Data Spaces** project — Fumi, Keagan and Maiya.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/  (plain html/css/media, ready to zip or deploy)
npm run check    # astro check
```

## Stack

Astro 7 (static output, no adapter) · Tailwind v4 via `@tailwindcss/vite` · vanilla TypeScript
· `@barba/core` for page transitions · `lenis` for smooth scrolling · `gsap` (with
ScrambleTextPlugin) for the header hover and the page transition.

No adapter is installed on purpose: the module asks for the site's html/css/media zipped up, and
`dist/` is exactly that. The same output deploys unchanged to Cloudflare Pages or Vercel.

## Layout

```
src/
  components/
    layout/    SiteHeader, SiteFooter          — persistent chrome
    ui/        SectionLabel, VisualFigure, ArrowIcon
    sections/  page-level blocks (PageHeading, VisualTriptych, ConceptCollage, …)
  data/        site.ts (nav + members), experiments.ts, concept-collage.ts
  layouts/     BaseLayout.astro                — barba wrapper/container, fonts, head
  pages/       index, ex01–ex04, about
  scripts/     main, smooth-scroll, modules, register, carousel, gsap
  styles/      global.css                      — @theme design tokens
public/assets/ visuals/, concept/, icons/      — exported from Figma
_legacy/       the class HTML template, kept for reference
```

## Page scripts and Barba

Barba swaps only `[data-barba="container"]`, so a `<script>` inside a page runs on the first load
and never again. Interactive markup declares itself instead:

```html
<section data-module="carousel">…</section>
```

`src/scripts/register.ts` maps each module name to a mount function that may return a cleanup
callback. `main.ts` mounts on first load and after every page enter, and unmounts before every
leave. Add new behaviour there rather than inlining scripts in a page.

The header sits outside the container so it survives navigation; its current-page marker is
re-synced in a Barba `after` hook, and module teardown is scoped to the outgoing container so the
header's own module is not torn down with it. Lenis needs both a scroll reset and a `resize()`
after each swap, since it caches the document height.

Page transitions fade the outgoing page out, then slide the incoming one up from below the fold
(`main.ts`). The body's overflow is pinned for the duration so the offset container cannot flash
a scrollbar.

Every animation here — the transition, the header scramble, Lenis, the carousel — honours
`prefers-reduced-motion`.

## Sections and anchors

Footer columns and the header hover panel share one source, `nav[].sections` in `src/data/site.ts`.
Each entry carries the `id` of the element it jumps to, and the matching section component takes an
`id` prop. A link to a section of the page already open is handled in `main.ts` rather than by
Barba, and scrolls with Lenis under the sticky header.

Ex01's BREATH / PULSE / BLINK are a real tab group (`scripts/tabs.ts`) holding the counts each of
us recorded. Switching is a local crossfade and leaves the URL alone; arriving with `#pulse` from a
footer or header link still opens on that tab.

## Footage

`public/assets/video/` holds web encodes of the clips in `~/Desktop/dataspace` — H.264, no audio,
24-30fps, bitrate-capped, with a poster frame beside each. 1.7GB of ProRes-scale source comes down
to about 35MB. Clips load and play only while on screen and pause when scrolled past
(`lazy-video` in `scripts/register.ts`).

Swapping a clip is a one-line change: every slot takes a path, and any slot left `undefined` falls
back to the still image. Ex01 tabs use the `visuals` array per tab, Ex02's rows use `visuals` on
the section, and the single-panel pages take `video` / `poster` on `FeatureStill`.

Still missing: Maiya has no clips of her own in the source folder, so her Ex01, noise-grid and
fuzzy-grid slots fall back to stills.

## Design tokens

Everything visual comes from `@theme` in `src/styles/global.css` — colours, the type scale, the
`1280px` page width, the `24px` gutter and `64px` section rhythm. Components reference tokens
only; no raw hex or px sizes in the markup.

Two notes on fidelity to the Figma file:

- The design sets its body and heading face to **Noto Emoji**, which has no Latin glyphs, so
  Figma was silently falling back to a system font. `Noto Sans` stands in — it is the family the
  design's own caption style names. `Orbit` is used as designed for the nav, labels and eyebrows.
- The soft pink washes on the home page are 12%-opacity rectangles carrying a layer blur in
  Figma. The blur is not exported, so `AccentWash.astro` reapplies it; positions come from the
  1280 × 3959 home frame.
