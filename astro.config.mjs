import { defineConfig } from 'astro/config';
import { SITE } from './site.config.mjs';
import { rehypeAffiliateLinks } from './src/lib/rehype-affiliate-links.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,

  // IMPORTANT: this pair reproduces your current Squarespace URLs exactly.
  // /contact  (not /contact/). Do not change these after launch — it would
  // create a second URL for every page on the site.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },

  markdown: {
    rehypePlugins: [rehypeAffiliateLinks],
    shikiConfig: { theme: 'github-light' },
  },

  // We generate /sitemap.xml ourselves (src/pages/sitemap.xml.ts) instead of
  // using @astrojs/sitemap, so the sitemap URL stays identical to the one
  // Google Search Console already has on file.
});
