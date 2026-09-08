import { registerModule } from './modules';
import { initGsap } from './gsap';

/** Each thumbnail arrives this long after the one before it, in random order. */
const STAGGER_S = 0.04;
const MEDIA_S = 0.4;
const MEDIA_EASE = 'power4.out';
/** The row that is being left behind closes faster than the one opening. */
const REVERSE_SCALE = 3;
const ROW_S = 0.2;
const ROW_EASE = 'power2.inOut';

/**
 * The home page's experiment list. One row is open at a time: its thumbnails
 * rise into place in a random order while the row itself takes the height the
 * others give up. Pointing at another row hands the space over.
 *
 * Each row's media has a timeline of its own, held paused except for the row
 * that is open, so opening is a play and closing is the same timeline reversed.
 */
registerModule('experiment-rows', (root) => {
  const rows = [...root.querySelectorAll<HTMLElement>('[data-row]')];
  if (rows.length < 2) return;

  const gsap = initGsap();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Without motion the list stays as rendered: every row open, nothing moving.
  if (reduceMotion.matches) return;

  const open = getComputedStyle(root).getPropertyValue('--row-open').trim();
  const shut = getComputedStyle(root).getPropertyValue('--row-shut').trim();

  let active = 0;

  const timelines = rows.map((row, index) => {
    const media = row.querySelectorAll<HTMLElement>('[data-row-media]');

    gsap.set(row, { flexBasis: index === 0 ? open : shut });
    row.dataset.open = index === 0 ? 'true' : 'false';
    gsap.set(media, { yPercent: 100 });

    const tl = gsap.timeline({ paused: index !== 0 });
    tl.to(media, {
      yPercent: 0,
      stagger: { each: STAGGER_S, from: 'random' },
      duration: MEDIA_S,
      ease: MEDIA_EASE,
    });

    return tl;
  });

  // The first row is open from the start, so its timeline is already at its end
  // rather than waiting to be played.
  timelines[0].progress(1);

  const activate = (index: number) => {
    if (index === active) return;

    timelines[active].timeScale(REVERSE_SCALE).reverse();
    active = index;
    timelines[index].timeScale(1).play();

    gsap.to(rows, { flexBasis: shut, duration: ROW_S, ease: ROW_EASE });
    gsap.to(rows[index], { flexBasis: open, duration: ROW_S, ease: ROW_EASE });

    for (const [i, row] of rows.entries()) row.dataset.open = i === index ? 'true' : 'false';
  };

  const listeners = rows.map((row, index) => {
    const enter = () => activate(index);
    row.addEventListener('mouseenter', enter);
    // Tabbing to a row's link has to open it too, or the copy behind it is
    // reachable by keyboard but never visible.
    row.addEventListener('focusin', enter);
    return () => {
      row.removeEventListener('mouseenter', enter);
      row.removeEventListener('focusin', enter);
    };
  });

  return () => {
    for (const off of listeners) off();
    for (const tl of timelines) tl.kill();
    for (const row of rows) {
      gsap.killTweensOf(row);
      gsap.set(row, { clearProps: 'flexBasis' });
      delete row.dataset.open;
      gsap.set(row.querySelectorAll('[data-row-media]'), { clearProps: 'transform' });
    }
  };
});
