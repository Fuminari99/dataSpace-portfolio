// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output: no adapter, so the build is a plain html/css/media tree.
// That satisfies the module's "zip your website files" submission and deploys
// unchanged to either Cloudflare Pages or Vercel.
export default defineConfig({
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
