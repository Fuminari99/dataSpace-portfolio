import { registerModule } from './modules';
import { initGsap } from './gsap';

/** How long the cross-fade between two clips takes. */
const FADE_S = 0.8;
/** Fallback hold, in seconds, if the section does not name one. */
const DEFAULT_INTERVAL_S = 6;

/**
 * Cycles stacked `[data-hero-clip]` videos with the same cross-fade the home
 * hero uses. The home hero also retargets `[data-hero-link]` when present;
 * the footer and the about → home panel only need the footage to turn over.
 *
 * Only the clip on screen is loaded and playing; the rest stay at their poster
 * until their turn comes, so the page does not fetch four films up front.
 */
registerModule('hero-cycle', (root) => {
  const clips = [...root.querySelectorAll<HTMLVideoElement>('[data-hero-clip]')];
  if (clips.length < 2) return;

  const link = root.querySelector<HTMLAnchorElement>('[data-hero-link]');
  const label = link?.querySelector<HTMLElement>('[data-scramble-text]');
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
    // A fresh swap cancels whatever fade was still running — otherwise a
    // background-tab backlog leaves two clips half-visible.
    gsap.killTweensOf(clips);
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
    if (link && target.href) link.href = target.href;
    if (link && label && target.label) {
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
      if (onScreen && !document.hidden) advance();
    }, interval * 1000);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = 0;
  };

  // Reduced motion keeps the stack on the first clip: no cross-fade, and no
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
  for (const clip of clips.slice(1)) gsap.set(clip, { opacity: 0 });
  sync();
  reduce.addEventListener('change', sync);

  /**
   * The clock the swap runs on and the clock the cross-fade runs on are not the
   * same one: a background tab keeps firing intervals while it throttles
   * requestAnimationFrame to a stop, so coming back to the page found two clips
   * stranded part-way through a fade and a third marked as the one showing.
   * Whatever happened while nobody was looking, this puts the pile back in
   * order: the clip whose turn it is, at full opacity, and the others at none.
   */
  const settle = () => {
    if (document.hidden) return;
    gsap.killTweensOf(clips);
    for (const [i, clip] of clips.entries()) {
      gsap.set(clip, { opacity: i === index ? 1 : 0 });
      if (i === index) play(clip);
      else clip.pause();
    }
  };

  document.addEventListener('visibilitychange', settle);

  // Scrolled past, the stack has nothing to show — pause rather than leave
  // four clips decoding behind the rest of the page.
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
    document.removeEventListener('visibilitychange', settle);
    reduce.removeEventListener('change', sync);
    observer?.disconnect();
    for (const clip of clips) {
      gsap.killTweensOf(clip);
      clip.pause();
    }
  };
});
