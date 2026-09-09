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
  /**
   * The page's own hue, in degrees, sampled from the footage that page carries.
   * Ex02 and Ex03 both come back blue, so Ex02 is pulled to the cyan end of its
   * range and Ex03 to the indigo end rather than letting the two pages land on
   * the same footer.
   *
   * A number rather than a colour because the footer does not use it flat: it
   * runs a gradient between this hue turned a little each way, which is what
   * makes the field read as one soft colour that drifts rather than as two.
   */
  hue: number;
}

const section = (label: string, hash: string): Section => ({ label, hash });

export const nav: NavEntry[] = [
  {
    label: 'Ex01',
    hoverLabel: 'Rhythm of Our Bodies',
    longLabel: 'EXPERIMENT 01',
    href: '/ex01',
    hue: 161, // teal — 85% of the Ex01 footage sits in this hue
    sections: [section('BREATH', 'breath'), section('PULSE', 'pulse'), section('BLINK', 'blink')],
  },
  {
    label: 'Ex02',
    hoverLabel: 'Procedural Data',
    longLabel: 'EXPERIMENT 02',
    href: '/ex02',
    hue: 193, // cyan — the largest single band in the noise grid
    sections: [section('NOISE GRID', 'noise-grid'), section('FUZZY GRID', 'fuzzy-grid')],
  },
  {
    label: 'Ex03',
    hoverLabel: 'Data Expression',
    longLabel: 'EXPERIMENT 03',
    href: '/ex03',
    hue: 231, // indigo — Ex03's blue, pushed off Ex02's cyan
    sections: [
      section('SOUND INTO VISUALS', 'sound-into-visuals'),
      section('Conceptualisation', 'conceptualisation'),
    ],
  },
  {
    label: 'Ex04',
    hoverLabel: 'Sensory Data',
    longLabel: 'EXPERIMENT 04',
    href: '/ex04',
    hue: 332, // pink — the mauve/pink cast of the touch-sensor footage
    sections: [
      section('TOUCH RESPONSE', 'touch-response'),
      section('Conceptualisation', 'conceptualisation'),
    ],
  },
  {
    label: 'About',
    hoverLabel: 'About Us',
    longLabel: 'ABOUT',
    href: '/about',
    hue: 27, // orange — averaged off the three portrait marks
    sections: [
      section('KEAGAN', 'keagan'),
      section('FUMI', 'fumi'),
      section('MAIYA', 'maiya'),
      section('TOOLS', 'tools'),
    ],
  },
];

/**
 * The "Home" slot, which the hover variant renames to "DataSpace". Its sections
 * are the run-through the home page is built from — the brief, each experiment
 * in order, then the team — and index.astro takes its anchors from here.
 */
export const home: NavEntry = {
  label: 'Home',
  hoverLabel: 'DataSpace',
  longLabel: 'HOME',
  href: '/',
  hue: 346, // the site accent, which the home washes already carry
  sections: [
    section('BACKGROUND', 'background'),
    section('EX01', 'ex01-summary'),
    section('EX02', 'ex02-summary'),
    section('EX03', 'ex03-summary'),
    section('EX04', 'ex04-summary'),
    section('THE TEAM', 'team'),
  ],
};

/**
 * The Projects page: the shared concept the four experiments came out of,
 * followed by each of them in turn. The experiments sit *under* it rather than
 * beside it, which is why the header carries this instead of listing Ex01–04.
 */
export const projects: NavEntry = {
  label: 'Projects',
  hoverLabel: 'Project Concept',
  longLabel: 'PROJECTS',
  href: '/projects',
  hue: 251, // violet — the hub the four experiments hang off
  sections: [
    section('CONCEPT', 'concept'),
    section('EX.01', 'ex01'),
    section('EX.02', 'ex02'),
    section('EX.03', 'ex03'),
    section('EX.04', 'ex04'),
  ],
};

const about = nav[nav.length - 1];

/**
 * The header carries three entries — Home, Projects, About — with the four
 * experiments reached through Projects. The footer lists Project Concept, the
 * four experiments, and About as columns on every page.
 */
export const headerNav: NavEntry[] = [home, projects, about];

/**
 * The nav entry for the page the reader is on. Home and Projects sit outside
 * `nav` (the experiments + About set), so the lookup covers all three lists.
 */
export function entryFor(pathname: string) {
  // Astro hands the footer "/about" while a browser on the built site may be on
  // "/about/"; both have to find the same entry.
  const path = pathname.replace(/\/+$/, '') || '/';
  return [home, projects, ...nav].find((entry) => entry.href === path) ?? home;
}

/**
 * The hue the footer gradient is built from on a given page. Resolved from the
 * path rather than passed down as a prop, so a page does not have to know the
 * footer exists — and an unknown path falls back to the site accent.
 */
export function hueFor(pathname: string) {
  return entryFor(pathname).hue;
}

/** Reading order of the whole site, used to resolve the "go to next" link. */
const order = ['/', projects.href, ...nav.map((entry) => entry.href)];

export function nextPage(current: string) {
  const index = order.indexOf(current);
  const href = order[(index + 1) % order.length];
  const entry = [projects, ...nav].find((item) => item.href === href);
  return { href, label: entry ? entry.longLabel : 'HOME' };
}

export interface Rate {
  label: string;
  /** Count over the three minutes of the Ex01 worksheet. */
  value: string;
}

export interface Member {
  name: string;
  visual: string;
  /** Round portrait used on the About page, exported from the design file. */
  portrait: string;
  /** The counts this person recorded by hand in Ex01, the project's first data. */
  rates: Rate[];
  /**
   * One line about what those counts show beside the other two. Arithmetic
   * only — nothing here is a claim about the person.
   */
  note: string;
  /**
   * What this person brought to the project, in their own paragraphs, as the
   * About page sets them out. Maiya's is the copy from the design file; the
   * other two are written to match it and are the team's to correct.
   */
  bio: string[];
}

const rate = (label: string, value: string): Rate => ({ label, value });

/** The three of us, in the order the visuals are laid out across the site. */
export const members: Member[] = [
  {
    name: 'KEAGAN',
    visual: '/assets/visuals/keagan.webp',
    portrait: '/assets/portraits/keagan.webp',
    rates: [rate('BREATH', '35'), rate('PULSE', '154'), rate('BLINK', '114')],
    note: 'The widest gap between two rhythms in the project: 35 breaths against 154 beats in the same three minutes, roughly four beats to a breath.',
    bio: [
      'Keagan brings energy, focus and a strong sense of direction to the group. He is constantly thinking about how each experiment can be pushed further, whether through concept, making or visual outcome.',
      'His hands-on and outcome driven approach helped the team stay focused while shaping the broader direction of the project.',
    ],
  },
  {
    name: 'FUMI',
    visual: '/assets/visuals/fumi.webp',
    portrait: '/assets/portraits/fumi.webp',
    rates: [rate('BREATH', '56'), rate('PULSE', '111'), rate('BLINK', '118')],
    note: 'The most blinks of the three — 118 against Maiya’s 52 — over a breath and a pulse that both sit between the other two.',
    bio: [
      'Fumi brings a strong analytical mind and a deep understanding of code to the team. He is quick to turn ideas into working systems, and his ability to visualise data efficiently has helped shape many of the project’s most refined outcomes.',
      'His technical knowledge became an important foundation for how we explored creative coding throughout Data Spaces.',
    ],
  },
  {
    name: 'MAIYA',
    visual: '/assets/visuals/maiya.webp',
    portrait: '/assets/portraits/maiya.webp',
    rates: [rate('BREATH', '64'), rate('PULSE', '101'), rate('BLINK', '52')],
    note: 'The fastest breathing and the slowest pulse of the three, and 52 blinks — fewer than half of what Fumi recorded.',
    bio: [
      'Mai brings a strong visual sensitivity to the team, with a keen eye for how ideas can be translated into a cohesive design language.',
      'She helped shape the overall feel of the project, refining how the experiments came together visually and ensuring that each outcome still felt connected to the wider Fractal Glass direction.',
    ],
  },
];
