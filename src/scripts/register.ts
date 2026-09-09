import { registerModule } from './modules';
import './carousel';
import './nav-scramble';
import './heading-scramble';
import './hover-scramble';
import './hero-cycle';
import './hero-cells';
import './experiment-rows';
import './reveal';
import './sound-mixer';
import './lightbox';
import './cursor';
import './about-tools';

/**
 * Experiment footage is heavy and there is a lot of it on one page, so a clip
 * is fetched the first time it comes into view and only plays while it is on
 * screen. Off-screen clips are paused rather than left decoding in the
 * background.
 */
registerModule('lazy-video', (el) => {
  const video = el as HTMLVideoElement;
  let loaded = false;

  const load = () => {
    if (loaded) return;
    loaded = true;
    // The poster is a full still of its own, and a page carries a dozen of
    // them: they are worth as much as the clip is, and no sooner.
    if (video.dataset.poster) {
      video.poster = video.dataset.poster;
      delete video.dataset.poster;
    }
    for (const source of video.querySelectorAll('source[data-src]')) {
      source.setAttribute('src', source.getAttribute('data-src')!);
      source.removeAttribute('data-src');
    }
    video.load();
  };

  const play = () => {
    load();
    // Autoplay can still be refused; there is nothing to recover from, the
    // poster frame simply stays up.
    void video.play().catch(() => {});
  };

  if (!('IntersectionObserver' in window)) {
    play();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) play();
        else if (loaded) video.pause();
      }
    },
    { rootMargin: '200px' }
  );
  observer.observe(video);

  return () => {
    observer.disconnect();
    video.pause();
  };
});

/**
 * The home page's header is an overlay (see SiteHeader) so the hero can start
 * at the very top of the viewport. White over the footage, it swaps to the
 * page's own colours once the hero's bottom edge has gone by.
 */
registerModule('header-reveal', (el) => {
  const sentinel = document.querySelector('[data-header-sentinel]');

  // Nothing to watch, or no observer to watch it with: give the bar the paper
  // background, which is legible against any page.
  if (!sentinel || !('IntersectionObserver' in window)) {
    el.classList.add('is-on-paper');
    return;
  }

  // The swap has to happen when the hero's bottom edge reaches the *bar*, not
  // the top of the viewport — otherwise white-on-white for the height of the
  // bar. Pulling the root's top edge down by that height puts the crossing the
  // observer reports exactly where the bar sits.
  const barHeight = () => Math.round(el.getBoundingClientRect().height);

  let observer = new IntersectionObserver(() => {}, {});

  const watch = () => {
    observer.disconnect();
    const offset = barHeight();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          el.classList.toggle('is-on-paper', entry.boundingClientRect.top < offset);
        }
      },
      { rootMargin: `-${offset}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
  };

  watch();

  // The bar's height changes with the viewport, and so does the line the swap
  // has to happen on.
  window.addEventListener('resize', watch);

  return () => {
    window.removeEventListener('resize', watch);
    observer.disconnect();
    el.classList.remove('is-on-paper');
  };
});
