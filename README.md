# roganrecs.com

Astro static site, deployed on Cloudflare Pages. Replaces the Squarespace build.

**Start with [`START-HERE.md`](./START-HERE.md)** — every step from empty GitHub
account to live site, with exact clicks. [`MIGRATION.md`](./MIGRATION.md) is the
shorter reference version. [`SEO-PLAN.md`](./SEO-PLAN.md)
records what was changed and what's left. This file is the reference.

If you do get a terminal:

```bash
npm install
npm run dev          # http://localhost:4321
npm run build
npm run build:check  # build + strict SEO and affiliate audits
```

---

## Where things live

```
site.config.mjs          Domain, brand, nav, affiliate domains. Change things HERE.
astro.config.mjs         URL format (no trailing slash) + the affiliate-link plugin.

src/
  content.config.ts      The schema. A page CANNOT build without a title,
                         an h1, and a 50-200 char description.
  content/pages/*.md     Every non-blog page. Folder = URL path.
  content/blog/*.md      Every blog post -> /blog/<filename>
  components/Seo.astro   All head tags and JSON-LD, in one place.
  components/RecCard.astro   The product recommendation block.
  layouts/               BaseLayout (chrome) + ArticleLayout (schema, crumbs).
  pages/                 Routes. sitemap.xml and rss.xml are generated here.
  styles/global.css      Design tokens at the top.

public/
  _redirects             Cloudflare 301s. Add a line whenever a URL changes.
  _headers               Security headers + cache rules.
  robots.txt
  images/                Downloaded from Squarespace by the import script.

scripts/
  import-squarespace.mjs One-time content migration.
  check-seo.mjs          Post-build audit.
  check-affiliate-links.mjs  Affiliate ID and rel-attribute audit.
  urls.json              URL manifest, used by both.
```

## Adding a page

Drop a markdown file in `src/content/pages/`. The filename is the URL.

```markdown
---
title: "Joe Rogan Whoop Strap — Rogan Recs"
h1: "Joe Rogan's Whoop Strap"
description: "What Rogan has said about wearing a Whoop, what the strap tracks, what the subscription costs, and whether it beats an Oura ring."
category: gear
order: 100
updated: 2026-07-25
imported: true
---

Body copy in markdown.
```

`src/content/pages/supplements/creatine.md` → `/supplements/creatine`, and it
picks up a breadcrumb from the supplements page automatically.

Blog posts go in `src/content/blog/` and additionally need `pubDate`.

Valid `category` values: `supplements`, `gear`, `wellness`, `outdoors`, `comedy`,
`podcast`, `food`, `site`.

## Adding an FAQ block

Anywhere in frontmatter. It renders as a visible section *and* as FAQPage
structured data:

```yaml
faq:
  - q: "How often does Joe Rogan use the sauna?"
    a: "He has described sessions most days of the week, usually after training."
```

Only use it for questions genuinely answered on the page. Marking up an FAQ the
page doesn't actually answer is the kind of thing Google acts on.

## Affiliate links

Just write a normal markdown link. If the domain matches an entry in
`AFFILIATE_PROGRAMS` in `site.config.mjs`, the build automatically:

1. adds `rel="sponsored nofollow noopener"` and `target="_blank"`
2. appends your tracking parameter — **only if the link doesn't already have one**

That second rule is what protects your existing tags. A link you wrote as
`?tag=roganrecs-20` keeps that exact value forever. A link with no tag gets the
`id` from the config. So you can't accidentally lose a tracking ID, and you can't
accidentally overwrite one either.

Set your `id` values in `site.config.mjs` before launch. An empty `id` means the
rel attributes still get applied, the link just doesn't get tagged.

For a prominent product callout, use the `RecCard` component from an `.astro`
page — it always carries the right `rel` and always looks the same.

## Changing a URL

Two steps, always:

1. Rename the file.
2. Add a line to `public/_redirects`:
   ```
   /old-path    /new-path    301
   ```

`npm run seo:check` reports it if a URL from `scripts/urls.json` exists in
neither the build nor `_redirects`. Run it with `--strict` to make that a build
failure once you have a machine to debug on.

## Things worth adding later

- Cloudflare Web Analytics (free, cookieless, no consent banner needed)
- Self-hosted fonts via `@fontsource` if you want to drop the Google Fonts request

## Things deliberately NOT included

- **No JavaScript framework.** Nothing on this site needs client-side JS, so
  there isn't any. Pages ship as HTML and CSS.
- **No Tailwind.** One stylesheet with design tokens at the top. Fewer moving
  parts, nothing to break on an upgrade.
- **No `@astrojs/sitemap`.** It would have moved your sitemap to
  `/sitemap-index.xml`. `src/pages/sitemap.xml.ts` keeps the URL Google already
  knows.
