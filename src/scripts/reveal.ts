import { registerModule } from './modules';
import { initGsap, ScrollTrigger } from './gsap';

/** How far below its resting place a thing starts. Small: this is a settle. */
const DISTANCE = 24;
const DURATION_S = 0.7;
const EASE = 'power2.out';
/** Items arriving together come in one after another rather than as a block. */
const STAGGER_S = 0.08;
/**
 * Nothing arrives right at the bottom edge — by the time a line is a little way
 * into the page it has already finished, so it is read as settled rather than
 * as still moving.
 */
const START = 'top 88%';

/**
 * Anything marked `[data-reveal]` inside the root rises into place the first
 * time it is scrolled to, and stays put afterwards.
 *
 * This is decoration and only decoration: the markup is rendered in its
 * finished state, so a reader without the script — or one who has asked for
 * less motion — simply gets the page with everything already where it lands.
 * The hidden state is set here rather than in CSS for that reason.
 *
 * `ScrollTrigger.batch` is what makes the stagger read: items crossing the line
 * in the same frame are handed to one tween together, so a row of three
 * portraits arrives as a run instead of three unrelated fades.
 */
registerModule('reveal', (root) => {
  const targets = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (targets.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const gsap = initGsap();

  gsap.set(targets, { autoAlpha: 0, y: DISTANCE });

  const triggers = ScrollTrigger.batch(targets, {
    start: START,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: DURATION_S,
        ease: EASE,
        stagger: STAGGER_S,
        overwrite: true,
      }),
  });

  return () => {
    for (const trigger of triggers) trigger.kill();
    gsap.killTweensOf(targets);
    // Back to the state the markup was rendered in, so a page returned to by
    // navigation is not left holding an inline opacity from last time.
    gsap.set(targets, { clearProps: 'opacity,visibility,transform' });
  };
});
