import Lenis from 'lenis';
import { gsap } from './gsap';

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
  gsap.killTweensOf(window);
  if (lenis) gsap.killTweensOf(lenis);
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
 *
 * Animated scrolls are driven by GSAP (expo.out) rather than an instant jump —
 * Lenis is updated on each tick so it stays in step with the tween.
 */
export function scrollToHash(hash: string, immediate = false) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  const header = document.querySelector('header');
  const pad = (header?.offsetHeight ?? 0) + 32;
  const current = lenis?.scroll ?? window.scrollY;
  const end = target.getBoundingClientRect().top + current - pad;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.killTweensOf(window);
  if (lenis) gsap.killTweensOf(lenis);

  if (immediate || reduceMotion) {
    if (lenis) lenis.scrollTo(end, { immediate: true, force: true });
    else window.scrollTo(0, end);
    return true;
  }

  const distance = Math.abs(end - current);
  const duration = gsap.utils.clamp(0.7, 1.6, distance / 1800);

  if (lenis) {
    const proxy = { y: current };
    gsap.to(proxy, {
      y: end,
      duration,
      ease: 'expo.out',
      overwrite: true,
      onUpdate: () => {
        lenis?.scrollTo(proxy.y, { immediate: true, force: true });
      },
    });
  } else {
    gsap.to(window, {
      duration,
      ease: 'expo.out',
      overwrite: true,
      scrollTo: { y: end, autoKill: true },
    });
  }

  return true;
}

export function destroySmoothScroll() {
  cancelAnimationFrame(rafId);
  gsap.killTweensOf(window);
  if (lenis) gsap.killTweensOf(lenis);
  lenis?.destroy();
  lenis = null;
}
