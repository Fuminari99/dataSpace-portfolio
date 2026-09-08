import { registerModule } from './modules';
import { initGsap, ScrollTrigger } from './gsap';
import { getLenis } from './smooth-scroll';

/** The portrait dissolves; it is the slowest part of the change. */
const PORTRAIT_S = 0.7;
/** The paragraph being left goes before the next one arrives. */
const BIO_OUT_S = 0.3;
const BIO_IN_S = 0.4;
/** Screens of scroll spent handing the frame from one person to the next. */
const STEP_SCREENS = 1;

/**
 * The About page's three profiles, read one at a time. The group is pinned in
 * the middle of the screen; scrolling past it hands the frame to the next
 * person, and the page carries on once the last one has been reached.
 *
 * The three parts of a profile change differently, because they are doing
 * different things. The list of names does not go anywhere — it only shifts
 * which name is at full strength, since it is the one fixed thing to read the
 * change against. The portrait dissolves into the next, and the paragraphs are
 * simply handed over: one out, the next in behind it.
 *
 * Left alone the markup is three profiles in a row down the page, so this is
 * only ever an enhancement — it is not mounted at all when the reader has asked
 * for less motion.
 */
registerModule('member-stack', (root) => {
  const viewport = root.querySelector<HTMLElement>('[data-stack-viewport]');
  const panels = [...root.querySelectorAll<HTMLElement>('[data-stack-panel]')];
  if (!viewport || panels.length < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // The stacked pin only fits once the profile is a two-column row; below that
  // the three profiles simply read down the page as the markup already does.
  const wide = window.matchMedia('(min-width: 64rem)');
  if (reduceMotion.matches || !wide.matches) return;

  const gsap = initGsap();
  const steps = panels.length - 1;

  const portraits = panels.map((panel) => panel.querySelector<HTMLElement>('[data-stack-portrait]'));
  const bios = panels.map((panel) => panel.querySelector<HTMLElement>('[data-stack-bio]'));
  // Only the first panel's list stays on screen once they are stacked, so that
  // is the one driven.
  const tabs = [...panels[0].querySelectorAll<HTMLElement>('[data-stack-tab]')];

  root.classList.add('is-stacked');
  gsap.set([...portraits.slice(1), ...bios.slice(1)], { autoAlpha: 0 });

  let current = 0;

  /**
   * The arrows step along the run one person at a time, for a reader who would
   * rather press than scroll. They move the scroll rather than the panels, so
   * the pinned position and what is on screen cannot come apart.
   */
  const prev = root.querySelector<HTMLButtonElement>('[data-stack-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-stack-next]');

  const syncArrows = () => {
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === steps;
  };

  const show = (next: number) => {
    if (next === current || !panels[next]) return;
    const from = current;
    current = next;

    for (const [index, tab] of tabs.entries()) {
      tab.classList.toggle('is-active', index === next);
      if (index === next) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    }

    syncArrows();

    gsap.to(portraits[from], { autoAlpha: 0, duration: PORTRAIT_S, ease: 'none' });
    gsap.to(portraits[next], { autoAlpha: 1, duration: PORTRAIT_S, ease: 'none' });

    // One paragraph out, the next one in behind it.
    gsap.to(bios[from], { autoAlpha: 0, duration: BIO_OUT_S });
    gsap.to(bios[next], { autoAlpha: 1, duration: BIO_IN_S, delay: BIO_OUT_S });
  };

  const trigger = ScrollTrigger.create({
    trigger: viewport,
    start: 'top top',
    end: () => `+=${window.innerHeight * steps * STEP_SCREENS}`,
    pin: true,
    invalidateOnRefresh: true,
    // Each person holds their share of the run rather than dissolving across
    // it: the change happens once, on the way past the threshold.
    onUpdate: (self) => show(Math.round(self.progress * steps)),
  });

  /**
   * The footer links to each of us by name. With the profiles stacked those ids
   * all sit at the same place on the page, so the jump has to be to the point
   * in the pinned run where that person is the one showing.
   */
  const jumpToIndex = (index: number, immediate = true) => {
    if (index < 0 || index > steps) return false;

    const top = trigger.start + ((trigger.end - trigger.start) * index) / steps;

    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top, { immediate, force: true });
    else window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });

    return true;
  };

  const jumpToPanel = (hash: string) => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    const index = panels.findIndex((panel) => panel.dataset.stackId === id);
    if (index <= 0) return false;
    return jumpToIndex(index);
  };

  // Wired once the run has been measured, since pressing one is a jump into it.
  const onPrev = () => jumpToIndex(current - 1, false);
  const onNext = () => jumpToIndex(current + 1, false);
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  syncArrows();

  const onHashChange = () => jumpToPanel(window.location.hash);
  window.addEventListener('hashchange', onHashChange);

  // The names double as jumps between the three, which is what they are for
  // without the script — here they move the pinned run instead of the page.
  const onTabClick = (event: MouseEvent) => {
    const tab = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-stack-tab]');
    if (!tab) return;
    if (jumpToPanel(new URL(tab.href).hash)) event.preventDefault();
  };
  root.addEventListener('click', onTabClick);

  // A link followed from another page arrives with the hash already set, and
  // the pin has to be measured before the jump can be worked out.
  ScrollTrigger.refresh();
  requestAnimationFrame(() => jumpToPanel(window.location.hash));

  return () => {
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    if (prev) prev.disabled = false;
    if (next) next.disabled = false;
    window.removeEventListener('hashchange', onHashChange);
    root.removeEventListener('click', onTabClick);
    trigger.kill();
    root.classList.remove('is-stacked');
    gsap.set([...portraits, ...bios].filter(Boolean), { clearProps: 'opacity,visibility' });
    for (const [index, tab] of tabs.entries()) tab.classList.toggle('is-active', index === 0);
  };
});
