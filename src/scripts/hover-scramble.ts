import { registerModule } from './modules';
import { initGsap } from './gsap';

const DURATION = 0.4;
const CHARS = 'upperCase';

/**
 * A link that scrambles in place on hover. Unlike the header's nav items
 * nothing is swapped for anything else — the label resolves back into itself,
 * so the effect is the movement rather than a change of word.
 *
 * The element carrying the module may hold decoration the scramble should not
 * touch (the arrow on the home page's links), so the animated run of text is
 * marked with `data-scramble-text` and the module falls back to the element
 * itself when there is none.
 */
registerModule('hover-scramble', (el) => {
  const target = el.querySelector<HTMLElement>('[data-scramble-text]') ?? el;
  const text = target.textContent?.trim();
  if (!text) return;

  const gsap = initGsap();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const run = () => {
    if (reduceMotion.matches) return;
    gsap.killTweensOf(target);
    gsap.to(target, {
      duration: DURATION,
      ease: 'none',
      scrambleText: { text, chars: CHARS, speed: 0.6 },
    });
  };

  el.addEventListener('pointerenter', run);
  el.addEventListener('focus', run);

  return () => {
    gsap.killTweensOf(target);
    target.textContent = text;
    el.removeEventListener('pointerenter', run);
    el.removeEventListener('focus', run);
  };
});
