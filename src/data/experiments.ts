export interface Experiment {
  eyebrow: string;
  title: string;
  href: string;
  /** Short line used on the home carousel. */
  summary: string;
  /** Looping clip behind the home carousel panel. */
  video: string;
  /** One or two columns of intro copy on the experiment's own page. */
  intro: string[];
}

export const experiments: Experiment[] = [
  {
    eyebrow: '[EX.01]',
    title: 'Rhythm of Our Bodies',
    href: '/ex01',
    video: '/assets/video/home-ex01.mp4',
    summary:
      'Recording breath, pulse and blink over time, then translating these bodily rhythms into a shared visual system.',
    intro: [
      'In the one-hundred and eighty seconds of being alive, let’s take a step back, and feel the rhythm of our bodies.',
    ],
  },
  {
    eyebrow: '[EX.02]',
    title: 'Procedural Data',
    href: '/ex02',
    video: '/assets/video/home-ex02.mp4',
    summary:
      'Procedural systems in TouchDesigner, where noise, particle behaviour and repeated geometry drive visual change.',
    intro: [
      'An exploration of procedural systems in TouchDesigner, using noise, particle behaviour and repeated geometry to drive visual change.',
      'By adjusting parameters, layering effects and introducing variation, the experiment examines how computational rules can produce complex, unpredictable visual outcomes.',
    ],
  },
  {
    eyebrow: '[EX.03]',
    title: 'Data Expression',
    href: '/ex03',
    video: '/assets/video/home-ex03.mp4',
    summary:
      'Giving collected data a form of its own, and testing it against the ways a viewer reads and misreads it.',
    intro: [
      'Data only means something once it has been given a shape, and every shape argues for a particular reading of it.',
      'This experiment treats that choice as the material: the same set of numbers is put through different forms to see which relationships survive the translation and which are invented by it.',
    ],
  },
  {
    eyebrow: '[EX.04]',
    title: 'Sensory Data',
    href: '/ex04',
    video: '/assets/video/home-ex04.mp4',
    summary:
      'Touch and sound as inputs, turning an ordinary object into something that registers and answers back.',
    intro: [
      'The same three rhythms, rebuilt as sound rather than image. An ocean carries the breath, a passing train carries the pulse, and footsteps in sand mark each blink.',
      'A touch sensor wired through to the browser closes the loop, so an ordinary object becomes something that registers being handled and answers back.',
    ],
  },
];
