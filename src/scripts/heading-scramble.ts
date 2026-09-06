import { registerModule } from './modules';
import { initGsap } from './gsap';

const DURATION = 0.9;
const CHARS = 'upperCase';
/** Fires once the heading is comfortably inside the viewport, and only once. */
const START = 'top 85%';

/**
 * Page headings resolve out of a scramble as they are scrolled to, the same
 * treatment the header already gives its nav labels. Mounted on <main>, so a
 * new section gets the behaviour by being a heading rather than by opting in.
 *
 * The heading is hidden until its trigger fires, so anything that stops
 * ScrollTrigger from firing would leave it invisible — main.ts refreshes
 * ScrollTrigger after every page swap for that reason.
 */
registerModule('heading-scramble', (root) => {
  const headings = [...root.querySelectorAll<HTMLElement>('h1, h2')].filter(
    (el) => !el.classList.contains('sr-only') && Boolean(el.textContent?.trim())
  );
  if (!headings.length) return;

  const gsap = initGsap();

  // Reduced motion keeps the headings exactly as rendered: no hiding, no tween.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const restore: (() => void)[] = [];

  const tweens = headings.map((el) => {
    const text = el.textContent!.trim();

    // Pins the accessible name to the real text, so a screen reader never reads
    // the scrambled characters passing through mid-tween.
    el.setAttribute('aria-label', text);

    // Scrambled text carries no spaces, so a long heading spends the tween as
    // one unbreakable word. Left alone that word sets the page's width and the
    // whole document picks up a horizontal scrollbar for the duration.
    el.style.overflowWrap = 'anywhere';

    // Starting from a single character lets ScrambleTextPlugin tween the length
    // as well as the characters, so the line grows into place instead of
    // arriving at full width already.
    el.textContent = CHARS === 'upperCase' ? 'A' : text.slice(0, 1);
    gsap.set(el, { autoAlpha: 0 });

    restore.push(() => {
      el.textContent = text;
      el.style.removeProperty('overflow-wrap');
      el.removeAttribute('aria-label');
    });

    return gsap.to(el, {
      autoAlpha: 1,
      duration: DURATION,
      ease: 'none',
      scrambleText: { text, chars: CHARS, speed: 0.6 },
      onComplete: () => el.style.removeProperty('overflow-wrap'),
      scrollTrigger: { trigger: el, start: START, once: true },
    });
  });

  return () => {
    for (const tween of tweens) {
      tween.scrollTrigger?.kill();
      tween.kill();
    }
    for (const undo of restore) undo();
    for (const el of headings) gsap.set(el, { clearProps: 'opacity,visibility' });
  };
});
