// @ts-check
import { defineConfig } from 'astro/config';
import remarkWikiLinks from './src/lib/remark-wiki-links.mjs';

// https://astro.build/config
export default defineConfig({
  // PROJECT site on GitHub Pages: served at https://guonuotw.github.io/Infinite-Horror
  // If you switch to a ROOT user site (the guonuotw.github.io repo), remove `base`
  // here AND the `{ base: ... }` argument passed to the wiki-links plugin below.
  site: 'https://guonuotw.github.io',
  base: '/Infinite-Horror',
  markdown: {
    // Must match `base` above so {{wiki links}} resolve in production.
    remarkPlugins: [[remarkWikiLinks, { base: '/Infinite-Horror' }]],
  },
});
