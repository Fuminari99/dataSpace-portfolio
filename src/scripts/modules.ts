/**
 * Barba swaps only the container, so `<script>` tags inside a page never run
 * again after the first load. Components declare behaviour with
 * `data-module="name"` instead, and it is mounted here on every page enter and
 * torn down on every page leave.
 *
 * Teardown is scoped to a root because persistent chrome outside the container
 * (the header) is mounted once and must survive navigation.
 */

type Cleanup = () => void;
type Mount = (el: HTMLElement) => Cleanup | void;

const registry = new Map<string, Mount>();
const mounted: { el: HTMLElement; cleanup: Cleanup }[] = [];

export function registerModule(name: string, mount: Mount) {
  registry.set(name, mount);
}

export function mountModules(root: ParentNode = document) {
  const scope = root instanceof Element && root.hasAttribute('data-module') ? [root] : [];
  const elements = [...scope, ...root.querySelectorAll<HTMLElement>('[data-module]')];

  for (const el of elements as HTMLElement[]) {
    if (mounted.some((entry) => entry.el === el)) continue;

    for (const name of el.dataset.module!.split(/\s+/).filter(Boolean)) {
      const cleanup = registry.get(name)?.(el);
      if (cleanup) mounted.push({ el, cleanup });
    }
  }
}

export function unmountModules(root?: ParentNode) {
  for (let i = mounted.length - 1; i >= 0; i -= 1) {
    const entry = mounted[i];
    if (root && root instanceof Element && !root.contains(entry.el)) continue;
    entry.cleanup();
    mounted.splice(i, 1);
  }
}
