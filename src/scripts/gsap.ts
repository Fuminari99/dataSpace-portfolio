import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

let registered = false;

/**
 * Plugins have to be registered before the first tween that uses them, and
 * registering twice is harmless but pointless, so it happens once here.
 *
 * When something scroll-driven is added later, register ScrollTrigger here too
 * and forward Lenis's scroll events to `ScrollTrigger.update` — Lenis moves the
 * real window scroll, so no scroller proxy is needed.
 */
export function initGsap() {
  if (!registered) {
    registered = true;
    gsap.registerPlugin(ScrambleTextPlugin);
  }
  return gsap;
}

export { gsap };
