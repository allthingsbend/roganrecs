import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../../site.config.mjs';

/**
 * Hand-rolled so the sitemap lives at /sitemap.xml — the exact URL Google
 * Search Console already has on file from Squarespace. Using @astrojs/sitemap
 * would have moved it to /sitemap-index.xml and thrown away that history.
 *
 * noindex pages are excluded. A URL in a sitemap that says noindex is a
 * conflicting signal and Search Console flags it.
 */
export const GET: APIRoute = async () => {
  const pages = await getCollection('pages');
  const posts = await getCollection('blog');

  const entries: { loc: string; lastmod?: Date; priority: string }[] = [];

  entries.push({ loc: `${SITE.url}/`, priority: '1.0' });
  entries.push({ loc: `${SITE.url}/blog`, priority: '0.8' });
  entries.push({ loc: `${SITE.url}/sitemap-html`, priority: '0.3' });

  for (const p of pages) {
    if (p.id === 'home' || p.data.noindex) continue;
    entries.push({
      loc: `${SITE.url}/${p.id}`,
      lastmod: p.data.updated,
      priority: p.id.includes('/') ? '0.6' : '0.8',
    });
  }

  for (const p of posts) {
    if (p.data.draft || p.data.noindex) continue;
    entries.push({
      loc: `${SITE.url}/blog/${p.id}`,
      lastmod: p.data.updated ?? p.data.pubDate,
      priority: '0.6',
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url>\n    <loc>${e.loc}</loc>${
        e.lastmod ? `\n    <lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''
      }\n    <priority>${e.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
