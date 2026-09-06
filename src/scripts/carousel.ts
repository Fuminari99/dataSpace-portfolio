import { mountModules, registerModule, unmountModules } from './modules';

/** Pointer travel, in px, before a drag counts as "move one slide". */
const DRAG_THRESHOLD = 40;
/** Fallback settle delay for browsers without the scrollend event. */
const SETTLE_MS = 140;

registerModule('carousel', (root) => {
  const track = root.querySelector<HTMLElement>('[data-carousel-track]');
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-carousel-dot]')];
  if (!track) return;

  const originals = [...track.querySelectorAll<HTMLElement>('[data-carousel-slide]')];
  const count = originals.length;
  if (count < 2) return;

  // A copy of the set on each side is what makes the loop endless: the strip is
  // always scrollable in both directions, and once a swipe settles we hop back
  // to the equivalent slide in the middle set. The hop is invisible because the
  // clone under the viewport is identical to the original.
  const cloneSet = () =>
    originals.map((slide) => {
      const clone = slide.cloneNode(true) as HTMLElement;
      clone.dataset.carouselClone = '';
      clone.setAttribute('aria-hidden', 'true');
      clone
        .querySelectorAll<HTMLAnchorElement>('a')
        .forEach((anchor) => anchor.setAttribute('tabindex', '-1'));
      return clone;
    });

  const before = cloneSet();
  const after = cloneSet();
  track.prepend(...before);
  track.append(...after);

  // Clones are built after the page was mounted, so their own modules — the
  // lazy-loaded clips — have to be started by hand.
  [...before, ...after].forEach((clone) => mountModules(clone));

  const slides = [...track.querySelectorAll<HTMLElement>('[data-carousel-slide]')];

  const centerFor = (slide: HTMLElement) =>
    slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Set while a programmatic scroll is travelling. A smooth scroll emits no
   * events between frames, so without this the settle debounce can fire
   * mid-flight, mistake the halfway position for a resting one, and yank the
   * strip back.
   */
  let pendingIndex: number | null = null;

  const goTo = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const slide = slides[clamped];
    if (!slide) return;

    pendingIndex = clamped;
    track.scrollTo({
      left: centerFor(slide),
      behavior: behavior === 'smooth' && prefersReducedMotion() ? 'auto' : behavior,
    });
  };

  // Which slide is on screen is decided by an observer rather than by reading
  // scroll offsets, so a flung or dragged strip reports the same index the
  // viewer actually sees.
  let currentIndex = count;
  const ratios = new Map<HTMLElement, number>();

  const setCurrent = (index: number) => {
    currentIndex = index;
    const active = index % count;
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        ratios.set(entry.target as HTMLElement, entry.intersectionRatio);
      }

      let best = -1;
      let bestRatio = 0;
      slides.forEach((slide, index) => {
        const ratio = ratios.get(slide) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = index;
        }
      });

      if (best >= 0) setCurrent(best);
    },
    { root: track, threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  slides.forEach((slide) => observer.observe(slide));

  /** Index of the slide nearest the track's centre, measured rather than observed. */
  const nearestIndex = () => {
    const target = track.scrollLeft;
    let best = currentIndex;
    let bestDistance = Infinity;
    slides.forEach((slide, index) => {
      const distance = Math.abs(centerFor(slide) - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  // Once motion stops, hop back to the middle set so there is always a full set
  // of slides available in both directions. The jump is invisible because the
  // slide it lands on is an identical copy of the one already on screen.
  const settle = () => {
    if (dragging) return;

    if (pendingIndex !== null) {
      // Still on its way to a slide chosen by a drag or a dot; leave it alone.
      if (Math.abs(track.scrollLeft - centerFor(slides[pendingIndex])) > 2) return;
      pendingIndex = null;
    }

    const resting = nearestIndex();
    const canonical = count + (resting % count);
    if (canonical !== resting) {
      track.scrollLeft += centerFor(slides[canonical]) - centerFor(slides[resting]);
    }
    setCurrent(canonical);
  };

  let settleTimer = 0;

  // scrollend is the precise signal, but it does not fire in every situation
  // (a background tab can stall a smooth scroll), so a debounce backs it up.
  const queueSettle = () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, SETTLE_MS);
  };

  const onScrollEnd = () => {
    window.clearTimeout(settleTimer);
    // Motion has genuinely stopped, so whatever was in flight has arrived.
    pendingIndex = null;
    settle();
  };

  track.addEventListener('scrollend', onScrollEnd);
  track.addEventListener('scroll', queueSettle, { passive: true });

  // Dragging with a mouse advances exactly one slide rather than scrolling
  // freely, so the strip always comes to rest on a slide.
  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragStartIndex = count;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    dragging = true;
    dragMoved = false;
    // Grabbing the strip overrides whatever scroll was in flight.
    pendingIndex = null;
    dragStartX = event.clientX;
    dragStartScroll = track.scrollLeft;
    dragStartIndex = currentIndex;
    try {
      track.setPointerCapture(event.pointerId);
    } catch {
      // No active pointer to capture; the drag still works without it.
    }
    // Snapping fights a manual scrollLeft, so it is off for the duration.
    track.style.scrollSnapType = 'none';
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    const dx = event.clientX - dragStartX;
    if (Math.abs(dx) > 4) dragMoved = true;
    track.scrollLeft = dragStartScroll - dx;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (track.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track.style.scrollSnapType = '';

    const dx = event.clientX - dragStartX;
    const step = Math.abs(dx) >= DRAG_THRESHOLD ? (dx < 0 ? 1 : -1) : 0;
    goTo(dragStartIndex + step);
  };

  // A drag that ends over the panel must not also follow its link.
  const onClickCapture = (event: MouseEvent) => {
    if (!dragMoved) return;
    event.preventDefault();
    event.stopPropagation();
    dragMoved = false;
  };

  const onDragStart = (event: Event) => event.preventDefault();

  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', onPointerUp);
  track.addEventListener('pointercancel', onPointerUp);
  track.addEventListener('click', onClickCapture, true);
  track.addEventListener('dragstart', onDragStart);

  const dotHandlers = dots.map((dot, index) => {
    const handler = () => goTo(count + index);
    dot.addEventListener('click', handler);
    return () => dot.removeEventListener('click', handler);
  });

  const onResize = () => goTo(currentIndex, 'auto');
  window.addEventListener('resize', onResize);

  // Start on the middle set. Layout has to have settled for offsetLeft to be
  // meaningful, hence the frame delay.
  requestAnimationFrame(() => {
    setCurrent(count);
    goTo(count, 'auto');
  });

  return () => {
    observer.disconnect();
    window.clearTimeout(settleTimer);
    track.removeEventListener('scrollend', onScrollEnd);
    track.removeEventListener('scroll', queueSettle);
    track.removeEventListener('pointerdown', onPointerDown);
    track.removeEventListener('pointermove', onPointerMove);
    track.removeEventListener('pointerup', onPointerUp);
    track.removeEventListener('pointercancel', onPointerUp);
    track.removeEventListener('click', onClickCapture, true);
    track.removeEventListener('dragstart', onDragStart);
    window.removeEventListener('resize', onResize);
    dotHandlers.forEach((off) => off());
    track.querySelectorAll<HTMLElement>('[data-carousel-clone]').forEach((clone) => {
      unmountModules(clone);
      clone.remove();
    });
  };
});
