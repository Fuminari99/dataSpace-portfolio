import { experiments } from './experiments';

/**
 * Copy and imagery for the home page, transcribed from the Figma home frame.
 * The page is a single read — hero, background, concept, the four experiments,
 * then about — so all of its text lives here rather than being spread across
 * the section components.
 */

export interface Thumb {
  src: string;
  alt: string;
  /**
   * The image's own average colour, sat behind it while it loads. Taken by
   * scaling the file to a single pixel, so a frame holds the shade of what is
   * about to arrive in it rather than a flat grey.
   */
  tint: string;
}

const thumb = (src: string, alt: string, tint: string): Thumb => ({ src, alt, tint });

export interface HeroClip {
  video: string;
  poster: string;
  alt: string;
  /** Where the link under the wordmark points while this clip is showing. */
  href: string;
  label: string;
}

/**
 * The hero cycles through the four experiments' clips, and the link under the
 * wordmark always names the one currently on screen — the footage is the way
 * into that experiment, not decoration in front of a fixed link.
 */
export const hero = {
  wordmark: 'DATASPACES',
  /** Seconds each clip holds before the next one takes over. */
  interval: 6,
  clips: experiments.map((experiment, index): HeroClip => {
    const video = experiment.video;
    return {
      video,
      poster: video.replace(/\.mp4$/, '.webp'),
      alt: `${experiment.title} — a clip from the experiment`,
      href: experiment.href,
      label: `EXPERIMENT 0${index + 1}`,
    };
  }),
};

export const background = {
  label: 'Background',
  columns: [
    'Data is constantly collected around us, but it is often treated as purely technical. We interpret it as a concept to log, store, analyse. These briefs ask us to look at those simple facts through different lenses.',
    'What happens when data is visualised as design material? How can we translate code in a manner in which narratives can gradually be built with the various outcomes of our codes?',
    'Each session introduced a new brief, in succession of the other. In addition to documenting each process, the same data was revisited and transformed — allowing simple observations that were recorded by hand to gradually translate into computational and interactive forms.',
  ],
};

export const concept = {
  label: 'Project concept',
  lead: 'After having compared our very first iterations, we began to notice similar qualities appearing within each of our responses: repetition and shifting patterns. Rather than forcing everyone to follow a singular design style, we looked for a concept that could tie them together.',
  /**
   * Home (Figma 59:1038) breaks the second paragraph so “the concept of Fractal
   * Glass” sits on its own line. `body` is the same copy joined for Projects.
   */
  bodyLines: [
    'From there, we decided on',
    'the concept of Fractal Glass',
    'as our shared project direction. It became the framework for all the experiments that followed, allowing us to individually experiment on how to achieve these broken, repeated structures across our codes.',
  ],
  body: 'From there, we decided on the concept of Fractal Glass as our shared project direction. It became the framework for all the experiments that followed, allowing us to individually experiment on how to achieve these broken, repeated structures across our codes.',
  /**
   * (05) from the collage on the Projects page — the band the collage crops out
   * of the strip of refraction tests, cut here so it can be shown on its own.
   */
  still: '/assets/concept/fractal-glass.webp',
  alt: 'A run of arcs refracting from pink through to violet on a dark field',
  link: { href: '/projects', label: 'Project concept' },
};

/**
 * Shortened from the About page's own opening line — home only needs enough
 * to point at the team, not the full introduction.
 */
export const about = {
  label: 'About',
  lead: 'Three Design Communication students, each bringing a different way of thinking and making — brought together into one shared outcome.',
  link: { href: '/about', label: 'About' },
};

/**
 * The experiment list, one row per experiment. The row's own copy and link come
 * from `experiments`; only the still thumbnails are named here, since the list
 * shows a different set of frames from the ones the carousel and archive use.
 */
export const experimentThumbs: Record<string, Thumb[]> = {
  '/ex01': [
    thumb(
      '/assets/video/ex01-breath-fumi-v2.webp',
      'BREATH visualisation by Fumi — concentric forms at the rate of a recorded breath',
      '#b9e3d0'
    ),
    thumb(
      '/assets/video/ex01-pulse-keagan-v2.webp',
      'PULSE visualisation by Keagan — marks arriving at the rate of a recorded heartbeat',
      '#9cb6f8'
    ),
    thumb(
      '/assets/video/ex01-blink-keagan-v2.webp',
      'BLINK visualisation by Keagan — clusters at the rate of a recorded blink',
      '#a5dbf6'
    ),
  ],
  '/ex02': [
    thumb('/assets/video/ex02-noise-fumi.webp', 'Noise grid by Fumi — one noise field sampled nine ways', '#42744e'),
    thumb('/assets/video/ex02-noise-keagan-v4.webp', 'Noise grid by Keagan — the same field under different parameters', '#366c95'),
    thumb('/assets/video/ex02-fuzzy-keagan-v3.webp', 'Fuzzy grid by Keagan — particles running across the source material', '#272e3e'),
  ],
  '/ex03': [
    thumb('/assets/video/ex03-expression-v5.webp', 'Line drawings surfacing out of a pale shore, driven by the mix', '#bbb4cd'),
    thumb('/assets/video/home-ex03-v6.webp', 'A later frame of the same sound-driven sequence', '#b7b3cb'),
  ],
  '/ex04': [
    thumb('/assets/video/ex04-sensory.webp', 'A field of lines swelling and settling under contact', '#f5d9e7'),
    thumb('/assets/video/home-ex04-v4.webp', 'The same touch response held at rest', '#f5d9e7'),
  ],
};
