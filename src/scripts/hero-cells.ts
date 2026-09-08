import { registerModule } from './modules';
import { initGsap } from './gsap';

const CELL_S = 2.6;
const CELL_STAGGER_S = 0.18;
const COUNT_S = 1.6;
/** How long a readout holds its figure before it is taken again. */
const COUNT_HOLD_S = 6;

/**
 * The squares over the hero footage read as instruments taking a measurement:
 * each one breathes on its own cycle, and the counts beside three of them are
 * re-taken from zero every few seconds.
 *
 * Only opacity and transform are tweened. The squares carry a backdrop blur,
 * and animating anything that forces it to be re-rasterised every frame is what
 * makes that expensive — this way the blur is composited once and left alone.
 */
registerModule('hero-cells', (root) => {
  const cells = [...root.querySelectorAll<HTMLElement>('[data-hero-cell]')];
  const counts = [...root.querySelectorAll<HTMLElement>('[data-hero-count]')];
  if (cells.length === 0 && counts.length === 0) return;

  const gsap = initGsap();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Without motion the squares sit as rendered and the counts keep the figures
  // that came down with the page.
  if (reduceMotion.matches) return;

  const tweens = [
    gsap.fromTo(
      cells,
      { opacity: 0.4 },
      {
        opacity: 1,
        scale: 1.02,
        duration: CELL_S,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: { each: CELL_STAGGER_S, from: 'random' },
      }
    ),

    ...counts.map((el, index) => {
      const target = Number(el.dataset.heroCount);
      const digits = el.textContent?.length ?? 3;
      const value = { current: 0 };

      return gsap.to(value, {
        current: target,
        duration: COUNT_S,
        ease: 'power2.out',
        delay: index * 0.12,
        repeat: -1,
        repeatDelay: COUNT_HOLD_S,
        onUpdate: () => {
          el.textContent = String(Math.round(value.current)).padStart(digits, '0');
        },
        onRepeat: () => {
          value.current = 0;
        },
      });
    }),
  ];

  return () => {
    for (const tween of tweens) tween.kill();
    gsap.set(cells, { clearProps: 'opacity,transform' });
    for (const el of counts) {
      el.textContent = String(el.dataset.heroCount).padStart(3, '0');
    }
  };
});
