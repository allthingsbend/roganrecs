/**
 * The short list: products with a documented Rogan/JRE connection, a direct
 * Amazon product link, and an honest one-line take. Used by the homepage.
 *
 * `connection` must stay sourced. If the guide page can't back it up, it
 * doesn't belong here.
 */
const tag = 'rogan-recs-20';
const dp = (asin) => `https://www.amazon.com/dp/${asin}?tag=${tag}`;

export const TOP_PICKS = [
  {
    name: 'Shure SM7B',
    kind: 'Podcast mic',
    connection: 'The mic in front of Rogan',
    take: 'The one piece of the JRE studio actually worth copying. Pair it with an interface that has real gain.',
    href: dp('B0002E4Z8M'),
    guide: '/podcast-guests/joe-rogan-podcast-equipment',
  },
  {
    name: 'Pure Encapsulations Macular Support',
    kind: 'Eye supplement',
    connection: 'He says he buys it himself',
    take: 'A rare case where the Rogan link is specific, recent and not a sponsorship.',
    href: dp('B00NC2TZBS'),
    guide: '/supplements',
  },
  {
    name: 'Creatine monohydrate',
    kind: 'Supplement',
    connection: 'Switched from gummies to powder',
    take: 'The cheapest, best-studied thing on this list. Plain monohydrate, third-party tested, nothing fancier.',
    href: `https://www.amazon.com/s?k=third+party+tested+creatine+monohydrate&tag=${tag}`,
    guide: '/supplements/joe-rogan-creatine',
  },
  {
    name: 'Black Rifle Just Black',
    kind: 'Coffee',
    connection: 'Named as the studio coffee, JRE #2170',
    take: 'Our pick for a first bag. Black Rifle is the verified brand; the roast is our call.',
    href: dp('B07DT75MS5'),
    guide: '/joe-rogan-coffee',
  },
  {
    name: 'Neuro Gum',
    kind: 'Caffeine gum',
    connection: 'Caffeinated gum he has talked up',
    take: 'Caffeine plus L-theanine in your pocket. Pricier per milligram than coffee, and that is the trade.',
    href: dp('B071RZ2SY6'),
    guide: '/supplements/neuro-gum-joe-rogan',
  },
  {
    name: 'HÅG Capisco 8106',
    kind: 'Desk chair',
    connection: 'The saddle chair at the JRE desk',
    take: 'Expensive and unusual-looking. Sit in one before you spend this much if you can.',
    href: dp('B00OHUB0CG'),
    guide: '/podcast-guests/joe-rogan-chair-jre-podcast',
  },
];
