import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../../site.config.mjs';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft && !p.data.noindex)
    .sort((a, b) => +new Date(b.data.pubDate) - +new Date(a.data.pubDate))
    .slice(0, 30);

  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.data.h1 ?? p.data.title)}</title>
      <link>${SITE.url}/blog/${p.id}</link>
      <guid isPermaLink="true">${SITE.url}/blog/${p.id}</guid>
      <description>${esc(p.data.description)}</description>
      <pubDate>${new Date(p.data.pubDate).toUTCString()}</pubDate>
    </item>`
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} — Blog</title>
    <link>${SITE.url}/blog</link>
    <description>${esc(SITE.defaultDescription)}</description>
    <language>en-us</language>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
