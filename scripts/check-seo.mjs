#!/usr/bin/env node
/**
 * Post-build SEO audit. Run it after `npm run build`:
 *
 *   npm run build && npm run seo:check
 *
 * By default it REPORTS and exits 0, so it can never block a Cloudflare
 * deploy. Once you're settled and want it to gate deploys, add --strict:
 *
 *   npm run build && node scripts/check-seo.mjs --strict
 */

const STRICT = process.argv.includes('--strict');

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://roganrecs.com';

const errors = [];
const warnings = [];

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function urlFor(file) {
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\.html$/, '').replace(/\/index$/, '');
}

const files = await walk(DIST).catch(() => {
  console.error('No dist/ directory. Run `npm run build` first.');
  process.exit(1);
});

const titles = new Map();
const descs = new Map();
const builtUrls = new Set();
const internalLinks = [];

for (const file of files) {
  const url = urlFor(file);
  builtUrls.add(url);
  const $ = cheerio.load(await fs.readFile(file, 'utf8'));

  const title = $('title').text().trim();
  const desc = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() ?? '';
  const robots = $('meta[name="robots"]').attr('content') ?? '';
  const h1s = $('h1');

  if (!title) errors.push(`${url}: no <title>`);
  if (!desc) errors.push(`${url}: no meta description`);
  if (!canonical) errors.push(`${url}: no canonical`);
  if (h1s.length === 0) errors.push(`${url}: no <h1>`);
  if (h1s.length > 1) errors.push(`${url}: ${h1s.length} <h1> tags (should be exactly 1)`);

  if (canonical && !canonical.startsWith('http')) {
    errors.push(`${url}: canonical is not absolute (${canonical})`);
  }
  const expected = `${ORIGIN}${url === '/' ? '' : url}`;
  if (canonical && canonical !== expected && !robots.includes('noindex')) {
    warnings.push(`${url}: canonical points elsewhere (${canonical})`);
  }

  if (title.length > 60) warnings.push(`${url}: title is ${title.length} chars, likely truncated in SERPs`);
  if (desc && (desc.length < 110 || desc.length > 160)) {
    warnings.push(`${url}: description is ${desc.length} chars (aim for 120-158)`);
  }

  if (!robots.includes('noindex')) {
    if (title) titles.set(title, [...(titles.get(title) ?? []), url]);
    if (desc) descs.set(desc, [...(descs.get(desc) ?? []), url]);
  }

  // Body content still holding the migration placeholder
  if ($('body').text().includes('Content not imported yet')) {
    warnings.push(`${url}: still a stub — body content not imported`);
  }

  // Images without alt text
  $('article img').each((_, el) => {
    if (!($(el).attr('alt') ?? '').trim()) {
      warnings.push(`${url}: image without alt text (${$(el).attr('src')})`);
    }
  });

  // Outbound links to the old host would leak authority off-site
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.startsWith(ORIGIN)) {
      warnings.push(`${url}: absolute self-link, should be relative (${href})`);
    }
    if (href.startsWith('/') && !href.startsWith('//')) {
      internalLinks.push({ from: url, to: href.split('#')[0].split('?')[0] });
    }
  });
}

for (const [title, urls] of titles) {
  if (urls.length > 1) errors.push(`Duplicate title "${title}" on: ${urls.join(', ')}`);
}
for (const [desc, urls] of descs) {
  if (urls.length > 1) errors.push(`Duplicate description on: ${urls.join(', ')}`);
}

// Broken internal links
const assetExts = /\.(xml|txt|json|jpg|jpeg|png|webp|svg|gif|pdf|ico|css|js)$/i;
for (const { from, to } of internalLinks) {
  if (!to || to === '/') continue;
  if (assetExts.test(to)) continue;
  const clean = to.replace(/\/$/, '');
  if (!builtUrls.has(clean)) {
    errors.push(`Broken internal link: ${from} -> ${to}`);
  }
}

// URL parity: every URL that existed on Squarespace must still exist or redirect
const manifest = JSON.parse(await fs.readFile(path.join(__dirname, 'urls.json'), 'utf8'));
const redirects = await fs.readFile(path.join(ROOT, 'public/_redirects'), 'utf8').catch(() => '');
for (const t of [...manifest.pages, ...manifest.posts]) {
  const p = t.path === '/' ? '/' : t.path;
  if (!builtUrls.has(p) && !redirects.includes(p + ' ')) {
    errors.push(`Old URL missing from build and from _redirects: ${p}`);
  }
}

console.log(`Checked ${files.length} pages.\n`);

if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log('  - ' + w);
  console.log('');
}

if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) console.log('  - ' + e);
  console.log(
    STRICT
      ? '\nStrict mode: failing the build. Fix these before deploying.'
      : '\nThese are worth fixing, but the build is not blocked. Add --strict to gate deploys on them.'
  );
  if (STRICT) process.exit(1);
  process.exit(0);
}

console.log('No blocking SEO errors. Good to deploy.');
