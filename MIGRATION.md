# Migration runbook — the no-terminal version

You can't run commands right now, so this is written around that. Everything
below happens either in a browser or by dragging files. GitHub and Cloudflare run
the commands for you.

---

## Step 1 — Look at the design first

Open **`design-preview.html`** by double-clicking it. It's a plain HTML file — no
install, no server. It shows the homepage, an article page and the blog index
using the site's real CSS.

If you want the type, colours or spacing changed, say so before we go further.
It's one file (`src/styles/global.css`) with all the tokens at the top, so
changes are cheap now and annoying later.

---

## Step 2 — Put the folder on GitHub

Two ways, both browser-only:

**Drag and drop (easiest):** github.com → New repository → name it `roganrecs`
→ Create → on the empty repo page click **"uploading an existing file"** → drag
the unzipped folder's *contents* in → Commit.

One catch: GitHub's web uploader silently skips files starting with a dot. After
the upload, use **Add file → Create new file** and paste in `.gitignore` and
`.github/workflows/import-content.yml` by hand. Typing
`.github/workflows/import-content.yml` into the filename box creates the folders
automatically. Both files are in the zip to copy from.

**GitHub Desktop:** install it, File → Add local repository, point at the folder,
Publish. It handles dotfiles correctly and is worth the five minutes.

---

## Step 3 — Import your content, from a button on github.com

Your body copy is still on Squarespace. It gets pulled across by a GitHub Action,
so you don't need a machine:

1. Repo → **Actions** tab
2. **"Import content from Squarespace"** in the left sidebar
3. **Run workflow** → **Run workflow**
4. Wait about three minutes

It fetches all 44 URLs, converts them to markdown, downloads every image into
`public/images/`, and commits it all back to the repo. Then it builds the site to
prove nothing broke.

**Do this before you touch DNS.** Once roganrecs.com points at Cloudflare, the
Squarespace source is gone, images included.

If a page fails, the Action log names it. Re-run the workflow with the `only`
field set to that single URL.

---

## Step 4 — Deploy on Cloudflare Pages

Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build:check` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `20` |

The checked build generates the site, fails on blocking SEO errors, and reports
affiliate-tag status before Cloudflare publishes the deployment.

You'll get a `roganrecs.pages.dev` URL. Click through it properly: all five nav
items, a few blog posts, `/sitemap.xml`, `/rss.xml`, `/robots.txt`, and a made-up
URL to confirm the 404 renders.

---

## Step 5 — Cut DNS over

Cloudflare Pages → your project → Custom domains → add `roganrecs.com` and
`www.roganrecs.com`. Cloudflare walks you through the DNS.

Don't cancel Squarespace until the live site has been serving from Cloudflare for
a full day.

---

## Step 6 — The day after

1. **Google Search Console** — resubmit `https://roganrecs.com/sitemap.xml`. Same
   URL as before, on purpose, so you keep the history.
2. **Re-crawl with Screaming Frog** and diff against the crawl you already have.
   Looking for: any 404, any page that lost its title, any redirect chain.
3. **Watch Coverage for two weeks.** A few days of wobble is normal on any
   migration. A sustained drop after 14 days is not.
4. **Bing Webmaster Tools** — resubmit there too, takes two minutes.
5. **Analytics** — Squarespace Analytics data does not come with you. Export
   anything you care about before cancelling. Cloudflare Web Analytics is free,
   cookieless, and needs no consent banner.

---

## Two things only you can fill in

**Your affiliate tracking IDs.** Open `site.config.mjs`, find
`AFFILIATE_PROGRAMS`. Every `id` is currently an empty string. Fill in the
programs you're actually in — your Amazon store ID at minimum.

The rule the build follows: a link that **already has** a tracking parameter
keeps it exactly as written. A link **missing** one gets yours added. So your
existing tagged links survive the import untouched, and anything that lost its
tag along the way gets it back.

The default social image and structured-data logo are already included in
`public/images/`.

---

## Known items

| Item | What's going on |
|---|---|
| `/homepage` | Squarespace kept a duplicate homepage at priority 1.0 in your sitemap, competing with `/`. Redirected to `/`. |
| `/cart` | Was noindex with 16 words on it. Redirected to `/`. |
| `/donation` | In your sitemap but linked from nowhere. Stubbed with `hidden: true`. Import and link it, or delete the file and add a redirect. |
| `/blog?offset=...` | Squarespace pagination. No static equivalent; `robots.txt` disallows the pattern. |
| `/podcast-guests` | Had no `<h1>` at all. Now has one. |
| Squarespace filler | "Whatever it is, the way you tell your story online can make all the difference" appears on ~20 images in your sitemap. Search and delete it after the import. |
