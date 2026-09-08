import { registerModule } from './modules';
import { initGsap } from './gsap';

const SCRAMBLE_S = 0.45;

/**
 * About page: hovering an experiment strip clip dims every tool that was not
 * used on that experiment. Hovering a tool dims the other tools and opens the
 * strip columns for the experiments that tool carried — same widen + scramble
 * as hovering those clips directly.
 */
registerModule('about-tools', (root) => {
  const tools = [...root.querySelectorAll<HTMLElement>('[data-tool-exps]')];
  const clips = [...root.querySelectorAll<HTMLElement>('[data-exp]')];
  const strip = root.querySelector('.experiment-strip');
  if (!tools.length) return;

  const gsap = initGsap();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const scrambleClip = (clip: HTMLElement, open: boolean) => {
    const link = clip.querySelector<HTMLAnchorElement>('[data-nav-link]');
    const text = clip.querySelector<HTMLElement>('[data-nav-text]');
    if (!link || !text) return;
    const label = open ? link.dataset.hoverLabel : link.dataset.label;
    if (!label) return;

    gsap.killTweensOf(text);
    if (reduceMotion.matches) {
      text.textContent = label;
      return;
    }
    gsap.to(text, {
      duration: SCRAMBLE_S,
      ease: 'none',
      scrambleText: { text: label, chars: 'upperCase', speed: 0.6 },
    });
  };

  const clear = () => {
    root.classList.remove('is-filtering');
    strip?.classList.remove('is-strip-filtered');
    for (const tool of tools) tool.classList.remove('is-active');
    for (const clip of clips) {
      if (!clip.classList.contains('is-open')) continue;
      clip.classList.remove('is-open');
      scrambleClip(clip, false);
    }
  };

  const filterByExp = (exp: string) => {
    root.classList.add('is-filtering');
    for (const tool of tools) {
      const exps = tool.dataset.toolExps?.split(/\s+/).filter(Boolean) ?? [];
      tool.classList.toggle('is-active', exps.includes(exp));
    }
  };

  const filterByTool = (active: HTMLElement) => {
    root.classList.add('is-filtering');
    strip?.classList.add('is-strip-filtered');
    const exps = active.dataset.toolExps?.split(/\s+/).filter(Boolean) ?? [];

    for (const tool of tools) tool.classList.toggle('is-active', tool === active);

    for (const clip of clips) {
      const open = exps.includes(clip.dataset.exp ?? '');
      const wasOpen = clip.classList.contains('is-open');
      clip.classList.toggle('is-open', open);
      if (open !== wasOpen) scrambleClip(clip, open);
    }
  };

  const onClipEnter = (event: Event) => {
    const exp = (event.currentTarget as HTMLElement).dataset.exp;
    if (exp) filterByExp(exp);
  };

  const onToolEnter = (event: Event) => {
    filterByTool(event.currentTarget as HTMLElement);
  };

  for (const clip of clips) {
    clip.addEventListener('pointerenter', onClipEnter);
    clip.addEventListener('pointerleave', clear);
    clip.addEventListener('focusin', onClipEnter);
    clip.addEventListener('focusout', clear);
  }

  for (const tool of tools) {
    tool.addEventListener('pointerenter', onToolEnter);
    tool.addEventListener('pointerleave', clear);
    tool.addEventListener('focusin', onToolEnter);
    tool.addEventListener('focusout', clear);
  }

  return () => {
    clear();
    for (const clip of clips) {
      clip.removeEventListener('pointerenter', onClipEnter);
      clip.removeEventListener('pointerleave', clear);
      clip.removeEventListener('focusin', onClipEnter);
      clip.removeEventListener('focusout', clear);
    }
    for (const tool of tools) {
      tool.removeEventListener('pointerenter', onToolEnter);
      tool.removeEventListener('pointerleave', clear);
      tool.removeEventListener('focusin', onToolEnter);
      tool.removeEventListener('focusout', clear);
    }
  };
});
