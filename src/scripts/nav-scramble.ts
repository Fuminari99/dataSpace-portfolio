import { registerModule } from './modules';
import { initGsap } from './gsap';

const DURATION = 0.45;
const CHARS = 'upperCase';

/**
 * Each header item carries a hover variant in the design: the short label
 * ("Ex01") is replaced by the experiment's full title, and back again on the
 * way out. Both resolve out of a scramble rather than cutting in.
 *
 * The hover target is the wrapper rather than the link, so the whole cell
 * responds and not just the run of text inside it.
 */
registerModule('nav-scramble', (root) => {
  const items = [...root.querySelectorAll<HTMLElement>('[data-nav-item]')];
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = initGsap();
  const teardown: (() => void)[] = [];

  for (const item of items) {
    const text = item.querySelector<HTMLElement>('[data-nav-text]');
    const link = item.querySelector<HTMLAnchorElement>('[data-nav-link]');
    const label = link?.dataset.label;
    const hoverLabel = link?.dataset.hoverLabel;
    if (!text || !label || !hoverLabel) continue;

    // Nothing to swap to, so nothing to animate. The page you are already on is
    // marked static: it shows its full title at rest and stays put on hover.
    if (label === hoverLabel || item.hasAttribute('data-nav-static')) continue;

    let open = false;

    const scramble = (value: string) =>
      gsap.to(text, {
        duration: DURATION,
        ease: 'none',
        scrambleText: { text: value, chars: CHARS, speed: 0.6 },
      });

    const enter = () => {
      if (open) return;
      open = true;
      gsap.killTweensOf(text);

      if (reduceMotion.matches) text.textContent = hoverLabel;
      else scramble(hoverLabel);
    };

    const leave = () => {
      if (!open) return;
      open = false;
      gsap.killTweensOf(text);

      if (reduceMotion.matches) text.textContent = label;
      else scramble(label);
    };

    item.addEventListener('pointerenter', enter);
    item.addEventListener('pointerleave', leave);
    item.addEventListener('focusin', enter);
    item.addEventListener('focusout', leave);

    teardown.push(() => {
      gsap.killTweensOf(text);
      text.textContent = label;
      item.removeEventListener('pointerenter', enter);
      item.removeEventListener('pointerleave', leave);
      item.removeEventListener('focusin', enter);
      item.removeEventListener('focusout', leave);
    });
  }

  return () => teardown.forEach((off) => off());
});
