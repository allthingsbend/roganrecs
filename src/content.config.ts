import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The schema is the SEO guardrail: a page cannot ship without a title, an h1
 * and a description. That is the failure mode that got you here — 44 of 45
 * Squarespace pages had a blank meta description.
 *
 * The LENGTH limits here are deliberately loose. Since you're building on
 * Cloudflare rather than locally, a build that fails is a site that doesn't
 * deploy, and you'd have no way to debug it. So length is a *warning* from
 * `npm run seo:check`, not a hard build failure. Only genuinely missing
 * fields stop the build.
 */
const seoFields = {
  /** <title> — kept byte-identical to the Squarespace version on migrated pages. */
  title: z.string().min(1).max(200),
  /** <meta name="description"> — aim for 120-158 chars; seo:check warns outside that. */
  description: z.string().min(20).max(400),
  /** <h1> — may differ from the title tag. That is fine and often better. */
  h1: z.string().min(1),
  /** Overrides the auto-built canonical. Almost never needed. */
  canonical: z.string().url().optional(),
  /** Adds noindex,follow. */
  noindex: z.boolean().default(false),
  /** Social share image, absolute path from /public. */
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  category: z
    .enum(['supplements', 'gear', 'wellness', 'outdoors', 'comedy', 'podcast', 'food', 'site'])
    .default('site'),
  /** Shown as "Updated <date>" — an honest, visible freshness signal. */
  updated: z.coerce.date().optional(),
  /** Flipped to true by the import script once real body content is in. */
  imported: z.boolean().default(false),
  /** Optional FAQ block -> renders visibly AND as FAQPage structured data. */
  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
};

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    ...seoFields,
    order: z.number().default(100),
    hidden: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    ...seoFields,
    pubDate: z.coerce.date(),
    author: z.string().default('Rogan Recs'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages, blog };
