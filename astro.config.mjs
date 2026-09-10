// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Static output: no adapter, so the build is a plain html/css/media tree.
// That satisfies the module's "zip your website files" submission and deploys
// unchanged to either Cloudflare Pages or Vercel.
export default defineConfig({
  // Absolute URLs for canonical links and share cards are built off this, so
  // it has to be the address the site is actually served from. Change it here
  // and every <head> follows.
  site: 'https://fractalvariant.netlify.app',
  output: 'static',
  // Writes sitemap-index.xml at build time from the routes that exist, so a
  // new page is listed by being a page rather than by being remembered.
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
