import { registerModule } from './modules';
import { initGsap, ScrollTrigger } from './gsap';
import { getLenis } from './smooth-scroll';

/**
 * One person leaves before the next arrives. Cross-fading them would have two
 * sets of paragraphs on top of one another through the middle of every hand-off,
 * which is unreadable — so the outgoing panel is gone by the time the incoming
 * one starts.
 */
const FADE = 0.45;
const HANDOVER = 0.55;
/** Screens of scroll spent handing the frame from one person to the next. */
const STEP_SCREENS = 1;

/**
 * The About page's three profiles, read one at a time. The group is pinned in
 * the middle of the screen; scrolling past it cross-fades to the next person,
 * and the page carries on once the last one has been reached.
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
  if (reduceMotion.matches) return;

  const gsap = initGsap();
  const steps = panels.length - 1;

  root.classList.add('is-stacked');
  gsap.set(panels.slice(1), { autoAlpha: 0 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: viewport,
      start: 'top top',
      end: () => `+=${window.innerHeight * steps * STEP_SCREENS}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  for (const [index, panel] of panels.entries()) {
    if (index === 0) continue;
    timeline
      .to(panels[index - 1], { autoAlpha: 0, duration: FADE }, index - 1)
      .to(panel, { autoAlpha: 1, duration: FADE }, index - 1 + HANDOVER);
  }

  /**
   * The footer links to each of us by name. With the profiles stacked those
   * ids all sit at the same place on the page, so the jump has to be to the
   * point in the pinned run where that person is the one showing.
   */
  const jumpToPanel = (hash: string) => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    const index = panels.findIndex((panel) => panel.dataset.stackId === id);
    if (index <= 0) return false;

    const trigger = timeline.scrollTrigger!;
    const top = trigger.start + ((trigger.end - trigger.start) * index) / steps;

    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo({ top, behavior: 'auto' });

    return true;
  };

  const onHashChange = () => jumpToPanel(window.location.hash);
  window.addEventListener('hashchange', onHashChange);

  // A link followed from another page arrives with the hash already set, and
  // the pin has to be measured before the jump can be worked out.
  ScrollTrigger.refresh();
  requestAnimationFrame(() => jumpToPanel(window.location.hash));

  return () => {
    window.removeEventListener('hashchange', onHashChange);
    timeline.scrollTrigger?.kill();
    timeline.kill();
    root.classList.remove('is-stacked');
    gsap.set(panels, { clearProps: 'opacity,visibility' });
  };
});
