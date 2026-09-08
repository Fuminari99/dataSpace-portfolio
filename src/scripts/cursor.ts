import { registerModule } from './modules';
import { initGsap } from './gsap';

/** How closely the square chases the pointer. Lower is looser. */
const FOLLOW_S = 0.18;

/**
 * The pointer is the square. One outlined square follows it across the site,
 * drawn in difference blend so it reads against paper and footage alike, with
 * the system cursor taken away underneath it.
 *
 * The hero has a square of its own — the one taking colour readings — so this
 * one steps aside while the pointer is over it rather than doubling up.
 *
 * Nothing here is mounted where there is no pointer to follow, and the system
 * cursor is only hidden once the square is actually on screen: a reader who
 * loses the script keeps the pointer they came with.
 */
registerModule('cursor', (root) => {
  if (!window.matchMedia('(hover: hover)').matches) return;

  const gsap = initGsap();

  const square = document.createElement('div');
  square.className = 'cursor';
  square.setAttribute('aria-hidden', 'true');
  document.body.append(square);
  document.documentElement.classList.add('has-cursor');

  const toX = gsap.quickTo(square, 'x', { duration: FOLLOW_S, ease: 'power3.out' });
  const toY = gsap.quickTo(square, 'y', { duration: FOLLOW_S, ease: 'power3.out' });

  let placed = false;

  const onMove = (event: PointerEvent) => {
    // The hero carries its own square over the footage; two of them chasing the
    // same pointer is one too many.
    const inHero = Boolean((event.target as HTMLElement).closest?.('.hero'));
    square.classList.toggle('is-hidden', inHero);

    if (!placed) {
      placed = true;
      gsap.set(square, { x: event.clientX, y: event.clientY });
      gsap.to(square, { opacity: 1, duration: 0.2 });
      return;
    }

    toX(event.clientX);
    toY(event.clientY);
  };

  const onLeave = () => gsap.to(square, { opacity: 0, duration: 0.2 });
  const onEnter = () => {
    if (placed) gsap.to(square, { opacity: 1, duration: 0.2 });
  };

  root.addEventListener('pointermove', onMove);
  document.addEventListener('pointerleave', onLeave);
  document.addEventListener('pointerenter', onEnter);

  return () => {
    root.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('pointerenter', onEnter);
    document.documentElement.classList.remove('has-cursor');
    gsap.killTweensOf(square);
    square.remove();
  };
});
