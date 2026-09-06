import { registerModule } from './modules';
import './carousel';
import './nav-scramble';
import './heading-scramble';
import './hover-scramble';
import './tabs';

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
 * The home page's header is an overlay (see SiteHeader) so the carousel can
 * start at the very top of the viewport. It stays off screen for as long as the
 * carousel is in view and comes back once the page has scrolled past it.
 */
registerModule('header-reveal', (el) => {
  const carousel = document.querySelector('[data-module~="carousel"]');

  // No carousel to hide behind, or no observer to watch it with: show the bar
  // rather than leave the page without navigation.
  if (!carousel || !('IntersectionObserver' in window)) {
    el.classList.add('is-revealed');
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) el.classList.toggle('is-revealed', !entry.isIntersecting);
  });
  observer.observe(carousel);

  return () => {
    observer.disconnect();
    el.classList.remove('is-revealed');
  };
});
