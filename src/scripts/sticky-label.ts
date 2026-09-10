import { registerModule } from './modules';
import { initGsap, ScrollTrigger } from './gsap';

/** The layout this belongs to; below it the column is not sticky at all. */
const WIDE = '(min-width: 64rem)';

/**
 * The label beside a column of visuals. Sticky alone can only hold it in one
 * place — the middle — which leaves it hanging half a screen below the first
 * visual before anything has been scrolled, and half a screen above the last
 * one at the end.
 *
 * The track is a viewport-tall sticky box whose top starts at the row's top and
 * whose bottom ends at the row's bottom, so travelling the label from the top
 * of that box to the bottom of it over the length of the scroll lands it level
 * with the first visual to begin with, through the middle while the row is
 * passing, and level with the last visual at the end. The distance is read from
 * the boxes themselves, so it holds whatever the label says.
 */
registerModule('sticky-label', (root) => {
  const track = root.querySelector<HTMLElement>('[data-sticky-track]');
  const content = root.querySelector<HTMLElement>('[data-sticky-content]');
  if (!track || !content) return;

  const gsap = initGsap();
  const wide = window.matchMedia(WIDE);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let trigger: ScrollTrigger | undefined;

  const clear = () => {
    trigger?.kill();
    trigger = undefined;
    gsap.set(content, { clearProps: 'transform' });
  };

  const build = () => {
    clear();
    // Narrow, the column is not sticky and the label simply sits above the
    // visuals; reduced motion keeps it wherever the layout puts it.
    if (!wide.matches || reduceMotion.matches) return;

    const travel = () => Math.max(0, track.offsetHeight - content.offsetHeight);

    trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      // Tied to the scrollbar rather than played: the label's position is a
      // readout of how far through the column the reader is.
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: (self) => gsap.set(content, { y: travel() * self.progress }),
      onUpdate: (self) => gsap.set(content, { y: travel() * self.progress }),
    });
  };

  build();
  wide.addEventListener('change', build);
  reduceMotion.addEventListener('change', build);

  return () => {
    wide.removeEventListener('change', build);
    reduceMotion.removeEventListener('change', build);
    clear();
  };
});
