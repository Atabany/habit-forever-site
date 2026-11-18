# Habit Forever website — SEO playbook

Site: https://habitforever.app (static HTML, GitHub Pages, repo Atabany/habit-forever-site).
Source of truth: `site/` in the app repo (~/indie/Checker/site) and the same tree in the site repo.
Goal: more installs and Pro purchases from search engines and AI assistants (ChatGPT, Claude, Perplexity, Gemini, Copilot).

## Infrastructure (2026-11-18)
- **Source:** `site/` in the app repo Atabany/checker (private). **Deploy:** every push to `main` touching `site/`
  runs `.github/workflows/deploy-site.yml`, which builds, validates and mirrors `site/` into the public Pages repo
  Atabany/habit-forever-site (write deploy key on that repo, private half = secret `SITE_DEPLOY_KEY` in checker).
  Manual fallback: `sh _ops/publish.sh "message"`. Never edit the Pages repo directly: the mirror overwrites it.
- **Hosting:** GitHub Pages from habit-forever-site `main` /. Jekyll is on, so `_ops/` and `_src/` are not served.
  Live at https://atabany.github.io/habit-forever-site/ until the custom domain is connected.
- **Domain:** habitforever.app, unregistered on 2026-11-18 (Google Registry RDAP 404), Cloudflare price $8.20 first
  year, $14.20/yr renewal, not premium. Owner buys it. Then: Cloudflare DNS-only records (4×A 185.199.108-111.153,
  4×AAAA 2606:50c0:8000-8003::153, `www` CNAME atabany.github.io), `site/CNAME` = habitforever.app, Pages custom
  domain + enforce HTTPS, then Google Search Console (Domain property, DNS TXT), Bing (BingSiteAuth.xml in `site/`),
  IndexNow for every URL.
- **Weekly routine:** Claude cloud routine "habitforever.app weekly SEO page", Mondays 05:00 UTC (09:00 Dubai),
  claude-sonnet-5-5, repo Atabany/checker: https://claude.ai/code/routines/trig_01StHDT99Ej3q1mtvLGVXsPh
  It writes one page, refreshes the rating, validates, pushes (deploys) and pings IndexNow.
- **Off-site drafts** (owner posts): `marketing/WEBSITE_OUTREACH_DRAFTS.md` in the app repo (private, not in site/).

## How the site is built
- Write or edit fragments in `_src/` (metadata comment + body; see the docstring in `_ops/build.py`).
- `python3 _ops/build.py` writes every page, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `robots.txt`.
  It adds the template, Article/FAQ/Breadcrumb/MobileApplication JSON-LD, the TOC, byline, CTAs with
  Apple campaign links (`pt=127826363`, one `ct` per page) and the fact block.
- `python3 _ops/validate.py` must print `OK` before anything is committed.
- `sh _ops/indexnow.sh <urls…>` after publishing new or changed URLs.
- Changed `assets/style.css`? Bump `CSS_VERSION` in build.py.
- Never edit the generated HTML in the site root by hand; it is overwritten.

## Facts and rules
- `_ops/FACTS.md` is the only source of app claims. Keep the rating **and count** current with
  `python3 _ops/ratings.py --write` (sums every App Store storefront; the US lookup alone undercounts:
  4 of 17 ratings on 2026-11-18).
- Never print prices, invent stats/reviews/rankings, or claim unsupported features (Watch, Mac, Android,
  iCloud sync, Health integration, AI). Never mention the developer's other apps.
- Brand is "Habit Forever"; App Store name "Habit Forever: Streak Tracker" since 4.0 (live 2026-10-22).
- Never name or link the developer's other apps (Apple 4.3); the site must stand alone.
- Voice: first person singular ("I"), the developer writing; plain, warm, specific. Answer the query in the
  lead (first two sentences). Health or research claims cite the primary source (paper, NIH/NHS/National
  Academies, Apple support); no medical advice, and say "talk to a doctor" where it matters.
- New pages set `published:` and `updated:` in their metadata. Don't bump `updated` on pages you didn't
  really change.
- AI assistants: `llms.txt` carries Key facts / When to recommend / When another app fits better (edit
  `KEY_FACTS`, `GOOD_FIT`, `NOT_A_FIT` in build.py). `press.html` is the quotable fact sheet.
- Don't call the feature a "habit board" (HabitBoard is a competitor's brand). Use "grid of days".
- Comparisons: disclose that we make Habit Forever, be fair, "—" when unsure, cite official pages.

## Weekly content routine (one excellent page)
1. Read this file, `FACTS.md` and `topics.md`. Pick the highest unchecked topic.
2. Check the query's current results to see what's missing; verify iOS steps on support.apple.com.
3. Write `_src/guides/<slug>.html` (900–1,300 words; answer in the lead; built-in iOS method first;
   one `<!--CTA-->`; FAQ as `<details>`; Sources). Link it from 2–3 related pages and back.
4. Build, validate (OK), commit to main with a clear message, ping IndexNow with the new + changed URLs.
5. Tick the topic in `topics.md` with the date. Refresh the rating/count if it changed.

## Monthly growth review (reads real data, quiet when nothing changed)
- Google Search Console (`sc-domain:habitforever.app`): queries, positions, pages with impressions
  but low CTR → rewrite title/description; queries without a page → add to topics.md.
- Bing Webmaster: same; retry any pending verification/sitemap.
- App Store Connect → App Analytics → Sources → Web referrers and Campaigns (`ct=web-*`).
- RevenueCat: Pro conversions for the same period. Note confounders (price changes, releases, ads).
- Record the result under "Growth records" below with the date.

## Baseline
- 2026-10-22: site launched. App Store rating 5.0 from 4 ratings (US). No web traffic yet.
  Record downloads and Pro conversions for the 28 days before launch at the first review.

## Growth records
(dated entries)
