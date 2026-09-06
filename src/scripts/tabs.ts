import { registerModule } from './modules';
import { initGsap } from './gsap';
import { mountModules, unmountModules } from './modules';

const OUT_S = 0.18;
const IN_S = 0.32;

/**
 * The label row on Ex01 is a real tab group: BREATH / PULSE / BLINK each show
 * their own recordings. Switching is a local crossfade and leaves the URL
 * alone — only arriving with a hash (from a footer or header link) picks a
 * starting tab.
 */
registerModule('tabs', (root) => {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-tab-panel]')];
  if (tabs.length < 2) return;

  const gsap = initGsap();
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const markTabs = (id: string) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  };

  const swap = (from: HTMLElement | undefined, to: HTMLElement) => {
    // Clips inside a hidden panel should not keep playing, and the incoming
    // ones need their observers set up.
    if (from) {
      unmountModules(from);
      from.hidden = true;
    }
    to.hidden = false;
    mountModules(to);
  };

  const select = (id: string, focus = false) => {
    const next = panels.find((panel) => panel.dataset.tabPanel === id);
    if (!next) return;

    markTabs(id);
    if (focus) tabs.find((tab) => tab.dataset.tab === id)?.focus();

    const current = panels.find((panel) => !panel.hidden);
    if (current === next) return;

    if (reduceMotion()) {
      swap(current, next);
      return;
    }

    gsap.killTweensOf(panels);

    const reveal = () => {
      swap(current, next);
      gsap.fromTo(next, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: IN_S, ease: 'power2.out' });
    };

    // Sequential rather than a true crossfade: both panels are in flow, so
    // showing them at once would double the section's height mid-switch.
    if (current) gsap.to(current, { opacity: 0, duration: OUT_S, ease: 'power2.in', onComplete: reveal });
    else reveal();
  };

  const onClick = (event: Event) => select((event.currentTarget as HTMLElement).dataset.tab!);

  // Left/right arrows move between tabs, per the tablist pattern.
  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();

    const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    select(tabs[(current + step + tabs.length) % tabs.length].dataset.tab!, true);
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', onClick);
    tab.addEventListener('keydown', onKeyDown);
  });

  // A footer or header link naming #pulse should open on that tab.
  const onHashChange = () => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (id && panels.some((panel) => panel.dataset.tabPanel === id)) select(id);
  };
  window.addEventListener('hashchange', onHashChange);
  onHashChange();

  return () => {
    gsap.killTweensOf(panels);
    tabs.forEach((tab) => {
      tab.removeEventListener('click', onClick);
      tab.removeEventListener('keydown', onKeyDown);
    });
    window.removeEventListener('hashchange', onHashChange);
  };
});
