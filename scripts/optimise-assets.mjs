/**
 * Every still in `public/` gets a WebP alongside it.
 *
 * Astro's own image pipeline (`astro:assets`) only touches files imported from
 * `src/`; anything under `public/` is copied to the build untouched, and it has
 * nothing for video at all. The stills here have to live beside the clips —
 * they are `poster` attributes, and the paths are derived from the clip's own
 * name — so they stay in `public/` and are converted here instead. Run it
 * whenever the footage changes: `npm run optimise`.
 */
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/assets';
/** Big enough for the largest place any still is shown, at 2x. */
const MAX_WIDTH = 1280;
const QUALITY = 62;
/** The experiment list shows its thumbnails at 144px; a 2x copy is plenty. */
const THUMB_WIDTH = 288;

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

  const target = file.replace(/\.(jpe?g|png)$/i, '.webp');
  const source = sharp(file);
  const { width } = await source.metadata();

  await source
    .resize({ width: Math.min(width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(target);

  // A second, small copy for the places that show a still at thumbnail size.
  await sharp(file)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(file.replace(/\.(jpe?g|png)$/i, '-288.webp'));

  const [before, after] = await Promise.all([stat(file), stat(target)]);
  saved += before.size - after.size;
  count += 1;
  console.log(
    `${target.padEnd(48)} ${Math.round(before.size / 1024)}KB → ${Math.round(after.size / 1024)}KB`
  );
}

console.log(`\n${count} stills, ${Math.round(saved / 1024)}KB saved.`);
