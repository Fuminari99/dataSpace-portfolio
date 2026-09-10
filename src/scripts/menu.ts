import { registerModule } from './modules';
import { initGsap } from './gsap';

/** The panel travels its own height; expo.out lands it hard and then settles. */
const EASE = 'expo.out';
const OPEN_S = 1.05;
const CLOSE_S = 0.5;
/** The links arrive after the panel has most of the way there. */
const LINK_S = 0.75;
const LINK_STAGGER_S = 0.045;
const LINK_DELAY_S = 0.18;
/** Same resolve the header's own labels use. */
const LINK_CHARS = 'upperCase';
const LINK_SPEED = 0.6;
/** The icon folds in step with the panel, a touch quicker so it leads. */
const ICON_S = 0.6;
/**
 * The icon's two states, as the end points of each rule in the 24-unit box.
 * Both open rules run through (12, 12), so the cross meets dead centre.
 */
const ICON_BARS = {
  closed: [
    { x1: 2, y1: 9, x2: 22, y2: 9 },
    { x1: 2, y1: 15, x2: 22, y2: 15 },
  ],
  open: [
    { x1: 5, y1: 5, x2: 19, y2: 19 },
    { x1: 5, y1: 19, x2: 19, y2: 5 },
  ],
} as const;

/**
 * The narrow-screen menu. The bar carries three items and hangs four more off
 * Projects, which is more than a phone has room for, so below the breakpoint
 * the bar hands over to a button and a panel that covers the page.
 *
 * The markup is rendered open-able but closed, and every link in it is a real
 * link: with the script gone the panel simply never opens and the footer still
 * carries the whole site map. Nothing here runs above the breakpoint — the
 * button is not in the layout there, so the module returns early.
 */
registerModule('menu', (root) => {
  const toggle = root.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = root.querySelector<HTMLElement>('[data-menu-panel]');
  if (!toggle || !panel) return;

  const links = [...panel.querySelectorAll<HTMLElement>('[data-menu-link]')];
  /**
   * Taken before anything scrambles them: a tween killed part-way would
   * otherwise leave a link holding the characters it was passing through, and
   * the next open would resolve to those instead of the label.
   */
  const labels = new Map(links.map((link) => [link, link.textContent ?? '']));

  const restore = () => {
    for (const [link, text] of labels) link.textContent = text;
  };

  /**
   * The row rather than the link, so the dash marking an experiment as nested
   * fades up with the label it belongs to instead of sitting there waiting for
   * it.
   */
  const rows = links.map((link) => link.closest('li') ?? link);

  /** The two rules of the icon: apart for the bars, crossed for the close. */
  const bars = [...root.querySelectorAll<SVGLineElement>('[data-menu-bar]')];
  const gsap = initGsap();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let open = false;

  const paint = (next: boolean) => {
    toggle.setAttribute('aria-expanded', String(next));
    toggle.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
    panel.toggleAttribute('data-open', next);
    // The page behind the panel must not scroll under it, and must not be
    // reachable by tab while it is covered.
    document.documentElement.classList.toggle('has-menu-open', next);
    panel.setAttribute('aria-hidden', String(!next));
  };

  const setOpen = (next: boolean) => {
    if (next === open) return;
    open = next;
    paint(next);

    gsap.killTweensOf([panel, ...links, ...rows, ...bars]);

    /**
     * The rules are drawn into their new positions rather than rotated into
     * them. Turning them about a point while their geometry is also moving
     * leaves the centre of the cross depending on where the box happened to be
     * when the turn was worked out, and it lands off to one side; the end
     * points cannot drift.
     */
    const icon = (duration: number) => {
      const state = next ? ICON_BARS.open : ICON_BARS.closed;
      bars.forEach((line, index) => {
        const attr = state[index];
        if (!attr) return;
        const vars = { attr, duration, ease: EASE };
        if (duration === 0) gsap.set(line, vars);
        else gsap.to(line, vars);
      });
    };

    icon(reduceMotion.matches ? 0 : ICON_S);

    if (reduceMotion.matches) {
      restore();
      gsap.set(panel, { yPercent: next ? 0 : -100, autoAlpha: next ? 1 : 0 });
      gsap.set(rows, { autoAlpha: next ? 1 : 0 });
      return;
    }

    if (next) {
      gsap.set(rows, { autoAlpha: 0 });
      gsap.fromTo(
        panel,
        { yPercent: -100, autoAlpha: 1 },
        { yPercent: 0, duration: OPEN_S, ease: EASE }
      );
      // Each label resolves out of a scramble as it fades up — the same
      // treatment the bar gives its own labels — and the list fills from the
      // bottom, so About arrives first and Project Concept last.
      links.forEach((link, index) => {
        const step = links.length - 1 - index;
        gsap.to(rows[index], {
          autoAlpha: 1,
          duration: LINK_S,
          ease: EASE,
          delay: LINK_DELAY_S + step * LINK_STAGGER_S,
        });
        gsap.to(link, {
          duration: LINK_S,
          ease: EASE,
          delay: LINK_DELAY_S + step * LINK_STAGGER_S,
          scrambleText: { text: labels.get(link) ?? '', chars: LINK_CHARS, speed: LINK_SPEED },
        });
      });
      return;
    }

    gsap.to(panel, {
      yPercent: -100,
      duration: CLOSE_S,
      ease: EASE,
      onComplete: () => {
        gsap.set(panel, { autoAlpha: 0 });
        // Back to the labels, ready for the next open.
        restore();
      },
    });
  };

  const onToggle = () => setOpen(!open);
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  };
  // Following a link swaps the page under the panel; it should not still be
  // sitting there when the new one arrives.
  const onLink = () => setOpen(false);

  toggle.addEventListener('click', onToggle);
  document.addEventListener('keydown', onKey);
  for (const link of links) link.addEventListener('click', onLink);

  // Widening past the breakpoint puts the real bar back; a panel left open
  // would cover it.
  const wide = window.matchMedia('(min-width: 48rem)');
  const onWide = () => wide.matches && setOpen(false);
  wide.addEventListener('change', onWide);

  gsap.set(panel, { yPercent: -100, autoAlpha: 0 });
  paint(false);

  return () => {
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('keydown', onKey);
    for (const link of links) link.removeEventListener('click', onLink);
    wide.removeEventListener('change', onWide);
    gsap.killTweensOf([panel, ...links, ...rows, ...bars]);
    restore();
    document.documentElement.classList.remove('has-menu-open');
  };
});
