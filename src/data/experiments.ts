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
  /**
   * Plain-language account for the home page, written for someone who has not
   * seen the brief: what was actually done, and what there is to look at.
   */
  overview: string[];
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
      'The brief asks how raw data can be gathered, quantified and given a form by a designer rather than by a machine. This first experiment takes the shortest route to that question: the data is our own bodies, and it is collected by hand.',
      'In the one-hundred and eighty seconds of being alive, let’s take a step back, and feel the rhythm of our bodies. Three minutes each of breath, pulse and blink, counted on paper before a line of code was written — the gathering and the quantifying are the same act here, since counting a rhythm changes it.',
    ],
    overview: [
      'The three of us counted our own breaths, heartbeats and blinks on paper over three minutes, then wrote those counts into p5.js sketches. Nothing was measured by a device.',
      'The numbers themselves are unremarkable. What the sketches show is how differently three bodies fill the same three minutes — and those counts stay the source material for everything that follows.',
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
      'The project asks for a different method at each turn — a different way of collecting, of analysing, of expressing. Having counted data by hand in the first experiment, this one stops collecting altogether and lets a system generate it instead.',
      'An exploration of procedural systems in TouchDesigner, using noise, particle behaviour and repeated geometry to drive visual change. Adjusting one parameter at a time and laying the results side by side makes the grid itself the analysis: what is on display is the rule, not the picture.',
    ],
    overview: [
      'A move from data we counted to data a system generates. In TouchDesigner a single noise field is sampled nine ways at once, one parameter changed at a time.',
      'The grid is meant to be read as a contact sheet of one system rather than as nine separate images: the differences between the cells are the record of what each parameter does.',
    ],
  },
  {
    eyebrow: '[EX.03]',
    title: 'Data Expression',
    href: '/ex03',
    video: '/assets/video/home-ex03.mp4',
    summary:
      'The same body rhythms rebuilt as a three-layer soundtrack, which is then handed back to TouchDesigner to draw the image.',
    intro: [
      'Transforming raw data into a narrative someone can read is the brief’s central question, and nothing in it says that narrative has to be an image. This experiment expresses the same body rhythms twice — once for the ear, and then once more for the eye.',
      'An ocean carries the breath, a passing train carries the pulse and footsteps in sand mark each blink, every layer locked to a rate recorded in Ex01. That mix is fed back into TouchDesigner and read frame by frame, so the image is driven by the sound rather than composed to match it. Neither version is the original.',
    ],
    overview: [
      'The rhythms from the first experiment come back as sound. An ocean carries the breath, a passing train carries the pulse and footsteps in sand mark each blink, every layer locked to the rate we recorded.',
      'That mix is then read back into TouchDesigner and used to drive the image, so the same set of counts is expressed twice — once for the ear, once for the eye.',
    ],
  },
  {
    eyebrow: '[EX.04]',
    title: 'Sensory Data',
    href: '/ex04',
    video: '/assets/video/home-ex04.mp4',
    summary:
      'A touch sensor on an everyday object, read into the browser through an Arduino, so contact becomes something visible.',
    intro: [
      'The brief asks how data can be experienced, not only gathered and presented. Here nothing has been recorded in advance at all: the data is produced by whoever is standing in front of the object, in the moment, by touching it.',
      'A touch sensor wired to an Arduino reports a single number many times a second into the browser. The sensor knows only that it is being touched — how firm the contact was, how long it lasted, whether it is still there is all supplied by how the sketch chooses to answer.',
    ],
    overview: [
      'A touch sensor on an ordinary object, wired to an Arduino and read into the browser many times a second.',
      'The sensor knows only that it is being touched. How firm the contact was, how long it lasted, whether it is still there — all of that is supplied by how the sketch chooses to answer.',
    ],
  },
];
