/**
 * Single source of truth for site-wide values.
 * Change things here, not scattered across components.
 */
export const SITE = {
  // No trailing slash. Used for canonicals, OG tags, sitemap, RSS.
  url: 'https://roganrecs.com',
  name: 'Rogan Recs',
  // Appended to page titles that don't already contain it.
  titleSuffix: ' — Rogan Recs',
  defaultDescription:
    'Rogan Recs is a fan-curated guide to the supplements, gear, books and coffee discussed on the Joe Rogan Experience podcast.',
  defaultOgImage: '/images/og-default.jpg',
  locale: 'en_US',
  lang: 'en-US',
  themeColor: '#16130F',
  // Optional — leave empty strings if you don't have them.
  twitterHandle: '',
  email: 'hello@roganrecs.com',
};

export const NAV = [
  { label: 'Supplements', href: '/supplements' },
  { label: 'Podcast Guests', href: '/podcast-guests' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = [
  { label: 'Joe Rogan Experience Podcast', href: '/podcast-guests' },
  { label: 'Rogan Supplements', href: '/supplements' },
  { label: 'Coffee', href: '/joe-rogan-coffee' },
  { label: 'Books', href: '/joe-rogan-books' },
  { label: 'Sitemap', href: '/sitemap-html' },
];

/**
 * AFFILIATE PROGRAMS
 * ------------------------------------------------------------------
 * Fill in `id` for each program you're actually in. At build time, every
 * outbound link to a matching domain gets:
 *
 *   1. rel="sponsored nofollow noopener" and target="_blank"
 *   2. your tracking parameter appended — but ONLY if the link doesn't
 *      already have one.
 *
 * That second rule matters for the migration: any link in your existing
 * Squarespace copy that already carries your tag keeps it untouched. The
 * config only backfills links that are missing it.
 *
 * Leave `id` as an empty string for programs you're not in. Those links
 * still get the correct rel attributes, they just don't get tagged.
 */
export const AFFILIATE_PROGRAMS = [
  {
    name: 'Amazon Associates',
    domains: ['amazon.com', 'amzn.to', 'amazon.co.uk', 'amazon.ca'],
    param: 'tag',
    id: 'rogan-recs-20', // read off your live Squarespace links
  },
  {
    name: 'ShareASale',
    domains: ['shareasale.com'],
    param: 'afftrack',
    id: '',
  },
  {
    name: 'Impact',
    domains: ['impact.com', 'sjv.io', 'pxf.io', 'ojrq.net'],
    param: 'irclickid',
    id: '',
  },
  {
    name: 'Skimlinks',
    domains: ['go.skimresources.com', 'redirectingat.com'],
    param: 'id',
    id: '',
  },
  // Direct/brand programs. Most use ?ref= or ?utm_source=.
  { name: 'Onnit', domains: ['onnit.com'], param: 'rfsn', id: '' },
  { name: 'Origin USA', domains: ['originusa.com'], param: 'ref', id: '' },
  { name: 'Black Rifle Coffee', domains: ['blackriflecoffee.com'], param: 'ref', id: '' },
  { name: 'Kill Cliff', domains: ['killcliff.com'], param: 'ref', id: '' },
  { name: 'Neuro Gum', domains: ['getneurogum.com', 'neurogum.com'], param: 'ref', id: '' },
  { name: 'Iron Neck', domains: ['iron-neck.com'], param: 'ref', id: '' },
  { name: 'Plunge', domains: ['plunge.com'], param: 'ref', id: '' },
  { name: 'Sunlighten', domains: ['sunlighten.com'], param: 'ref', id: '' },
  { name: 'Sorinex', domains: ['sorinex.com'], param: 'ref', id: '' },
];

/** Derived — every domain across every program. Used for rel attributes. */
export const AFFILIATE_DOMAINS = AFFILIATE_PROGRAMS.flatMap((p) => p.domains);

/**
 * Categories used for the eyebrow tag on articles.
 * Keep this list short — it maps to how readers browse, not how you file things.
 */
export const CATEGORIES = {
  supplements: 'Supplements',
  gear: 'Gear',
  wellness: 'Wellness',
  outdoors: 'Outdoors',
  comedy: 'Comedy',
  podcast: 'Podcast',
  food: 'Food & Drink',
  site: 'Site',
};
