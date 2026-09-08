/**
 * The Ex01 "CONCEPT" collage is a free scatter in Figma rather than a grid.
 * Positions are stored as percentages of a 1173 x 1856 canvas so the whole
 * arrangement scales with its container instead of being pinned to pixels.
 */

export const CANVAS = { width: 1173, height: 1856 };

/**
 * The same arrangement appears in the Projects frame at 1280 wide — exactly
 * 1.0912x this canvas, so every percentage above holds unchanged. Type sizes
 * are quoted against that frame, so they are converted from it.
 */
export const TYPE_CANVAS = 1280;

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

/**
 * The design sets three sizes in the scatter rather than one: the two headings
 * in the display face, the running notes a step below them, and the numbered
 * markers a step above. Sizes are held in the design's own 1280-wide space and
 * converted to container units by the component.
 */
export type CollageRole = 'heading' | 'note' | 'marker';

export const ROLE_SIZE: Record<CollageRole, number> = {
  heading: 18,
  note: 16,
  marker: 21.824,
};

export interface CollageText extends Placement {
  kind: 'text';
  text: string;
  role: CollageRole;
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
  { kind: 'text', role: 'heading', text: 'FRACTAL GLASS', ...at(0, 1, 179) },
  { kind: 'text', role: 'heading', text: '( Understanding the Etymology )', ...at(298, 0, 185) },
  {
    kind: 'text',
    role: 'note',
    text: 'The word fractal emerged from Benoit Mandelbrot’s attempt to describe forms that resist neatness. Its roots lie in the Latin fractus, a word associated with breaking, splitting, and fragmentation.',
    ...at(629, 0, 185),
  },
  {
    kind: 'text',
    role: 'note',
    text: 'Classical geometry tends to imagine the world through clean boundaries and ideal shapes. Mandelbrot looked elsewhere, toward surfaces that are uneven, incomplete, and difficult to contain within perfect mathematical forms.',
    ...at(857, 667, 302),
  },
  {
    kind: 'text',
    role: 'note',
    text: 'As such, true order is found by looking at how these jagged, broken patterns repeat themselves at every scale.',
    ...at(665, 1126, 236),
  },
  { kind: 'text', role: 'marker', text: '(01)', ...at(348, 502, 64) },
  { kind: 'text', role: 'marker', text: '(02)', ...at(1109, 440, 64) },
  { kind: 'text', role: 'marker', text: '(03)', ...at(861, 920, 64) },
  { kind: 'text', role: 'marker', text: '(04)', ...at(517, 774, 64) },
  { kind: 'text', role: 'marker', text: '(05)', ...at(316, 1023, 64) },
  { kind: 'text', role: 'marker', text: '(06)', ...at(665, 1485, 64) },
  { kind: 'text', role: 'marker', text: '(07)', ...at(1109, 1816, 64) },

  {
    kind: 'image',
    src: '/assets/concept/01.webp',
    alt: 'Refracted colour study, warm halo on a dark field',
    ...at(3, 286, 129, 125),
  },
  {
    kind: 'image',
    src: '/assets/concept/02.webp',
    alt: 'Layered spectral bands radiating from a centre point',
    ...at(186, 397, 130, 125),
  },
  {
    kind: 'image',
    src: '/assets/concept/03.webp',
    alt: 'Overlapping blue rings drawn as soft concentric traces',
    ...at(861, 211, 185, 249),
  },
  {
    kind: 'image',
    src: '/assets/concept/04.webp',
    alt: 'Reflection study in orange and green',
    ...at(348, 662, 133, 132),
  },
  {
    kind: 'image',
    src: '/assets/concept/05.webp',
    alt: 'Vertical smear of light through fractal glass',
    ...at(643, 667, 171, 273),
  },
  {
    kind: 'image',
    src: '/assets/concept/06.webp',
    alt: 'Strip of repeated refraction tests',
    ...at(3, 908, 261, 135),
    crop: { height: '387.55%', top: '-171.05%', left: '-0.04%' },
  },
  {
    kind: 'image',
    src: '/assets/concept/07.webp',
    alt: 'Cluster of translucent spheres in pink and red',
    ...at(348, 1126, 266, 377),
  },
  {
    kind: 'image',
    src: '/assets/concept/08.webp',
    alt: 'Radial gradient study, green centre',
    ...at(1030, 1210, 129, 131),
  },
  {
    kind: 'image',
    src: '/assets/concept/09.webp',
    alt: 'Radial gradient study, teal centre',
    ...at(1030, 1432, 129, 127),
  },
  {
    kind: 'image',
    src: '/assets/concept/10.webp',
    alt: 'Radial gradient study, blue centre on red',
    ...at(1030, 1646, 133, 128),
  },
];
