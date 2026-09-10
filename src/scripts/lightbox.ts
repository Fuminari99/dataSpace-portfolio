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
  /** The set the open figure belongs to, and where in it we are. */
  let group: HTMLElement[] = [];
  let index = 0;
  let show: ((next: number) => void) | null = null;

  const close = () => {
    if (!sheet) return;
    sheet.remove();
    sheet = null;
    document.documentElement.classList.remove('is-lightboxed');
    getLenis()?.start();
    opener?.focus();
    opener = null;
    group = [];
    show = null;
  };

  /** Copies whatever the figure holds into the sheet's frame. */
  const fill = (frame: HTMLElement, source: HTMLElement) => {
    const media = source.querySelector<HTMLElement>('video, img') ?? source;
    const label = media.getAttribute('aria-label') ?? media.getAttribute('alt') ?? 'Figure';
    frame.replaceChildren();

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

    return label;
  };

  const open = (source: HTMLElement) => {
    /**
     * A figure in a marked set can be stepped through without closing the
     * sheet; one on its own simply opens. The set is read off the page rather
     * than passed in, so marking a row is all a section has to do.
     */
    const owner = source.closest<HTMLElement>('[data-lightbox-group]');
    group = owner ? [...owner.querySelectorAll<HTMLElement>('[data-lightbox]')] : [source];
    index = Math.max(0, group.indexOf(source));

    const media = source.querySelector<HTMLElement>('video, img') ?? source;
    const label = media.getAttribute('aria-label') ?? media.getAttribute('alt') ?? 'Figure';

    sheet = document.createElement('div');
    sheet.className = 'lightbox';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', label);

    const frame = document.createElement('div');
    frame.className = 'lightbox__frame';
    fill(frame, source);

    const step = (direction: -1 | 1) => {
      const target = document.createElement('button');
      target.type = 'button';
      target.className = `lightbox__step is-${direction === -1 ? 'prev' : 'next'} font-display`;
      target.setAttribute('aria-label', direction === -1 ? 'Previous figure' : 'Next figure');
      target.textContent = direction === -1 ? '←' : '→';
      target.addEventListener('click', () => show?.(index + direction));
      return target;
    };

    show = (nextIndex: number) => {
      if (!sheet || group.length < 2) return;
      // Round the ends: the set is a loop, not a run with two dead stops.
      index = (nextIndex + group.length) % group.length;
      sheet.setAttribute('aria-label', fill(frame, group[index]));
      opener = group[index];
    };

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lightbox__close font-display';
    button.setAttribute('aria-label', 'Close');
    button.textContent = '×';

    sheet.append(frame, button);
    if (group.length > 1) sheet.append(step(-1), step(1));

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
    if (!sheet) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show?.(index - 1);
    if (event.key === 'ArrowRight') show?.(index + 1);
  };

  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  return () => {
    close();
    root.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
});
