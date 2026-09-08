export interface ArchiveTile {
  /** Looping clip; the poster beside it is the same path with a .webp suffix. */
  video: string;
  /** Which experiment it came out of, and whose it is where that applies. */
  caption: string;
  /** Describes the visual for screen readers. */
  alt: string;
  href: string;
}

/**
 * The archive grid on the home page. Two tiles from each of the first two
 * experiments and one from each of the last two, so every experiment is
 * represented and no clip is repeated from the run-through above it.
 */
export const archive: ArchiveTile[] = [
  {
    video: '/assets/video/ex01-breath-fumi-v2.mp4',
    caption: 'Ex01 · Breath, Fumi',
    alt: 'Concentric forms opening and closing at the rate of a recorded breath',
    href: '/ex01#breath',
  },
  {
    video: '/assets/video/ex01-blink-keagan-v2.mp4',
    caption: 'Ex01 · Blink, Keagan',
    alt: 'Marks arriving in clusters at the rate of a recorded blink',
    href: '/ex01#blink',
  },
  {
    video: '/assets/video/ex02-noise-fumi-v2.mp4',
    caption: 'Ex02 · Noise grid, Fumi',
    alt: 'A three by three grid sampling one noise field, a parameter apart per cell',
    href: '/ex02#noise-grid',
  },
  {
    video: '/assets/video/ex02-fuzzy-keagan-v2.mp4',
    caption: 'Ex02 · Fuzzy grid, Keagan',
    alt: 'Particles running across the same source material without a grid',
    href: '/ex02#fuzzy-grid',
  },
  {
    video: '/assets/video/ex03-expression-v3.mp4',
    caption: 'Ex03 · Sound into visuals',
    alt: 'Line drawings surfacing out of a pale shore, driven by the mix',
    href: '/ex03#sound-into-visuals',
  },
  {
    video: '/assets/video/ex04-sensory-v2.mp4',
    caption: 'Ex04 · Touch response',
    alt: 'A field of lines swelling and settling under contact',
    href: '/ex04#touch-response',
  },
];
