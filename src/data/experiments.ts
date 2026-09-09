export interface Experiment {
  eyebrow: string;
  title: string;
  href: string;
  /** Short line used on the home carousel. */
  summary: string;
  /**
   * Looping clip behind the home carousel panel. Vercel serves everything under
   * `public/` as `immutable` for a year, so replacing a clip's contents leaves
   * every browser that has already seen it on the old one — the path has to
   * change too. Bump the `-vN` suffix when the footage changes, and leave it
   * alone when it does not.
   */
  video: string;
  /** One or two columns of intro copy on the experiment's own page. */
  intro: string[];
  /**
   * Plain-language account for the home page, written for someone who has not
   * seen the brief: what was actually done, and what there is to look at.
   */
  overview: string[];
  /** Description shown on the Projects page. */
  projectOverview: string[];
}

export const experiments: Experiment[] = [
  {
    eyebrow: '[EX.01]',
    title: 'Rhythm of Our Bodies',
    href: '/ex01',
    projectOverview: [
      'We began by manually recording our individual breaths, heartbeats & blinks over the course of three minutes, to then translate the data into p5.js sketches.',
      'The data collection itself was straight forward, but the real differences presented itself in how they varied over the course of 180 seconds, and therefore, cast a wide range of data sets to explore in our codes.',
    ],
    video: '/assets/video/home-ex01-v3.mp4',
    summary:
      'Recording breath, pulse and blink over time, then translating these bodily rhythms into a shared visual system.',
    intro: [
      'The introduction to Fractal Variant began with a simple activity of manually recording our individual breaths, heartbeats over the span of three minutes, before translating those observations into p5.js sketches.',
      'Across 180 seconds, we recorded raw, quantifiable data from our own bodies. Each rhythm revealed its own sets of patterns and variation, and eventually, the recorded differences had become our first data set.',
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
    projectOverview: [
      'From manual data collection, we then moved on to learning a new system — Touch Designer, that allowed us the autonomy to venture into digitally manipulating data to achieve our desired outcome using the noise node of the software.',
      'Across nine outputs, each of us experimented with frequencies, channels, colors & ramps (gradients) to achieve our own unique renditions.',
    ],
    video: '/assets/video/home-ex02-v5.mp4',
    summary:
      'Procedural systems in TouchDesigner, where noise, particle behaviour and repeated geometry drive visual change.',
    intro: [
      "Moving on from manual data collection, we were then introduced to TouchDesigner as a new way of generating and manipulating data digitally. Instead of observing and recording information ourselves, we worked with the software's Noise nodes to produce changing visual outputs, giving us more control over how data is shaped. through a procedural system.",
      'Across nine outputs, each of us experimented with frequency, channels, colour and ramps (gradients) to create our own variations from the same starting point. By understanding the system, and how each adjustment affected the output, we each came up with our own distinct interpretations.',
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
    projectOverview: [
      "Experiment 3 explored how sound can be translated into visual form. By using the rhythms of our first experiment as a starting point — breathe,pulse, and blink, we'd sampled sounds from our everyday space, that shared similar qualities to those rhythms. These sounds were then brought into Touch Designer where we worked on generating abstract visuals responses through nodes.",
    ],
    video: '/assets/video/home-ex03-v6.mp4',
    summary:
      'The same body rhythms rebuilt as a three-layer soundtrack, which is then handed back to TouchDesigner to draw the image.',
    intro: [
      'We found sounds that matched the pulse, breath and blink we counted in Ex01, and built the visuals from that sound.',
      'The attempt was to turn our body rhythms into a narrative someone can read, generating the visuals in real time in TouchDesigner.',
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
    projectOverview: [
      'The final experiment shifts from recorded data to live interactions. With Fractal glass as our starting point, we designed our touch sensor to explore how a tactile, sensorial experience could be translated into code and processed through Arduino in real time.',
      'Each touch is designed to respond primarily to pressure which in turn, generates shifting, glass-like morphs in the visual output. Ultimately, the result explores the tactility in surfaces that is often naked to the eye.',
    ],
    video: '/assets/video/home-ex04-v4.mp4',
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
