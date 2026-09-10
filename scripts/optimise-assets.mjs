/**
 * Turns the masters in `assets-src/` into the WebP the site actually serves.
 *
 * Astro's own image pipeline (`astro:assets`) only touches files imported from
 * `src/`; anything under `public/` is copied to the build untouched, and it has
 * nothing for video at all. So the conversion happens here — and the masters
 * sit outside `public/` so they are not shipped with the build. Run it whenever
 * the footage or the photographs change: `npm run optimise`.
 */
import { mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import sharp from 'sharp';

const ROOT = 'assets-src';
const OUT = 'public/assets';
/** Big enough for the largest place any still is shown, at 2x. */
const MAX_WIDTH = 1280;
const QUALITY = 62;

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

let saved = 0;
let count = 0;

for await (const file of files(ROOT)) {
  if (!['.jpg', '.jpeg', '.png'].includes(extname(file).toLowerCase())) continue;

  const target = join(OUT, relative(ROOT, file)).replace(/\.(jpe?g|png)$/i, '.webp');
  await mkdir(dirname(target), { recursive: true });
  const source = sharp(file);
  const { width } = await source.metadata();

  await source
    .resize({ width: Math.min(width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(target);

  const [before, after] = await Promise.all([stat(file), stat(target)]);
  saved += before.size - after.size;
  count += 1;
  console.log(
    `${target.padEnd(48)} ${Math.round(before.size / 1024)}KB → ${Math.round(after.size / 1024)}KB`
  );
}

console.log(`\n${count} stills, ${Math.round(saved / 1024)}KB saved.`);
