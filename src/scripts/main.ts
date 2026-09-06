import barba from '@barba/core';
import { initSmoothScroll, refreshScroll, resetScroll, scrollToHash } from './smooth-scroll';
import { mountModules, unmountModules } from './modules';
import { initGsap } from './gsap';
import './register';

const gsap = initGsap();

const VEIL_S = 0.4;
const ENTER_S = 0.9;
const ENTER_DELAY_S = 0.2;
const EASE = 'expo.out';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A black sheet that sits between the two pages: the outgoing one is dimmed
 * behind it while the incoming one rides up in front. Created once and reused,
 * so a transition does not churn the DOM.
 */
let veil: HTMLElement | null = null;

function getVeil() {
  if (veil) return veil;
  veil = document.createElement('div');
  veil.className = 'page-veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.append(veil);
  return veil;
}

/**
 * Barba runs leave and enter together in sync mode and cleans up as soon as
 * both resolve. Timing them separately let leave finish first, so the cleanup
 * hooks could run while the incoming page was still pinned out of flow — which
 * is what made every other transition come out wrong. Leave now waits on the
 * gate that enter opens, so the order is fixed rather than raced.
 */
let gate: { promise: Promise<void>; open: () => void } | null = null;

function getGate() {
  if (!gate) {
    let open!: () => void;
    const promise = new Promise<void>((resolve) => {
      open = resolve as () => void;
    });
    gate = { promise, open };
  }
  return gate;
}

/**
 * The outgoing page stays where it is, at its own scroll position, and is
 * pushed behind the veil rather than moved or faded out itself.
 */
async function leavePage(): Promise<void> {
  if (reduceMotion()) return;

  const sheet = getVeil();
  sheet.style.display = 'block';
  gsap.fromTo(sheet, { opacity: 0 }, { opacity: 0.5, duration: VEIL_S, ease: EASE });

  await getGate().promise;
}

/**
 * The incoming page rises from below the fold and comes to rest covering the
 * viewport. It is taken out of flow for the duration (`is-entering`) so the two
 * containers overlap instead of stacking, and so the offset cannot stretch the
 * document and flash a scrollbar.
 */
async function enterPage(el: HTMLElement): Promise<void> {
  if (reduceMotion()) {
    resetScroll();
    getGate().open();
    gate = null;
    return;
  }

  document.body.style.overflow = 'hidden';
  el.classList.add('is-entering');

  try {
    await gsap.fromTo(
      el,
      { y: '100vh' },
      { y: 0, duration: ENTER_S, delay: ENTER_DELAY_S, ease: EASE }
    );
  } finally {
    // Order matters. Scroll is reset natively while the page is still pinned,
    // where the document height is irrelevant; only then does it drop back into
    // flow and Lenis re-measure against the real height.
    window.scrollTo(0, 0);
    el.classList.remove('is-entering');
    gsap.set(el, { clearProps: 'transform' });
    document.body.style.overflow = '';
    refreshScroll();
    resetScroll();

    if (veil) {
      gsap.killTweensOf(veil);
      veil.style.display = 'none';
      veil.style.opacity = '0';
    }

    getGate().open();
    gate = null;
  }
}

declare global {
  interface Window {
    __dataSpacesBooted?: boolean;
  }
}

function boot() {
  // A hot reload in dev re-runs this module against a live page, and a second
  // barba.init() leaves two containers in the DOM and blanks the page.
  if (window.__dataSpacesBooted) return;
  window.__dataSpacesBooted = true;

  initSmoothScroll();
  mountModules();

  barba.init({
    debug: false,
    transitions: [
      {
        name: 'slide-up',
        // Both containers live at once, which is what lets the outgoing page
        // stay put while the incoming one rides up over it.
        sync: true,
        leave: () => leavePage(),
        enter: ({ next }) => enterPage(next.container),
      },
    ],
    views: [
      {
        namespace: 'default',
        beforeLeave: ({ current }) => unmountModules(current.container),
        // No scroll reset here: the outgoing page is still on screen and would
        // visibly jump. enterPage resets once the new page covers it.
        afterEnter: ({ next }) => mountModules(next.container),
      },
    ],
  });

  barba.hooks.after(() => {
    // The old container is gone by now, so this is the first point at which the
    // document has its final height.
    refreshScroll();
    // A footer or header link can name a section on the incoming page; landing
    // there beats landing at the top.
    if (!scrollToHash(window.location.hash, true)) resetScroll();
  });

  // Barba only swaps pages, so a link to a section of the page already open has
  // to be handled here. Capture runs ahead of Barba's own click handling.
  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank') return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash) return;

      const path = (value: string) => value.replace(/\/$/, '') || '/';
      if (path(url.pathname) !== path(window.location.pathname)) return;

      if (!scrollToHash(url.hash)) return;
      event.preventDefault();
      event.stopPropagation();
      window.history.pushState(null, '', url.hash);
      // pushState is silent, so anything keyed to the hash (the Ex01 tabs) has
      // to be told the fragment changed.
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
    true
  );

  // Arriving with a hash already in the URL, e.g. from a shared link.
  if (window.location.hash) {
    requestAnimationFrame(() => scrollToHash(window.location.hash, true));
  }
}

boot();
