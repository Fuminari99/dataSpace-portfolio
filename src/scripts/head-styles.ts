/**
 * Astro scopes styles per component and inlines the small page-specific bundles
 * into that page's own `<head>`. Barba swaps only the container, so a page
 * reached by navigation never receives them: arriving at home from anywhere
 * else leaves the carousel with no styles at all, and Ex01's collage the same.
 *
 * Everything in the incoming head that this document does not already have is
 * copied across before the page is revealed. Linked sheets are waited on so
 * nothing is shown half-styled; inline blocks apply as soon as they are added.
 * Copies accumulate deliberately — a style needed once may be needed again on
 * the way back, and matching on href and on text keeps them from doubling up.
 */
export async function syncHeadStyles(html: string) {
  if (!html) return;

  const incoming = new DOMParser().parseFromString(html, 'text/html');

  const hrefs = new Set(
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((el) => el.href)
  );
  const blocks = new Set([...document.querySelectorAll('style')].map((el) => el.textContent ?? ''));

  const loading: Promise<void>[] = [];

  for (const link of incoming.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]')) {
    const copy = link.cloneNode() as HTMLLinkElement;
    if (hrefs.has(copy.href)) continue;
    hrefs.add(copy.href);

    loading.push(
      new Promise<void>((resolve) => {
        // A sheet that fails to load must not hold the transition open.
        copy.addEventListener('load', () => resolve(), { once: true });
        copy.addEventListener('error', () => resolve(), { once: true });
      })
    );
    document.head.append(copy);
  }

  for (const style of incoming.querySelectorAll('head style')) {
    const text = style.textContent ?? '';
    if (!text || blocks.has(text)) continue;
    blocks.add(text);
    document.head.append(style.cloneNode(true));
  }

  await Promise.all(loading);
}
