import Lenis from 'lenis';

let lenis: Lenis | null = null;
let rafId = 0;

export function getLenis() {
  return lenis;
}

export function initSmoothScroll() {
  if (lenis) return lenis;

  // Users who ask the OS for less motion get the native scroller instead.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  lenis = new Lenis({ autoRaf: false });

  const raf = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  return lenis;
}

/**
 * Jump to the top without a visible scroll animation, used between page
 * transitions. Lenis tracks its own offset alongside the native one, so both
 * have to be reset or the incoming page opens part-way down.
 */
export function resetScroll() {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
}

/** Re-measure after the container swap; Lenis caches the document height. */
export function refreshScroll() {
  lenis?.resize();
}

/**
 * Scroll a section into view under the sticky header. Returns false when the
 * page has no such target, so the caller can fall back to the top.
 */
export function scrollToHash(hash: string, immediate = false) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  // Lenis measures from the element's own offset, so the header has to be
  // subtracted by hand rather than left to CSS scroll-margin.
  const header = document.querySelector('header');
  const offset = -((header?.offsetHeight ?? 0) + 32);

  if (lenis) lenis.scrollTo(target, { offset, immediate });
  else target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' });

  return true;
}

export function destroySmoothScroll() {
  cancelAnimationFrame(rafId);
  lenis?.destroy();
  lenis = null;
}
