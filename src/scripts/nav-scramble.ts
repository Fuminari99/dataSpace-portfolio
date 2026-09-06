import { registerModule } from './modules';
import { initGsap } from './gsap';

const DURATION = 0.45;
const SECTION_DURATION = 0.35;
const SECTION_STAGGER = 0.06;
const CHARS = 'upperCase';

/**
 * Each header item carries a hover variant in the design: the short label
 * ("Ex01") is replaced by the experiment's full title, and the sub-items the
 * footer lists for that column drop in underneath. Both resolve out of a
 * scramble rather than cutting in.
 *
 * The hover target is the wrapper, not the link, so the panel counts as part of
 * the hovered area — moving the pointer down into it, or between its items,
 * never closes it.
 */
registerModule('nav-scramble', (root) => {
  const items = [...root.querySelectorAll<HTMLElement>('[data-nav-item]')];
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = initGsap();
  const teardown: (() => void)[] = [];

  for (const item of items) {
    const text = item.querySelector<HTMLElement>('[data-nav-text]');
    const sections = [...item.querySelectorAll<HTMLElement>('[data-nav-section]')];
    const link = item.querySelector<HTMLAnchorElement>('[data-nav-link]');
    const label = link?.dataset.label;
    const hoverLabel = link?.dataset.hoverLabel;
    if (!text || !label || !hoverLabel) continue;

    const swapsLabel = label !== hoverLabel;
    if (!swapsLabel && !sections.length) continue;

    const targets = [text, ...sections];
    let open = false;

    const scramble = (el: HTMLElement, value: string, duration: number, delay = 0) =>
      gsap.to(el, {
        duration,
        delay,
        ease: 'none',
        scrambleText: { text: value, chars: CHARS, speed: 0.6 },
      });

    const enter = () => {
      if (open) return;
      open = true;
      gsap.killTweensOf(targets);

      if (reduceMotion.matches) {
        if (swapsLabel) text.textContent = hoverLabel;
        sections.forEach((s) => {
          s.textContent = s.dataset.text!;
        });
        return;
      }

      if (swapsLabel) scramble(text, hoverLabel, DURATION);

      // Each is cleared first so it resolves out of nothing as it arrives.
      sections.forEach((section, index) => {
        section.textContent = '';
        scramble(section, section.dataset.text!, SECTION_DURATION, index * SECTION_STAGGER);
      });
    };

    const leave = () => {
      if (!open) return;
      open = false;
      gsap.killTweensOf(targets);

      if (swapsLabel) {
        if (reduceMotion.matches) text.textContent = label;
        else scramble(text, label, DURATION);
      }

      // The panel is hidden by CSS on leave, so its text is simply restored.
      sections.forEach((section) => {
        section.textContent = section.dataset.text!;
      });
    };

    // Keyboard focus moving between the link and the panel's own links stays
    // within the wrapper, so the panel holds open there too.
    const onFocusOut = (event: FocusEvent) => {
      if (item.contains(event.relatedTarget as Node | null)) return;
      leave();
    };

    // pointerleave only fires once the pointer is outside the wrapper *and*
    // every descendant, which is exactly the behaviour wanted here.
    item.addEventListener('pointerenter', enter);
    item.addEventListener('pointerleave', leave);
    item.addEventListener('focusin', enter);
    item.addEventListener('focusout', onFocusOut);

    teardown.push(() => {
      gsap.killTweensOf(targets);
      text.textContent = label;
      sections.forEach((section) => {
        section.textContent = section.dataset.text!;
      });
      item.removeEventListener('pointerenter', enter);
      item.removeEventListener('pointerleave', leave);
      item.removeEventListener('focusin', enter);
      item.removeEventListener('focusout', onFocusOut);
    });
  }

  return () => teardown.forEach((off) => off());
});
