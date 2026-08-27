# START HERE — every step, in order

No terminal needed. Roughly 45 minutes end to end, most of it waiting.

Do these in order. Don't skip to step 5.

---

# Part 1 — Put the files on GitHub

### 1. Unzip the folder

You should end up with a folder called `roganrecs` containing `package.json`,
`src`, `public`, `scripts` and some `.md` files. Everything you upload comes from
*inside* this folder.

### 2. Make a GitHub account and a repository

- Go to **github.com** and sign in (or sign up — it's free).
- Click the **+** in the top right → **New repository**.
- Repository name: `roganrecs`
- Leave it **Public** or set **Private**, either works.
- **Do not** tick "Add a README file." Leave all three checkboxes empty.
- Click **Create repository**.

You'll land on a mostly-empty page with some grey instructions. Ignore all of it.

### 3. Upload the files

- On that page, find the small link that says **"uploading an existing file"** and
  click it.
- Open your `roganrecs` folder, select **everything inside it**, and drag it into
  the browser window.
- Wait for the upload to finish — it'll list about 80 files.
- Scroll down, click **Commit changes**.

### 4. Add the two files GitHub skipped

**This step is not optional and it's the one people get stuck on.** GitHub's
uploader silently ignores any file or folder whose name starts with a dot. Two of
yours do. Nothing tells you this happened.

**File one:**

- On your repo's main page, click **Add file** → **Create new file**.
- In the filename box, type exactly:

  ```
  .github/workflows/import-content.yml
  ```

  As you type each `/`, GitHub turns it into a folder. That's correct.
- Open `roganrecs/.github/workflows/import-content.yml` from your unzipped folder
  in any text editor, copy everything, paste it into the big box on GitHub.
- Click **Commit changes** → **Commit changes** again.

**File two:**

- **Add file** → **Create new file** again.
- Filename: `.gitignore`
- Paste in the contents of `roganrecs/.gitignore`.
- Commit.

### 5. Check it worked

Click the **Actions** tab at the top of your repo. You should see
**"Import content from Squarespace"** listed on the left.

If you don't see it, file one didn't save correctly. Redo step 4.

---

# Part 2 — Pull your content off Squarespace

Right now your new site has all the titles, descriptions and structure but the
body copy of most pages is still sitting on Squarespace. This step moves it
across. GitHub runs it for you.

> **Do this before you change any DNS.** The moment roganrecs.com points at
> Cloudflare, the Squarespace version is gone — text, images, all of it.

### 6. Run the import

- **Actions** tab
- Click **"Import content from Squarespace"** in the left sidebar
- On the right you'll see a grey **Run workflow** button. Click it.
- A small panel drops down with two optional boxes. **Leave both empty/unchecked.**
- Click the green **Run workflow** button inside that panel.

Nothing appears to happen for about five seconds. Refresh the page.

### 7. Watch it run

A new row appears with a yellow spinning dot. Click into it, then click the
**import** job to watch it live. It takes about three minutes.

- **Green tick** — done. It fetched all 44 pages, converted them to markdown,
  downloaded every image, and committed everything back to your repo. Go look at
  the repo; you'll see a new commit called "Import content from Squarespace" and
  `public/images` will now be full of files.
- **Red X** — click into the failed step and read the last few lines. The most
  common cause is a page that timed out. Re-run the whole workflow; it skips
  what's already done.

### 8. Spot-check three pages

In your repo, open `src/content/blog/joe-rogan-kettlebells.md` and a couple of
others. You should see your real article text under the frontmatter block at the
top.

If a file still says "Content not imported yet," that page failed. Re-run the
workflow with `/blog/that-page-slug` typed into the **only** box.

---

# Part 3 — Put it live

### 9. Connect Cloudflare Pages

- **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** tab →
  **Connect to Git**
- Authorise GitHub, pick the `roganrecs` repository, click **Begin setup**
- Fill in:

  | Field | Value |
  |---|---|
  | Framework preset | **Astro** |
  | Build command | `npm run build:check` |
  | Build output directory | `dist` |

- Expand **Environment variables**, click **Add variable**:
  - Variable name: `NODE_VERSION`
  - Value: `20`
- Click **Save and Deploy**

First build takes two to four minutes. You'll get a URL ending in
`.pages.dev`.

### 10. Click around the preview URL

Before you touch DNS, open the `.pages.dev` link and check:

- All five nav links work
- Two or three blog posts load with their images
- `/sitemap.xml` shows a list of URLs
- `/robots.txt` loads
- A made-up URL like `/asdfgh` shows the 404 page, not an error

If something's broken, it's broken now while the real site is still safely on
Squarespace. That's the whole point of checking here.

### 11. Point the domain at it

- In your Cloudflare Pages project → **Custom domains** → **Set up a custom
  domain**
- Enter `roganrecs.com`, follow the DNS instructions it gives you
- Repeat for `www.roganrecs.com`

DNS takes anywhere from a few minutes to a few hours to propagate.

**Leave Squarespace running for at least 24 hours after this.** Once you're
certain the live site is being served by Cloudflare, cancel it.

---

# Part 4 — The day after

### 12. Tell Google

- **search.google.com/search-console** → your property → **Sitemaps**
- Submit `sitemap.xml`

It's the same sitemap URL Squarespace used, deliberately, so you keep the history.

### 13. Re-crawl with Screaming Frog

Crawl roganrecs.com again and compare against the crawl you already have. You're
looking for any 404s, any page missing a title, any redirect chain. Every URL
that worked before should still work.

### 14. Then leave it alone for two weeks

A few days of ranking wobble after any migration is normal. Resist the urge to
change things while you're watching. If there's a sustained drop after fourteen
days, that's when you go back to the crawl comparison.

---

# Two small things to do whenever you get a minute

The social-share image, structured-data logo, and Apple touch icon are included
in the repository under `public/`.

**Check your other affiliate programs.** Your Amazon tag (`rogan-recs-20`) is
already set in `site.config.mjs` — I read it off your live links. If you're in
other programs (Onnit, Origin, Black Rifle, Kill Cliff), open that file on GitHub,
click the pencil icon, and fill in the `id` for each. Every link on the site
picks it up automatically on the next build.

---

# If something goes wrong

**The Cloudflare build failed.** Click into the deployment and read the log. The
last ten lines usually name the file. Paste them to me and I'll fix it.

**A page looks mangled after the import.** Squarespace-to-markdown conversion is
never perfect. Open the file on GitHub, click the pencil icon, fix it, commit.
The site rebuilds automatically in about two minutes.

**You want a wording or design change.** Everything is a plain text file you can
edit directly on github.com with the pencil icon. Every commit triggers a rebuild.
Nothing needs to be installed, ever.
