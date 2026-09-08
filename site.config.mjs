/**
 * Single source of truth for site-wide values.
 * Change things here, not scattered across components.
 */
export const SITE = {
  url: 'https://roganrecs.com',
  name: 'Rogan Recs',
  titleSuffix: ' — Rogan Recs',
  defaultDescription:
    'Rogan Recs is a fan-curated guide to the supplements, gear, books and coffee discussed on the Joe Rogan Experience podcast.',
  defaultOgImage: '/images/og-default.jpg',
  locale: 'en_US',
  lang: 'en-US',
  themeColor: '#16130F',
  twitterHandle: '',
  email: 'hello@roganrecs.com',
};

export const NAV = [
  { label: 'Products', href: '/joe-rogan-products' },
  { label: 'Supplements', href: '/supplements' },
  { label: 'Podcast Guests', href: '/podcast-guests' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = [
  { label: 'What Joe Rogan Uses', href: '/joe-rogan-products' },
  { label: 'Joe Rogan Experience Podcast', href: '/podcast-guests' },
  { label: 'Rogan Supplements', href: '/supplements' },
  { label: 'Coffee', href: '/joe-rogan-coffee' },
  { label: 'Books', href: '/joe-rogan-books' },
  { label: 'Sitemap', href: '/sitemap-html' },
];

export const AFFILIATE_PROGRAMS = [
  {
    name: 'Amazon Associates',
    domains: ['amazon.com', 'amzn.to', 'amazon.co.uk', 'amazon.ca'],
    param: 'tag',
    id: 'rogan-recs-20',
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

export const AFFILIATE_DOMAINS = AFFILIATE_PROGRAMS.flatMap((p) => p.domains);

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
