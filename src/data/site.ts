export interface Section {
  label: string;
  /** id of the element this jumps to on the entry's page. */
  hash: string;
}

export interface NavEntry {
  /** Short label shown in the header and as the footer column heading. */
  label: string;
  /** The header's hover variant swaps each short label for its full title. */
  hoverLabel: string;
  /** Spelled-out name used by the "go to next" link at the foot of a page. */
  longLabel: string;
  href: string;
  /** Sub-items listed under the column heading, in the footer and on hover. */
  sections: Section[];
}

const section = (label: string, hash: string): Section => ({ label, hash });

export const nav: NavEntry[] = [
  {
    label: 'Ex01',
    hoverLabel: 'Rhythm of Our Bodies',
    longLabel: 'EXPERIMENT 01',
    href: '/ex01',
    sections: [section('BREATH', 'breath'), section('PULSE', 'pulse'), section('BLINK', 'blink')],
  },
  {
    label: 'Ex02',
    hoverLabel: 'Procedural Data',
    longLabel: 'EXPERIMENT 02',
    href: '/ex02',
    sections: [section('NOISE GRID', 'noise-grid'), section('FUZZY GRID', 'fuzzy-grid')],
  },
  {
    label: 'Ex03',
    hoverLabel: 'Data Expression',
    longLabel: 'EXPERIMENT 03',
    href: '/ex03',
    sections: [section('TITLE OF VISUALS', 'title-of-visuals')],
  },
  {
    label: 'Ex04',
    hoverLabel: 'Sensory Data',
    longLabel: 'EXPERIMENT 04',
    href: '/ex04',
    sections: [
      section('TITLE OF VISUALS', 'title-of-visuals'),
      section('Conceptualisation', 'conceptualisation'),
    ],
  },
  {
    label: 'About',
    hoverLabel: 'About',
    longLabel: 'ABOUT',
    href: '/about',
    sections: [
      section('CLASS', 'class'),
      section('FUMI', 'fumi'),
      section('KEAGAN', 'keagan'),
      section('MAIYA', 'maiya'),
    ],
  },
];

/** The "Home" slot, which the hover variant renames to "DataSpace". */
export const home: NavEntry = {
  label: 'Home',
  hoverLabel: 'DataSpace',
  longLabel: 'HOME',
  href: '/',
  sections: [],
};

/** Reading order of the whole site, used to resolve the "go to next" link. */
const order = ['/', ...nav.map((entry) => entry.href)];

export function nextPage(current: string) {
  const index = order.indexOf(current);
  const href = order[(index + 1) % order.length];
  const entry = nav.find((item) => item.href === href);
  return { href, label: entry ? entry.longLabel : 'HOME' };
}

export interface Member {
  name: string;
  visual: string;
}

/** The three of us, in the order the visuals are laid out across the site. */
export const members: Member[] = [
  { name: 'FUMI', visual: '/assets/visuals/fumi.png' },
  { name: 'KEAGAN', visual: '/assets/visuals/keagan.png' },
  { name: 'MAIYA', visual: '/assets/visuals/maiya.png' },
];
