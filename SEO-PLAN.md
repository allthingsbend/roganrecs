# SEO: what changed, and what's left

## Applied — all 45 pages

**Every title tag rewritten.** The old ones averaged 44 characters with the brand
suffix eating 13 of them, and five had hard-coded years that are now stale. The
new set:

- keyword front-loaded
- 18–54 characters, so none get truncated in results
- no hard-coded years anywhere
- brand suffix dropped where it was consuming the character budget

A few examples of what moved:

| URL | Was | Now |
|---|---|---|
| `/` | Rogan Recs | Rogan Recs: Joe Rogan's Supplements, Gear & Book Picks |
| `/supplements` | Joe Rogan's Guide to Supplements (Updated for 2026) — Rogan Recs | Joe Rogan Supplements: His Full Stack, Explained |
| `/joe-rogan-sauna-guide` | Joe Rogan Sauna Guide in 2025 — Rogan Recs | Joe Rogan's Sauna Routine: Temp, Time & Setup |
| `/podcast-guests/andrew-huberman-supplement-guide` | Andrew Huberman Supplement Guide in 2024 — Rogan Recs | Andrew Huberman's Supplement Stack, Explained |
| `/blog/joe-rogans-influence-on-the-mma-community` | Joe Rogan's Influence on the MMA Community — Rogan Recs | How Joe Rogan Changed MMA Commentary |

**Meta descriptions written for all 45.** You had one, on the Sorinex post. Now
every page has a distinct 130–151 character description. No duplicates.

**H1s separated from title tags.** They were identical on most pages. A title tag
is written for a searcher scanning results; an H1 is written for a reader who has
already landed. Nine pages now have a distinct H1, and `/podcast-guests` has one
at all for the first time.

**Years removed from titles entirely.** Every page renders a visible
"Updated&nbsp;&lt;date&gt;" line under the H1, pulled from the `updated`
frontmatter field, which also feeds `dateModified` in the Article schema. That's
a freshness signal that stays honest without you having to remember to bump five
titles every January.

**Structured data on every page** — Organization, WebSite, BreadcrumbList and
Article, all emitted as JSON-LD from one component. This can't break a build:
it's an inert `<script type="application/ld+json">` block, ignored by browsers.
Worst case Google ignores it. There's no downside, so it stays. FAQPage is
available per-page via a `faq:` array in frontmatter.

**Homepage, About and Contact rewritten from scratch.** The About page in
particular now states editorial process, correction policy, and how the site
makes money. For a site in supplements and health, that's the single highest-value
non-technical page you have — it's what a quality rater looks for.

---

## Left to do, roughly in order of value

### 1. Internal linking is badly lopsided

From your crawl: `/supplements` has 203 inbound internal links, `/podcast-guests`
has 194. Meanwhile the pages that actually convert:

| Page | Inlinks |
|---|---|
| `/podcast-guests/joe-rogan-chair-jre-podcast` | 2 |
| `/podcast-guests/joe-rogan-podcast-equipment` | 2 |
| `/supplements/neuro-gum-joe-rogan` | 2 |
| `/energy-drink-joe-rogan` | 3 |
| `/smelling-salts-jre-podcast` | 3 |

Those five are commercial pages that almost nothing points at. The parent pages
should link down to them in the body copy, not just via breadcrumbs — body links
carry far more weight than navigational ones. This is the cheapest win left and
it needs the imported content in place first.

### 2. Thin pages

| Page | Words |
|---|---|
| `/blog/how-to-get-kill-tony-tickets-...` | 462 |
| `/blog/joe-rogans-influence-on-the-mma-community` | 602 |
| `/blog/joe-rogans-elk-boots` | 609 |
| `/blog/joe-rogan-tour-dates` | 669 |
| `/blog/secret-show-kill-tony-brian-redban` | 731 |

Word count isn't a ranking factor by itself, but these are competitive queries
where the winning pages are far more thorough. The two Kill Tony pages cover
overlapping intent — strong case for merging them into one page and 301-ing the
weaker URL.

`/blog/joe-rogan-tour-dates` has a different problem: an evergreen URL for
information that changes weekly. Either commit to maintaining it or point it at
the official source and stop pretending.

### 3. FAQ blocks

Add a `faq:` array to frontmatter and it renders visibly *and* as FAQPage
structured data. Best candidates, because they all attract question-shaped
queries: supplements, sauna, cold plunge, Kill Tony tickets, methylated vitamins.

Only mark up questions the page genuinely answers. Inventing FAQ markup to farm
rich results is the kind of thing Google acts on.

### 4. A content honesty pass

This matters more for your site than for most, because a lot of your topics are
health claims: peptides, stem cells, hydrogen water, PEMF mats, red light
therapy, SAM-e.

Google treats supplement and health content as YMYL — "your money or your life" —
and holds it to a higher bar. The pages that survive on these topics are the ones
that distinguish clearly between *this was discussed on a podcast*, *this is what
the manufacturer claims*, and *this is what the research actually shows*.

When you go through the imported copy, that's the edit to make. It also happens
to be the honest thing to do, since some of these are things people will put in
their bodies.
