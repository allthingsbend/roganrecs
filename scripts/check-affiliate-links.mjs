#!/usr/bin/env node
/**
 * Affiliate link audit. Run after a build:
 *
 *   npm run build && npm run links:check
 *
 * Answers the only question that matters: is every outbound Amazon link
 * carrying your tracking tag, and is every paid link marked up the way
 * Google requires?
 *
 * It reports and exits 0 — it never blocks a deploy.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { AFFILIATE_PROGRAMS } from '../site.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function programFor(host) {
  return AFFILIATE_PROGRAMS.find((p) =>
    p.domains.some((d) => host === d || host.endsWith('.' + d))
  );
}

const files = await walk(DIST).catch(() => {
  console.error('No dist/ directory. Run `npm run build` first.');
  process.exit(1);
});

const untagged = [];
const badRel = [];
const tagCounts = new Map();
const programsWithoutIds = new Map();
let affiliateTotal = 0;
let externalTotal = 0;

for (const file of files) {
  const url = '/' + path.relative(DIST, file).replace(/\\/g, '/').replace(/\.html$/, '');
  const $ = cheerio.load(await fs.readFile(file, 'utf8'));

  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href');
    let u;
    try {
      u = new URL(href);
    } catch {
      return;
    }
    const host = u.hostname.replace(/^www\./, '');
    if (host.endsWith('roganrecs.com')) return;

    externalTotal += 1;
    const program = programFor(host);
    if (!program) return;

    affiliateTotal += 1;
    const tag = u.searchParams.get(program.param);

    if (!program.id) {
      programsWithoutIds.set(
        program.name,
        (programsWithoutIds.get(program.name) ?? 0) + 1
      );
    } else if (!tag) {
      untagged.push(`${url}  ->  ${href}`);
    } else {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }

    const rel = $(el).attr('rel') ?? '';
    if (!rel.includes('sponsored') || !rel.includes('nofollow')) {
      badRel.push(`${url}  ->  ${href}  (rel="${rel}")`);
    }
  });
}

console.log(`Scanned ${files.length} pages.`);
console.log(`External links: ${externalTotal}`);
console.log(`Affiliate links: ${affiliateTotal}\n`);

if (tagCounts.size) {
  console.log('Tracking IDs found in the built site:');
  for (const [tag, count] of [...tagCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tag.padEnd(24)} ${count} link${count === 1 ? '' : 's'}`);
  }
  console.log('');
  if (tagCounts.size > 1) {
    console.log('More than one tracking ID is in use. If that is not deliberate,');
    console.log('some links are crediting the wrong account.\n');
  }
}

if (untagged.length) {
  console.log(`UNTAGGED AFFILIATE LINKS (${untagged.length}) — these earn you nothing:`);
  for (const u of untagged.slice(0, 40)) console.log('  ' + u);
  if (untagged.length > 40) console.log(`  ...and ${untagged.length - 40} more`);
  console.log('');
} else if (tagCounts.size) {
  console.log('Every link for a configured affiliate account carries its tracking ID.\n');
}

if (programsWithoutIds.size) {
  console.log('Direct brand links with no affiliate account ID configured:');
  for (const [program, count] of [...programsWithoutIds].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${program.padEnd(24)} ${count} link${count === 1 ? '' : 's'}`);
  }
  console.log('');
}

if (badRel.length) {
  console.log(`MISSING rel="sponsored nofollow" (${badRel.length}):`);
  for (const b of badRel.slice(0, 20)) console.log('  ' + b);
  if (badRel.length > 20) console.log(`  ...and ${badRel.length - 20} more`);
} else if (affiliateTotal) {
  console.log('Every affiliate link is correctly marked sponsored/nofollow.');
}
