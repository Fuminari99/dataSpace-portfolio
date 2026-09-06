/**
 * The Ex01 "CONCEPT" collage is a free scatter in Figma rather than a grid.
 * Positions are stored as percentages of a 1173 x 1856 canvas so the whole
 * arrangement scales with its container instead of being pinned to pixels.
 */

export const CANVAS = { width: 1173, height: 1856 };

const pctX = (px: number) => +((px / CANVAS.width) * 100).toFixed(3);
const pctY = (px: number) => +((px / CANVAS.height) * 100).toFixed(3);

interface Placement {
  x: number;
  y: number;
  w: number;
  h?: number;
}

const at = (left: number, top: number, width: number, height?: number): Placement => ({
  x: pctX(left),
  y: pctY(top),
  w: pctX(width),
  ...(height === undefined ? {} : { h: pctY(height) }),
});

export interface CollageText extends Placement {
  kind: 'text';
  text: string;
}

export interface CollageImage extends Placement {
  kind: 'image';
  src: string;
  alt: string;
  /**
   * Figma crops this one to a window over a taller sprite sheet; the inner
   * image is scaled and offset rather than simply covering the frame.
   */
  crop?: { height: string; top: string; left: string };
}

export type CollageItem = CollageText | CollageImage;

export const collage: CollageItem[] = [
  { kind: 'text', text: 'FRACTAL GLASS', ...at(0, 1, 179) },
  { kind: 'text', text: '( Understanding the Etymology )', ...at(298, 0, 185) },
  {
    kind: 'text',
    text: 'The word fractal emerged from Benoit Mandelbrot’s attempt to describe forms that resist neatness. Its roots lie in the Latin fractus, a word associated with breaking, splitting, and fragmentation.',
    ...at(629, 0, 185),
  },
  {
    kind: 'text',
    text: 'Classical geometry tends to imagine the world through clean boundaries and ideal shapes. Mandelbrot looked elsewhere, toward surfaces that are uneven, incomplete, and difficult to contain within perfect mathematical forms.',
    ...at(857, 667, 302),
  },
  {
    kind: 'text',
    text: 'As such, true order is found by looking at how these jagged, broken patterns repeat themselves at every scale.',
    ...at(665, 1126, 236),
  },
  { kind: 'text', text: '(01)', ...at(348, 502, 64) },
  { kind: 'text', text: '(02)', ...at(1109, 440, 64) },
  { kind: 'text', text: '(03)', ...at(861, 920, 64) },
  { kind: 'text', text: '(04)', ...at(517, 774, 64) },
  { kind: 'text', text: '(05)', ...at(316, 1023, 64) },
  { kind: 'text', text: '(06)', ...at(665, 1485, 64) },
  { kind: 'text', text: '(07)', ...at(1109, 1816, 64) },

  {
    kind: 'image',
    src: '/assets/concept/01.png',
    alt: 'Refracted colour study, warm halo on a dark field',
    ...at(3, 286, 129, 125),
  },
  {
    kind: 'image',
    src: '/assets/concept/02.png',
    alt: 'Layered spectral bands radiating from a centre point',
    ...at(186, 397, 130, 125),
  },
  {
    kind: 'image',
    src: '/assets/concept/03.png',
    alt: 'Overlapping blue rings drawn as soft concentric traces',
    ...at(861, 211, 185, 249),
  },
  {
    kind: 'image',
    src: '/assets/concept/04.png',
    alt: 'Reflection study in orange and green',
    ...at(348, 662, 133, 132),
  },
  {
    kind: 'image',
    src: '/assets/concept/05.png',
    alt: 'Vertical smear of light through fractal glass',
    ...at(643, 667, 171, 273),
  },
  {
    kind: 'image',
    src: '/assets/concept/06.png',
    alt: 'Strip of repeated refraction tests',
    ...at(3, 908, 261, 135),
    crop: { height: '387.55%', top: '-171.05%', left: '-0.04%' },
  },
  {
    kind: 'image',
    src: '/assets/concept/07.png',
    alt: 'Cluster of translucent spheres in pink and red',
    ...at(348, 1126, 266, 377),
  },
  {
    kind: 'image',
    src: '/assets/concept/08.png',
    alt: 'Radial gradient study, green centre',
    ...at(1030, 1210, 129, 131),
  },
  {
    kind: 'image',
    src: '/assets/concept/09.png',
    alt: 'Radial gradient study, teal centre',
    ...at(1030, 1432, 129, 127),
  },
  {
    kind: 'image',
    src: '/assets/concept/10.png',
    alt: 'Radial gradient study, blue centre on red',
    ...at(1030, 1646, 133, 128),
  },
];
