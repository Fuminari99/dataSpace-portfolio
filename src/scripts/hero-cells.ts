import { registerModule } from './modules';
import { initGsap } from './gsap';

/**
 * How far a square wanders from where it was drawn, in either direction. A
 * smaller panel can say so with `data-drift`, so its square stays inside it.
 */
const DRIFT_PX = 44;
const DRIFT_MIN_S = 9;
const DRIFT_MAX_S = 16;
/**
 * The squares jump rather than glide: each leg of the drift is cut into this
 * many steps, so a square holds a position, moves, and holds again — the way an
 * instrument reports a reading rather than sweeping between two.
 */
const DRIFT_STEPS = 5;

/**
 * The footage is read back through a canvas this wide — a thumbnail, not the
 * frame. Averaging a square's colour needs a handful of pixels from inside it,
 * and reading a full-size frame every tick would cost far more than the answer
 * is worth.
 */
const SAMPLE_W = 96;
/** Readings a second. Slow enough to be cheap, quick enough to look live. */
const SAMPLE_HZ = 12;
/** How closely the square chases the pointer. Lower is looser. */
const CURSOR_S = 0.25;

/**
 * The squares over the hero footage are samplers left running: each one wanders
 * slowly across the frame on its own cycle and reports the average colour of
 * the clip inside it.
 *
 * The reading is the cheap part. One `drawImage` of a 96px-wide thumbnail and
 * one `getImageData` per tick serve all eight squares, eight times a second,
 * and both stop entirely when the hero is off screen or the tab is in the
 * background. The drift only ever tweens transforms, and the glass in the hero
 * sits on the seams, which never move.
 */
registerModule('hero-cells', (root) => {
  const cursor = root.querySelector<HTMLElement>('[data-hero-cursor]');
  const cells = [...root.querySelectorAll<HTMLElement>('[data-hero-cell]')].filter(
    (cell) => cell !== cursor
  );
  if (cells.length === 0 && !cursor) return;

  const gsap = initGsap();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // A panel can set its own reach, and set it per axis when the space it has to
  // wander over is not square.
  const range = Number(root.dataset.drift) || DRIFT_PX;
  const rangeX = Number(root.dataset.driftX) || range;
  const rangeY = Number(root.dataset.driftY) || range;
  const driftX = () => gsap.utils.random(-rangeX, rangeX, 1);
  const driftY = () => gsap.utils.random(-rangeY, rangeY, 1);

  // Without motion the squares sit where they were drawn. They still take their
  // readings: that is the content, not the animation.
  const tweens = reduceMotion.matches
    ? []
    : cells.map((cell) =>
        gsap.to(cell, {
          keyframes: {
            x: [driftX(), driftX(), driftX(), 0],
            y: [driftY(), driftY(), driftY(), 0],
            easeEach: `steps(${DRIFT_STEPS})`,
          },
          duration: gsap.utils.random(DRIFT_MIN_S, DRIFT_MAX_S),
          repeat: -1,
          delay: gsap.utils.random(0, 4),
        })
      );

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  // Every square reads its own area — the one under the pointer included — and
  // fills itself with what it finds. Only some of them print the figure as
  // well: stacked squares would stack their readouts on top of each other.
  const readings = [...cells, ...(cursor ? [cursor] : [])].map((cell) => ({
    cell,
    // The figure the square is travelling over can carry the readout instead,
    // for a panel too small to print it inside.
    output:
      cell.querySelector<HTMLElement>('[data-hero-sample]') ??
      root.querySelector<HTMLElement>('[data-hero-sample]'),
  }));

  const clips = [...root.querySelectorAll<HTMLVideoElement>('[data-hero-clip]')];

  /**
   * hero-cycle marks the clip on screen by taking `aria-hidden` off it. Until
   * the first one has decoded a frame there is nothing to read, so a clip that
   * is ready is taken over the one that is showing rather than reporting black.
   */
  const activeClip = () => {
    const showing = clips.find((clip) => !clip.hasAttribute('aria-hidden'));
    if (showing && showing.readyState >= 2) return showing;
    return clips.find((clip) => clip.readyState >= 2) ?? showing;
  };

  /**
   * A clip that has not decoded a frame yet — and one whose autoplay was
   * refused outright — leaves its poster on screen, so that is what the squares
   * should be reading. The posters are already in the page's cache; this only
   * gives the canvas something it can draw.
   */
  const posters = new Map<string, HTMLImageElement>();

  const posterFor = (clip: HTMLVideoElement) => {
    const src = clip.poster;
    if (!src) return null;

    let image = posters.get(src);
    if (!image) {
      image = new Image();
      image.src = src;
      posters.set(src, image);
    }
    return image.complete && image.naturalWidth > 0 ? image : null;
  };

  /** Whatever is actually on screen: the decoded clip, or its poster. */
  const source = (): { element: CanvasImageSource; width: number; height: number } | null => {
    const clip = activeClip();
    if (!clip) return null;

    if (clip.readyState >= 2 && clip.videoWidth) {
      return { element: clip, width: clip.videoWidth, height: clip.videoHeight };
    }

    const poster = posterFor(clip);
    return poster
      ? { element: poster, width: poster.naturalWidth, height: poster.naturalHeight }
      : null;
  };

  const sample = () => {
    const frameSource = source();
    // Nothing decoded and no poster yet: the squares keep the last reading they
    // took rather than reporting black.
    if (!context || !frameSource) return;

    const frame = root.getBoundingClientRect();
    if (frame.width === 0 || frame.height === 0) return;

    const width = SAMPLE_W;
    const height = Math.max(1, Math.round((SAMPLE_W * frame.height) / frame.width));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // The clips are laid over the hero with object-fit: cover, so the thumbnail
    // has to be cropped the same way or the squares would report the colour of
    // somewhere else in the frame.
    const scale = Math.max(width / frameSource.width, height / frameSource.height);
    const drawWidth = frameSource.width * scale;
    const drawHeight = frameSource.height * scale;
    context.drawImage(
      frameSource.element,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );

    const { data } = context.getImageData(0, 0, width, height);

    for (const { cell, output } of readings) {
      const box = cell.getBoundingClientRect();
      const x0 = Math.max(0, Math.floor(((box.left - frame.left) / frame.width) * width));
      const y0 = Math.max(0, Math.floor(((box.top - frame.top) / frame.height) * height));
      const x1 = Math.min(width, Math.ceil(((box.right - frame.left) / frame.width) * width));
      const y1 = Math.min(height, Math.ceil(((box.bottom - frame.top) / frame.height) * height));
      if (x1 <= x0 || y1 <= y0) continue;

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const i = (y * width + x) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
      }

      const average = (value: number) => Math.round(value / count);
      const [red, green, blue] = [average(r), average(g), average(b)];

      cell.style.backgroundColor = `rgb(${red} ${green} ${blue})`;
      if (output) {
        const pad = (value: number) => String(value).padStart(3, '0');
        output.textContent = `${pad(red)} ${pad(green)} ${pad(blue)}`;
      }
    }
  };

  /**
   * The pointer square is placed with transforms off the hero's own top left,
   * and eased rather than pinned to the cursor — it is an instrument being
   * carried across the frame, not a crosshair.
   */
  const pointer = (() => {
    if (!cursor || !window.matchMedia('(hover: hover)').matches) return null;

    const toX = gsap.quickTo(cursor, 'x', { duration: CURSOR_S, ease: 'power3.out' });
    const toY = gsap.quickTo(cursor, 'y', { duration: CURSOR_S, ease: 'power3.out' });

    const onMove = (event: PointerEvent) => {
      const frame = root.getBoundingClientRect();
      toX(event.clientX - frame.left);
      toY(event.clientY - frame.top);
    };

    const onEnter = (event: PointerEvent) => {
      const frame = root.getBoundingClientRect();
      // Placed before it is shown, so it does not fly in from the corner.
      gsap.set(cursor, { x: event.clientX - frame.left, y: event.clientY - frame.top });
      gsap.to(cursor, { opacity: 1, duration: 0.2 });
    };

    const onLeave = () => gsap.to(cursor, { opacity: 0, duration: 0.2 });

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);

    return () => {
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      gsap.set(cursor, { clearProps: 'transform,opacity' });
    };
  })();

  let timer = 0;

  const start = () => {
    if (timer) return;
    timer = window.setInterval(sample, 1000 / SAMPLE_HZ);
    sample();
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
  };

  // Nothing is read while the hero is scrolled past, and nothing while the tab
  // is in the background — a canvas read in a hidden tab is pure waste.
  const onVisibility = () => (document.hidden ? stop() : observer.observe(root));

  const observer = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
    { threshold: 0 }
  );
  observer.observe(root);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    pointer?.();
    stop();
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    for (const tween of tweens) tween.kill();
    gsap.set(cells, { clearProps: 'transform' });
    for (const { cell } of readings) cell.style.removeProperty('background-color');
  };
});
