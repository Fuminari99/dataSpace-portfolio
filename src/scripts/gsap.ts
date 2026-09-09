import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/**
 * Plugins have to be registered before the first tween that uses them, and
 * registering twice is harmless but pointless, so it happens once here.
 *
 * Lenis moves the real window scroll rather than transforming a wrapper, so
 * ScrollTrigger needs no scroller proxy — it only needs telling that a scroll
 * happened, which main.ts does by forwarding Lenis's own event to
 * `ScrollTrigger.update`.
 */
export function initGsap() {
  if (!registered) {
    registered = true;
    gsap.registerPlugin(ScrambleTextPlugin, ScrollToPlugin, ScrollTrigger);
  }
  return gsap;
}

export { gsap, ScrollTrigger };
