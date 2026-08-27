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
const DELAY_MS = 1200;      // pause between pages — be polite, avoid tarpitting
const TIMEOUT_MS = 20000;   // hard ceiling on any single request
const RETRIES = 3;          // attempts per request
const BACKOFF_MS = 2000;    // grows on each retry
const IMAGE_WIDTH = '1500w';

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

/**
 * Node's fetch has NO default timeout. If the server accepts the connection and
 * then goes quiet — which Squarespace does once it decides you're a bot — the
 * script waits forever. Every network call here is bounded and retried.
 */
async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  return fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RoganRecsMigration/1.0)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(ms),
  });
}

async function fetchText(url) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) {
        const backoff = BACKOFF_MS * attempt;
        console.log(`    retry ${attempt}/${RETRIES - 1} in ${backoff}ms (${err.message})`);
        await sleep(backoff);
      }
    }
  }
  throw new Error(`${lastErr?.message ?? 'failed'} for ${url}`);
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
    // Squarespace 7.1 sometimes returns a long-looking but completely empty
    // layout div for Fluid Engine pages. Validate rendered text, not markup
    // length, so those pages fall through to the server-rendered HTML below.
    const jsonText =
      typeof html === 'string'
        ? cheerio.load(html).text().replace(/\s+/g, ' ').trim()
        : '';
    if (jsonText.length > 40) {
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
  // Squarespace uses different wrappers depending on page type — index pages,
  // collection pages and plain pages all differ — so try several in order and
  // keep whichever yields the most text.
  const html = await fetchText(`${ORIGIN}${urlPath}`);
  const $ = cheerio.load(html);
  $(
    'header, footer, nav, script, style, noscript, svg, form, ' +
      '.sqs-announcement-bar, .Header, .Footer, #footer-sections, ' +
      '.sqs-block-form, .eventlist-meta, .BlogItem-pagination, ' +
      '.sqs-cookie-banner-v2, #preFooter, .Mobile, .Mobile-bar'
  ).remove();

  const candidates = [
    'main#page',
    '[data-content-field="main-content"]',
    'main',
    '#content',
    'article',
    '.Index',
    '.Main-content',
    '.sqs-layout',
  ];

  let best = null;
  let bestLen = 0;
  for (const sel of candidates) {
    const el = $(sel).first();
    if (!el.length) continue;
    const len = el.text().replace(/\s+/g, ' ').trim().length;
    if (len > bestLen) {
      bestLen = len;
      best = el.html();
    }
  }

  if (!best || bestLen < 40) throw new Error('no main content found on page');
  return { html: best, source: 'scrape', publishOn: null, assetUrl: null };
}

/* ----------------------------------------------------------------- images */

function cleanImageUrl(src) {
  try {
    const u = new URL(src, ORIGIN);
    // Ask the CDN for a large rendition, not the tiny lazy-load placeholder.
    u.searchParams.set('format', IMAGE_WIDTH);
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

  let res;
  try {
    res = await fetchWithTimeout(url, TIMEOUT_MS);
  } catch (err) {
    console.log(`    image timed out, skipping: ${safe}`);
    return null;
  }
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  stats.images += 1;
  return rel;
}

function imageAltFromPath(local, slugDir) {
  const file = path.basename(local, path.extname(local));
  const genericProductImage = /^[a-z0-9]{10,}\._sl\d+_$/i.test(file);
  const source = genericProductImage ? `${slugDir} product` : file;
  const replacements = new Map([
    ['jre', 'Joe Rogan Experience'],
    ['rogan', 'Joe Rogan'],
    ['tx', 'Texas'],
    ['bjj', 'Brazilian jiu-jitsu'],
    ['pemf', 'PEMF'],
    ['h2tab', 'H2Tab'],
    ['pic', 'portrait'],
    ['plugne', 'plunge'],
    ['mothershp', 'Mothership'],
  ]);

  const words = source
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => replacements.get(word.toLowerCase()) ?? word);
  const alt = words.join(' ').replace(/\s+/g, ' ').trim();
  return alt ? alt[0].toUpperCase() + alt.slice(1) : 'Article image';
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
    const alt = ($img.attr('alt') || '').trim() || imageAltFromPath(local, slugDir);
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
      } else {
        // Remove attribution added by AI-assisted source research. It is not
        // the publisher's campaign parameter and should not ship on the site.
        if (u.searchParams.get('utm_source') === 'chatgpt.com') {
          u.searchParams.delete('utm_source');
          $a.attr('href', u.href);
        }
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

function removeLeadingH1(md) {
  const lines = md.split('\n');
  const firstH1 = lines.findIndex((line) => /^#\s+/.test(line));

  // ArticleLayout already renders the frontmatter h1. Fluid Engine pages often
  // repeat that same heading inside the first few content blocks.
  if (firstH1 >= 0 && firstH1 <= 5) lines.splice(firstH1, 1);
  return lines.join('\n').replace(/^\n+/, '');
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
  const md = removeLeadingH1(tidyMarkdown(turndown.turndown(cleaned)));

  if (md.length < 60) throw new Error(`suspiciously short body (${md.length} chars)`);

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

let i = 0;
for (const t of targets) {
  i += 1;
  const label = `[${String(i).padStart(2, '0')}/${targets.length}] ${t.path}`;
  console.log(label);
  try {
    await importOne(t);
    console.log(`    ok`);
  } catch (err) {
    stats.failed.push(`${t.path} — ${err.message}`);
    console.log(`    FAILED: ${err.message}`);
  }
  await sleep(DELAY_MS);
}

console.log('');
console.log(`Imported : ${stats.ok.length}`);
console.log(`Skipped  : ${stats.skipped.length} (already imported — use --force to redo)`);
console.log(`Images   : ${stats.images}`);
console.log(`Failed   : ${stats.failed.length}`);
if (stats.failed.length) {
  console.log('\nFailures — import these by hand or re-run just that URL:');
  for (const f of stats.failed) console.log('  ' + f);
}
// Report anything still holding the placeholder, so nothing goes unnoticed.
const stillStubs = [];
for (const t of [...manifest.pages, ...manifest.posts]) {
  try {
    const raw = await fs.readFile(path.join(ROOT, t.file), 'utf8');
    if (raw.includes('Content not imported yet')) stillStubs.push(t.path);
  } catch {
    /* ignore */
  }
}

if (stillStubs.length) {
  console.log(`\nSTILL EMPTY (${stillStubs.length}) — these pages have no body content:`);
  for (const s of stillStubs) console.log('  ' + s);
} else {
  console.log('\nEvery page has body content.');
}

console.log('\nNow read through the imported files. Squarespace markup is messy and');
console.log('the conversion is never perfect — check headings, lists and image alt text.');
