/**
 * Title tokens.
 *
 * `{year}` in a title is replaced with the year of the page's `updated` date,
 * so a title only claims a year the page was actually reviewed in. Bump
 * `updated` when you review the page and the title follows on the next build.
 */
export function resolveTitle(title, updated) {
  if (!title || !title.includes('{year}')) return title;
  const d = updated ? new Date(updated) : new Date();
  return title.replaceAll('{year}', String(d.getUTCFullYear()));
}

/**
 * Related-guide picker.
 *
 * The old version took the first three items in a category, so the same three
 * URLs got every related link on the site. This scores candidates (siblings in
 * the same section first, then same category) and rotates the order per page
 * so link equity spreads across the whole category.
 */
export function pickRelated(currentId, items, count = 3) {
  const parent = currentId.includes('/') ? currentId.split('/')[0] : currentId;
  const seed = [...currentId].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

  const scored = items
    .filter((item) => item.id !== currentId)
    .map((item, i) => {
      let score = 0;
      if (item.id.startsWith(`${parent}/`) || item.id === parent) score += 2;
      if (item.sameCategory) score += 1;
      // Stable per-page shuffle for ties.
      const jitter = ((seed + i * 2654435761) >>> 0) % 1000;
      return { item, score, jitter };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.jitter - b.jitter);

  return scored.slice(0, count).map((x) => x.item);
}
