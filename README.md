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
ScrambleTextPlugin and ScrollTrigger) for the header hover, the heading reveals and the page
transition.

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

Page transitions leave the outgoing page where it is, drop a black sheet over it, then slide the
incoming one up from below the fold (`main.ts`). The body's overflow is pinned for the duration so
the offset container cannot flash a scrollbar.

The three layers have to stay in that order — outgoing page, veil, incoming page — and the header
is what makes that awkward. It sits at `z-20` so it stays above the page it belongs to, and a
static container creates no stacking context, so on the way out it competed at the root instead and
painted over both the veil and the incoming page. `is-leaving` gives the outgoing container
`isolation: isolate` at `z-index: 0` for the duration, which confines its header with the rest of
it. The incoming container needs no equivalent: `is-entering` already makes it a stacking context
at `z-index: 15`.

Every animation here — the transition, the header scramble, Lenis, the carousel — honours
`prefers-reduced-motion`.

## The home page

The brief asks that the archive be self-explanatory to a third party who was not in the room, so
home is the whole project in one read rather than a cover: the carousel, then `ProjectIntro`
(what the brief was and how it ran), then an `ExperimentSummary` for each of the four experiments
in order, then `AboutSummary`. Each summary takes its copy from `overview` in
`src/data/experiments.ts` — written for someone who has not seen the brief, and deliberately not
the same text as the experiment page's own `intro`.

The anchors those sections carry come from `home.sections` in `src/data/site.ts`. Nothing renders
that list — the header has no hover panel and the footer only lists `nav` — so it exists purely to
keep the page's anchors in one place. Adding an experiment means adding it to `experiments` and
adding one `section(...)` to `home.sections`.

`VisualArchive` under the run-through pulls six clips from `src/data/archive.ts` — two from each
of the first two experiments, one each from the last two — and every tile links into the section it
came from.

Home is the one page that passes `overlayHeader` to `BaseLayout`. The bar is taken out of the flow
(`position: fixed`) so the carousel starts at the top of the viewport rather than under it, and the
`header-reveal` module in `register.ts` keeps it out of sight until the carousel has been scrolled
past. `visibility: hidden` rather than opacity alone, so the links stay out of the tab order while
the bar is off screen.

## What each experiment is

The folder names under `Data Spaces/` do not line up with the numbering on the site, so for the
record:

| Page | Title | Source | Made with |
|---|---|---|---|
| Ex01 | Rhythm of Our Bodies | `week1/1` | counts taken on paper, then p5.js |
| Ex02 | Procedural Data | `week1/2` | TouchDesigner noise and particles |
| Ex03 | Data Expression | `week2/1` | the Ex01 rates rebuilt as sound, driving TouchDesigner |
| Ex04 | Sensory Data | `week2/2` | a touch sensor on an Arduino, read into p5 |

`week3/` is empty, which is why there is no fifth experiment.

## About

About is the class itself, in the brief's own order: DESIGN PROBLEM, DESIGN CHALLENGE, APPROACH,
then the three of us and the tools. The first three are `ProseSection` — a label, a one-sentence
statement at heading size, running copy in columns, and an optional pulled quote — which
`ProjectIntro` on the home page also uses. The brief's central question is quoted directly and
attributed; everything else is put in the site's own words rather than copied out of the document.

The member sections under it are built from the counts each of us took by hand in Ex01, the only
numbers in the project that came from us rather than from a system. They live in `members` in
`src/data/site.ts` alongside one line of arithmetic about what those counts show beside the other
two. Nothing there is a claim about the person; if real biographies arrive, `note` is the field to
replace.

Each experiment's `intro` opens from the course's aim before it gets to specifics — what the brief
asked for, then what this experiment did about it — so a page reached directly still explains why
the work exists. The plain-language `overview` used on the home page is deliberately separate copy.

## Motion

Everything animated here resolves out of a scramble, and everything honours `prefers-reduced-motion`
by simply not running.

- `heading-scramble` is mounted on `<main>`, so every `h1`/`h2` that is not `sr-only` gets the
  treatment by existing rather than by opting in. Each heading is hidden, cut to a single
  character, and scrambled up to its full text on a ScrollTrigger set at `top 85%`, once.
- `hover-scramble` re-scrambles a label into itself on hover. Where the element holds decoration
  the scramble should not touch — the arrow on a call to action — the animated run is marked
  `data-scramble-text`.
- The carousel scrambles a panel's title as that panel takes the centre, keyed to which experiment
  is showing rather than which slide, so the hop between a clone and its original does not retrigger it.

Two things are easy to get wrong here. Scrambled text carries no spaces, so a long heading spends
the tween as one unbreakable word — without `overflow-wrap: anywhere` for the duration it sets the
page's width and the document picks up a horizontal scrollbar. And because a heading stays hidden
until its trigger fires, anything that stops ScrollTrigger from firing leaves it invisible: Lenis
forwards its scroll to `ScrollTrigger.update`, and `main.ts` calls `ScrollTrigger.refresh()` after
every page swap.

## What Barba does not bring with it

Barba swaps `[data-barba="container"]` and nothing else, which means the incoming page's `<head>`
never arrives. That matters here because Astro scopes styles per component and inlines the small
page-specific bundles straight into that page's head: the carousel's rules live only in
`/index.html`, the Ex01 collage's only in `/ex01/index.html`. Reached by navigation rather than by
loading the URL, home came through with an unstyled carousel — full-width slides stacked down the
page. `scripts/head-styles.ts` copies anything in the incoming head this document does not already
have, and the transition's `beforeEnter` waits on it, so a page is never revealed half-styled. New
page-specific styles are covered automatically; nothing needs registering.

The enter animation also has a deadline. GSAP advances on requestAnimationFrame, which the browser
stops for a background tab, so switching away mid-transition used to leave the tween unresolved —
and with it the incoming page still `position: fixed`, the outgoing container still in the document
and `body` still locked at `overflow: hidden`. `enterPage` races the tween against a timer a little
longer than the animation and cleans up either way; losing the animation is much cheaper than
leaving the page in that state.

## Sections and anchors

The footer columns come from `nav[].sections` in `src/data/site.ts`. Each entry carries the `id` of
the element it jumps to, and the matching section component takes an `id` prop. A link to a section
of the page already open is handled in `main.ts` rather than by Barba, and scrolls with Lenis under
the sticky header.

The header is labels only. Hovering an item swaps its short label for the experiment's full title
and back again, both through a scramble (`scripts/nav-scramble.ts`); there is no dropdown of
sections under it. The page you are on is the exception: it wears its full title at rest — that is
the only marker for where you are — and is skipped by the scramble via `data-nav-static`. Its width
reservation stays the short label's, so being long does not move its neighbours.

Ex02's FUZZY GRID uses `StickyVisualRows` rather than `WideVisualRows`: the label and its reading
are held in place with `position: sticky` while the three clips travel past them. The sticky child
needs `self-start` to have a box shorter than the row, or there is nothing for it to travel within,
and its offset clears the sticky header.

Ex01's BREATH / PULSE / BLINK are a real tab group (`scripts/tabs.ts`) holding the counts each of
us recorded. Switching is a local crossfade and leaves the URL alone; arriving with `#pulse` from a
footer link still opens on that tab.

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
