import { visit } from 'unist-util-visit';
import { SITE, AFFILIATE_PROGRAMS } from '../../site.config.mjs';

const siteHost = new URL(SITE.url).hostname.replace(/^www\./, '');

function programFor(host) {
  return AFFILIATE_PROGRAMS.find((p) =>
    p.domains.some((d) => host === d || host.endsWith('.' + d))
  );
}

/**
 * Runs over every markdown file at build time.
 *
 *  - Affiliate link -> rel="sponsored nofollow noopener", target="_blank",
 *                      and the program's tracking param appended IF MISSING.
 *  - Other external -> rel="noopener", target="_blank"
 *  - Internal       -> untouched, so link equity keeps flowing.
 *
 * Existing tracking IDs are never overwritten. A link you already wrote with
 * ?tag=something keeps that exact value.
 */
export function rehypeAffiliateLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;
      if (/^(#|mailto:|tel:)/.test(href)) return;

      let url;
      try {
        url = new URL(href, SITE.url);
      } catch {
        return;
      }

      const host = url.hostname.replace(/^www\./, '');
      if (host === siteHost) return;

      node.properties.target = '_blank';

      const program = programFor(host);
      if (!program) {
        node.properties.rel = 'noopener';
        return;
      }

      node.properties.rel = 'sponsored nofollow noopener';
      node.properties['data-affiliate'] = program.name;

      // Backfill the tracking param only when it isn't already there.
      if (program.id && !url.searchParams.has(program.param)) {
        url.searchParams.set(program.param, program.id);
        node.properties.href = url.href;
      }
    });
  };
}
