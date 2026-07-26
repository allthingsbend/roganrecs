#!/usr/bin/env node
/**
 * Pulls the live body content off Squarespace and writes it into the markdown
 * files in src/content/, downloading every image on the way.
 *
 *   npm run import              # everything
 *   npm run import:dry          # fetch + report, write nothing
 *   node scripts/import-squarespace.mjs --only=/blog/joe-rogan-elk
 *   node scripts/import-squarespace.mjs --force   # re-import already-imported files
 *
 * Run this WHILE the Squarespace site is still live. Once you cut DNS over to
 * Cloudflare, the source disappears.
 *
 * Frontmatter you have already written (titles, descriptions, categories) is
 * preserved. Only the body, `image`, and `imported` are touched.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const DELAY_MS = 500;

const manifest = JSON.parse(await fs.readFile(path.join(__dirname, 'urls.json'), 'utf8'));
const ORIGIN = manifest.origin;
const ORIGIN_HOST = new URL(ORIGIN).hostname;

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

// Squarespace wraps a lot of divs; keep figures readable.
turndown.addRule('figure', {
  filter: 'figure',
  replacement: (content) => `\n\n${content.trim()}\n\n`,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stats = { ok: [], skipped: [], failed: [], images: 0 };

/* ------------------------------------------------------------------ fetch */

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RoganRecsMigration/1.0 (+site owner migration)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

/**
 * Squarespace exposes a JSON representation of every URL. It gives clean
 * body HTML without the nav/footer chrome, which is far better than scraping.
 */
async function getBodyHtml(urlPath) {
  const jsonUrl = `${ORIGIN}${urlPath === '/' ? '/' : urlPath}?format=json-pretty`;
  try {
    const raw = await fetchText(jsonUrl);
    const data = JSON.parse(raw);
    const html =
      data?.item?.body ||
      data?.mainContent ||
      data?.collection?.mainContent ||
      data?.collection?.description ||
      null;
    if (html && html.trim().length > 40) {
      return {
        html,
        source: 'json',
        publishOn: data?.item?.publishOn ?? data?.collection?.updatedOn ?? null,
        assetUrl: data?.item?.assetUrl ?? null,
      };
    }
  } catch {
    /* fall through to scraping */
  }

  // Fallback: scrape the rendered page and strip the chrome.
  const html = await fetchText(`${ORIGIN}${urlPath}`);
  const $ = cheerio.load(html);
  $('header, footer, nav, script, style, noscript, .sqs-announcement-bar, .Header, .Footer, #footer-sections, .sqs-block-form, .eventlist-meta').remove();
  const main = $('main#page').html() || $('[data-content-field="main-content"]').html() || $('main').html();
  if (!main) throw new Error('no main content found');
  return { html: main, source: 'scrape', publishOn: null, assetUrl: null };
}

/* ----------------------------------------------------------------- images */

function cleanImageUrl(src) {
  try {
    const u = new URL(src, ORIGIN);
    // Ask the CDN for a large rendition, not the tiny lazy-load placeholder.
    u.searchParams.set('format', '2500w');
    return u.href;
  } catch {
    return null;
  }
}

async function downloadImage(src, slugDir) {
  const url = cleanImageUrl(src);
  if (!url) return null;
  const bare = new URL(url).pathname.split('/').pop() || 'image';
  const safe = decodeURIComponent(bare)
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-');
  const rel = `/images/${slugDir}/${safe}`;
  const abs = path.join(ROOT, 'public', rel);

  try {
    await fs.access(abs);
    return rel; // already downloaded
  } catch {
    /* not there yet */
  }

  if (DRY) return rel;

  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  stats.images += 1;
  return rel;
}

/* --------------------------------------------------------------- rewrites */

async function transform(html, slugDir) {
  const $ = cheerio.load(html, null, false);

  // Squarespace's own navigation leftovers
  $('.BlogItem-pagination, .BlogItem-meta, .blog-meta, .item-pagination').remove();

  // Images: download locally, drop the lazy-load noise, keep/repair alt text.
  const imgs = $('img').toArray();
  for (const el of imgs) {
    const $img = $(el);
    const src = $img.attr('data-src') || $img.attr('src');
    if (!src) {
      $img.remove();
      continue;
    }
    const local = await downloadImage(src, slugDir);
    if (!local) {
      $img.remove();
      continue;
    }
    const alt = ($img.attr('alt') || '').trim();
    $img.replaceWith(`<img src="${local}" alt="${alt.replace(/"/g, '')}" loading="lazy" />`);
  }

  // Internal links -> relative, so nothing points back at the old host.
  $('a[href]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    try {
      const u = new URL(href, ORIGIN);
      if (u.hostname === ORIGIN_HOST) {
        $a.attr('href', u.pathname.replace(/\/$/, '') || '/');
      }
    } catch {
      /* relative already */
    }
  });

  return $.html();
}

function tidyMarkdown(md) {
  return md
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\[\]\(.*?\)\s*$/gm, '') // empty links
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/* ------------------------------------------------------------------- main */

async function importOne({ path: urlPath, file }) {
  const abs = path.join(ROOT, file);
  const raw = await fs.readFile(abs, 'utf8');
  const parsed = matter(raw);

  if (parsed.data.imported && !FORCE) {
    stats.skipped.push(urlPath);
    return;
  }

  const { html, source, publishOn } = await getBodyHtml(urlPath);
  const slugDir = (urlPath === '/' ? 'home' : urlPath.replace(/^\//, '')).replace(/\//g, '-');
  const cleaned = await transform(html, slugDir);
  const md = tidyMarkdown(turndown.turndown(cleaned));

  if (md.length < 120) throw new Error(`suspiciously short body (${md.length} chars)`);

  const firstImage = md.match(/!\[[^\]]*\]\((\/images\/[^)]+)\)/)?.[1];

  const data = { ...parsed.data, imported: true };
  if (firstImage && !data.image) data.image = firstImage;
  if (publishOn && !parsed.data.pubDateLocked && data.pubDate) {
    data.pubDate = new Date(publishOn).toISOString().slice(0, 10);
  }

  const out = matter.stringify('\n' + md + '\n', data);

  if (!DRY) await fs.writeFile(abs, out, 'utf8');
  stats.ok.push(`${urlPath}  (${source}, ${md.split(/\s+/).length} words)`);
}

const targets = [...manifest.pages, ...manifest.posts].filter(
  (t) => !ONLY || t.path === ONLY
);

if (!targets.length) {
  console.error(`No target matched --only=${ONLY}`);
  process.exit(1);
}

console.log(`${DRY ? '[DRY RUN] ' : ''}Importing ${targets.length} URLs from ${ORIGIN}\n`);

for (const t of targets) {
  try {
    await importOne(t);
    process.stdout.write('.');
  } catch (err) {
    stats.failed.push(`${t.path} — ${err.message}`);
    process.stdout.write('x');
  }
  await sleep(DELAY_MS);
}

console.log('\n');
console.log(`Imported : ${stats.ok.length}`);
console.log(`Skipped  : ${stats.skipped.length} (already imported — use --force to redo)`);
console.log(`Images   : ${stats.images}`);
console.log(`Failed   : ${stats.failed.length}`);
if (stats.failed.length) {
  console.log('\nFailures — import these by hand or re-run just that URL:');
  for (const f of stats.failed) console.log('  ' + f);
}
console.log('\nNow read through the imported files. Squarespace markup is messy and');
console.log('the conversion is never perfect — check headings, lists and image alt text.');
