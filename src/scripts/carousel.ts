import { mountModules, registerModule, unmountModules } from './modules';
import { initGsap } from './gsap';

/** Pointer travel, in px, before a drag counts as "move one slide". */
const DRAG_THRESHOLD = 40;
/**
 * Travel before a press is treated as a drag at all. A plain click is never
 * perfectly still — a few pixels of hand movement between press and release is
 * normal — so this has to sit above that noise or ordinary clicks on a panel
 * get swallowed as drags and the panel's link never opens.
 */
const DRAG_SLOP = 10;
/** Fallback settle delay for browsers without the scrollend event. */
const SETTLE_MS = 140;
/** The panel title resolves out of a scramble as its slide takes the centre. */
const TITLE_DURATION = 0.5;
const TITLE_CHARS = 'upperCase';

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

  const gsap = initGsap();

  /**
   * Which experiment is showing, rather than which slide: the strip hops
   * between a clone and its original at the same position, and that hop should
   * not read as a change of panel.
   */
  let scrambledActive = -1;

  const scrambleTitle = (index: number) => {
    const title = slides[index]?.querySelector<HTMLElement>('[data-carousel-title]');
    if (!title) return;

    const text = title.dataset.title ?? title.textContent!.trim();
    if (prefersReducedMotion()) {
      title.textContent = text;
      return;
    }

    gsap.killTweensOf(title);
    // Scrambled characters carry no spaces, so the title is one unbreakable
    // word for the length of the tween; it has to be allowed to break or it
    // pushes out of the panel.
    title.style.overflowWrap = 'anywhere';
    // Starting from a single character lets the plugin tween the length too, so
    // the title grows into place rather than arriving at full width.
    title.textContent = 'A';

    gsap.to(title, {
      duration: TITLE_DURATION,
      ease: 'none',
      scrambleText: { text, chars: TITLE_CHARS, speed: 0.6 },
      onComplete: () => title.style.removeProperty('overflow-wrap'),
    });
  };

  const setCurrent = (index: number) => {
    currentIndex = index;
    const active = index % count;
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)));

    if (active !== scrambledActive) {
      scrambledActive = active;
      scrambleTitle(index);
    }
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
    // Deliberately no pointer capture here. Capturing on press retargets the
    // click that follows onto the track, so the panel's own link never sees it
    // and a plain click stops opening the experiment. Capture is taken only
    // once the press has actually turned into a drag, below.
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;

    const dx = event.clientX - dragStartX;
    if (!dragMoved) {
      if (Math.abs(dx) <= DRAG_SLOP) return;
      dragMoved = true;
      try {
        track.setPointerCapture(event.pointerId);
      } catch {
        // No active pointer to capture; the drag still works without it.
      }
      // Snapping fights a manual scrollLeft, so it is off for the duration.
      track.style.scrollSnapType = 'none';
    }

    track.scrollLeft = dragStartScroll - dx;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (track.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track.style.scrollSnapType = '';

    // A press that never became a drag leaves the strip alone: it is a click on
    // the panel, and moving the carousel under it would be wrong.
    if (!dragMoved) return;

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
    track.querySelectorAll<HTMLElement>('[data-carousel-title]').forEach((title) => {
      gsap.killTweensOf(title);
      title.style.removeProperty('overflow-wrap');
      if (title.dataset.title) title.textContent = title.dataset.title;
    });
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
