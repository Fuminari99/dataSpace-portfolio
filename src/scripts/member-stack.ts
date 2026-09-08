import { registerModule } from './modules';
import { initGsap, ScrollTrigger } from './gsap';
import { getLenis } from './smooth-scroll';

/** The portrait dissolves; it is the slowest part of the change. */
const PORTRAIT_S = 0.7;
/** The paragraph being left behind scrambles as it fades out. */
const BIO_OUT_S = 0.35;
const BIO_IN_S = 0.35;
const SCRAMBLE_OUT_S = 0.4;
const SCRAMBLE_IN_S = 0.7;
const LINE_STAGGER_S = 0.06;
const CHARS = 'upperCase';
/** Screens of scroll spent handing the frame from one person to the next. */
const STEP_SCREENS = 1;

/**
 * The About page's three profiles, read one at a time. The group is pinned in
 * the middle of the screen; scrolling past it hands the frame to the next
 * person, and the page carries on once the last one has been reached.
 *
 * The three parts of a profile change differently, because they are doing
 * different things. The list of names does not go anywhere — it only shifts
 * which name is at full strength, since it is the one fixed thing to read the
 * change against. The portrait dissolves into the next. The paragraphs resolve
 * out of a scramble, the same treatment the headings and nav labels get.
 *
 * Left alone the markup is three profiles in a row down the page, so this is
 * only ever an enhancement — it is not mounted at all when the reader has asked
 * for less motion.
 */
registerModule('member-stack', (root) => {
  const viewport = root.querySelector<HTMLElement>('[data-stack-viewport]');
  const panels = [...root.querySelectorAll<HTMLElement>('[data-stack-panel]')];
  if (!viewport || panels.length < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  const gsap = initGsap();
  const steps = panels.length - 1;

  const portraits = panels.map((panel) => panel.querySelector<HTMLElement>('[data-stack-portrait]'));
  const bios = panels.map((panel) => panel.querySelector<HTMLElement>('[data-stack-bio]'));
  const lines = panels.map((panel) => [
    ...panel.querySelectorAll<HTMLElement>('[data-stack-line]'),
  ]);

  /**
   * Every word gets a span of its own, and a word is only ever scrambled into
   * characters of its own length — so the paragraph keeps its spaces, its line
   * breaks and its height all the way through. Scrambling the paragraph whole
   * would replace the spaces too, leaving one unbreakable run that rewraps on
   * every frame and shoves everything under it around.
   */
  const splitWords = (line: HTMLElement) => {
    const words: HTMLElement[] = [];
    const parts = (line.textContent ?? '').split(/(\s+)/);
    line.textContent = '';

    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        line.append(part);
        continue;
      }
      const span = document.createElement('span');
      span.textContent = part;
      line.append(span);
      words.push(span);
    }

    return words;
  };

  // Taken before anything is scrambled, so a tween always has the real text to
  // resolve to however many times the reader goes back and forth.
  const texts = lines.map((group) => group.map((line) => line.textContent ?? ''));
  const words = lines.map((group) => group.map(splitWords));
  const wordTexts = words.map((group) => group.map((set) => set.map((w) => w.textContent ?? '')));

  // Only the first panel's list stays on screen once they are stacked, so that
  // is the one driven.
  const tabs = [...panels[0].querySelectorAll<HTMLElement>('[data-stack-tab]')];

  root.classList.add('is-stacked');
  gsap.set([...portraits.slice(1), ...bios.slice(1)], { autoAlpha: 0 });

  let current = 0;

  /**
   * The arrows step along the run one person at a time, for a reader who would
   * rather press than scroll. They move the scroll rather than the panels, so
   * the pinned position and what is on screen cannot come apart.
   */
  const prev = root.querySelector<HTMLButtonElement>('[data-stack-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-stack-next]');

  const syncArrows = () => {
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === steps;
  };

  const scramble = (panel: number, duration: number, delay: number) => {
    for (const [line, set] of words[panel].entries()) {
      for (const [index, word] of set.entries()) {
        gsap.killTweensOf(word);
        gsap.to(word, {
          duration,
          ease: 'none',
          delay: delay + line * LINE_STAGGER_S,
          scrambleText: { text: wordTexts[panel][line][index], chars: CHARS, speed: 0.8 },
        });
      }
    }
  };

  const show = (next: number) => {
    if (next === current || !panels[next]) return;
    const from = current;
    current = next;

    for (const [index, tab] of tabs.entries()) {
      tab.classList.toggle('is-active', index === next);
      if (index === next) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    }

    syncArrows();

    gsap.to(portraits[from], { autoAlpha: 0, duration: PORTRAIT_S, ease: 'none' });
    gsap.to(portraits[next], { autoAlpha: 1, duration: PORTRAIT_S, ease: 'none' });

    // The paragraph being left scrambles where it stands as it fades out; the
    // one arriving fades up already scrambling, and resolves into itself.
    gsap.to(bios[from], { autoAlpha: 0, duration: BIO_OUT_S });
    scramble(from, SCRAMBLE_OUT_S, 0);

    gsap.to(bios[next], { autoAlpha: 1, duration: BIO_IN_S, delay: BIO_OUT_S });
    scramble(next, SCRAMBLE_IN_S, BIO_OUT_S);
  };

  const trigger = ScrollTrigger.create({
    trigger: viewport,
    start: 'top top',
    end: () => `+=${window.innerHeight * steps * STEP_SCREENS}`,
    pin: true,
    invalidateOnRefresh: true,
    // Each person holds their share of the run rather than dissolving across
    // it: the change happens once, on the way past the threshold.
    onUpdate: (self) => show(Math.round(self.progress * steps)),
  });

  /**
   * The footer links to each of us by name. With the profiles stacked those ids
   * all sit at the same place on the page, so the jump has to be to the point
   * in the pinned run where that person is the one showing.
   */
  const jumpToIndex = (index: number, immediate = true) => {
    if (index < 0 || index > steps) return false;

    const top = trigger.start + ((trigger.end - trigger.start) * index) / steps;

    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top, { immediate, force: true });
    else window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });

    return true;
  };

  const jumpToPanel = (hash: string) => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    const index = panels.findIndex((panel) => panel.dataset.stackId === id);
    if (index <= 0) return false;
    return jumpToIndex(index);
  };

  // Wired once the run has been measured, since pressing one is a jump into it.
  const onPrev = () => jumpToIndex(current - 1, false);
  const onNext = () => jumpToIndex(current + 1, false);
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  syncArrows();

  const onHashChange = () => jumpToPanel(window.location.hash);
  window.addEventListener('hashchange', onHashChange);

  // The names double as jumps between the three, which is what they are for
  // without the script — here they move the pinned run instead of the page.
  const onTabClick = (event: MouseEvent) => {
    const tab = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-stack-tab]');
    if (!tab) return;
    if (jumpToPanel(new URL(tab.href).hash)) event.preventDefault();
  };
  root.addEventListener('click', onTabClick);

  // A link followed from another page arrives with the hash already set, and
  // the pin has to be measured before the jump can be worked out.
  ScrollTrigger.refresh();
  requestAnimationFrame(() => jumpToPanel(window.location.hash));

  return () => {
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    if (prev) prev.disabled = false;
    if (next) next.disabled = false;
    window.removeEventListener('hashchange', onHashChange);
    root.removeEventListener('click', onTabClick);
    trigger.kill();
    root.classList.remove('is-stacked');
    for (const [panel, group] of lines.entries()) {
      for (const [index, line] of group.entries()) {
        for (const word of words[panel][index]) gsap.killTweensOf(word);
        line.textContent = texts[panel][index];
      }
    }
    gsap.set([...portraits, ...bios].filter(Boolean), { clearProps: 'opacity,visibility' });
    for (const [index, tab] of tabs.entries()) tab.classList.toggle('is-active', index === 0);
  };
});
