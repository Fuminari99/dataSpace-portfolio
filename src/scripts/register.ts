import { registerModule } from './modules';
import './carousel';
import './nav-scramble';
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
