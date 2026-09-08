import { registerModule } from './modules';
import { initGsap } from './gsap';

/** How long the cross-fade between two clips takes. */
const FADE_S = 0.8;
/** Fallback hold, in seconds, if the section does not name one. */
const DEFAULT_INTERVAL_S = 6;

/**
 * The hero runs through the four experiments' clips rather than sitting on one,
 * and the link under the wordmark is retargeted with each change so it always
 * points at the experiment currently on screen.
 *
 * Only the clip on screen is loaded and playing; the rest stay at their poster
 * until their turn comes, so the page does not fetch four films up front.
 */
registerModule('hero-cycle', (root) => {
  const clips = [...root.querySelectorAll<HTMLVideoElement>('[data-hero-clip]')];
  const link = root.querySelector<HTMLAnchorElement>('[data-hero-link]');
  const label = link?.querySelector<HTMLElement>('[data-scramble-text]');
  if (clips.length < 2 || !link || !label) return;

  const gsap = initGsap();

  // The label and destination for each clip are read off the markup, so the
  // data stays in one place — home.ts — rather than being repeated here.
  const targets = clips.map((clip) => ({
    href: clip.dataset.href ?? '',
    label: clip.dataset.label ?? '',
  }));

  const load = (clip: HTMLVideoElement) => {
    // Only the first clip carries its poster down with the page; the other
    // three are three more full stills, and none of them is on screen yet.
    if (clip.dataset.poster) {
      clip.poster = clip.dataset.poster;
      delete clip.dataset.poster;
    }

    for (const source of clip.querySelectorAll('source[data-src]')) {
      source.setAttribute('src', source.getAttribute('data-src')!);
      source.removeAttribute('data-src');
    }
    if (!clip.dataset.loaded) {
      clip.dataset.loaded = 'true';
      clip.load();
    }
  };

  const play = (clip: HTMLVideoElement) => {
    load(clip);
    // Autoplay can still be refused; the poster frame simply stays up.
    void clip.play().catch(() => {});
  };

  let index = 0;
  let timer = 0;
  let onScreen = true;

  const show = (next: number) => {
    if (next === index) return;
    const from = clips[index];
    const to = clips[next];

    play(to);

    gsap.to(from, { opacity: 0, duration: FADE_S, ease: 'none' });
    gsap.to(to, {
      opacity: 1,
      duration: FADE_S,
      ease: 'none',
      onComplete: () => from.pause(),
    });

    from.setAttribute('aria-hidden', 'true');
    to.removeAttribute('aria-hidden');

    const target = targets[next];
    if (target.href) link.href = target.href;
    if (target.label) {
      label.textContent = target.label;
      // hover-scramble resolves to whatever this holds, so the two stay in step.
      label.dataset.scrambleText = target.label;
      link.setAttribute('aria-label', `Go to ${target.label}`);
    }

    index = next;
  };

  const advance = () => show((index + 1) % clips.length);

  const interval =
    Number(getComputedStyle(root).getPropertyValue('--hero-interval')) || DEFAULT_INTERVAL_S;

  const start = () => {
    stop();
    timer = window.setInterval(() => {
      if (onScreen) advance();
    }, interval * 1000);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = 0;
  };

  // Reduced motion keeps the hero on the first clip: no cross-fade, and no
  // footage swapping out from under someone who asked for less movement.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const sync = () => {
    if (reduce.matches) {
      stop();
      return;
    }
    start();
  };

  play(clips[0]);
  gsap.set(clips[0], { opacity: 1 });
  sync();
  reduce.addEventListener('change', sync);

  // Scrolled past, the hero has nothing to show — pause rather than leave four
  // clips decoding behind the rest of the page.
  let observer: IntersectionObserver | null = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        onScreen = entry.isIntersecting;
        if (onScreen) play(clips[index]);
        else clips[index].pause();
      }
    });
    observer.observe(root);
  }

  return () => {
    stop();
    reduce.removeEventListener('change', sync);
    observer?.disconnect();
    for (const clip of clips) {
      gsap.killTweensOf(clip);
      clip.pause();
    }
  };
});
