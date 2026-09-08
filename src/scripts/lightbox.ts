import { registerModule } from './modules';
import { getLenis } from './smooth-scroll';

/**
 * Any figure in the archive can be opened at size: clicking one puts it on a
 * black sheet over the page, at its own proportions, and Escape or a click on
 * the sheet puts it back.
 *
 * The media is not moved — a copy is made — so a clip that was playing in the
 * page carries on where it was and nothing has to be put back afterwards.
 */
registerModule('lightbox', (root) => {
  let sheet: HTMLElement | null = null;
  let opener: HTMLElement | null = null;

  const close = () => {
    if (!sheet) return;
    sheet.remove();
    sheet = null;
    document.documentElement.classList.remove('is-lightboxed');
    getLenis()?.start();
    opener?.focus();
    opener = null;
  };

  const open = (source: HTMLElement) => {
    const media = source.querySelector<HTMLElement>('video, img') ?? source;
    const label = media.getAttribute('aria-label') ?? media.getAttribute('alt') ?? 'Figure';

    sheet = document.createElement('div');
    sheet.className = 'lightbox';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', label);

    const frame = document.createElement('div');
    frame.className = 'lightbox__frame';

    if (media instanceof HTMLVideoElement) {
      const video = document.createElement('video');
      const file = media.querySelector('source')?.getAttribute('src');
      const pending = media.querySelector('source')?.getAttribute('data-src');
      video.src = file ?? pending ?? '';
      video.poster = media.poster;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('role', 'img');
      video.setAttribute('aria-label', label);
      frame.append(video);
    } else if (media instanceof HTMLImageElement) {
      const image = document.createElement('img');
      image.src = media.currentSrc || media.src;
      image.alt = media.alt;
      frame.append(image);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lightbox__close font-display';
    button.setAttribute('aria-label', 'Close');
    button.textContent = '×';

    sheet.append(frame, button);

    /**
     * The sheet is appended to the body rather than to the page's container, so
     * a click on it never reaches the listener below — it carries its own.
     * Anything that is not the figure itself puts the figure back.
     */
    sheet.addEventListener('click', (event) => {
      const hit = event.target as HTMLElement;
      if (!hit.closest('.lightbox__frame') || hit.closest('.lightbox__close')) close();
    });

    document.body.append(sheet);
    document.documentElement.classList.add('is-lightboxed');
    // Lenis keeps moving the page behind the sheet otherwise.
    getLenis()?.stop();
    button.focus();
  };

  const onClick = (event: MouseEvent) => {
    if (sheet) return;

    const target = event.target as HTMLElement;
    const source = target.closest<HTMLElement>('[data-lightbox]');
    // A figure inside a link is a way into the page it points at; opening it
    // over the top would take that away.
    if (!source || target.closest('a')) return;

    event.preventDefault();
    opener = source;
    open(source);
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  return () => {
    close();
    root.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
});
