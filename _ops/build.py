#!/usr/bin/env python3
"""Build the Habit Forever website from _src/ fragments.

Each fragment in _src/**.html starts with a metadata comment:
    <!--
    title: ≤ 60 chars          description: ≤ 155 chars
    h1: page heading           lead: one or two sentences under the h1
    layout: article (default for guides/compare) | page | home | tool | bare
    updated: YYYY-MM-DD        (defaults to UPDATED)
    noindex: yes               (404 only)
    scripts: assets/x.js       (optional, space separated)
    -->
and may contain <!--CTA--> (App Store call to action) and <!--FACTS--> (the fact block).
FAQ = <details><summary>Q</summary><p>A</p></details>; it becomes FAQPage JSON-LD.

Writes the HTML next to _src (site root), plus sitemap.xml, llms.txt, llms-full.txt, robots.txt.
App Store links use Apple's campaign format with one ct tag per page. Run: python3 _ops/build.py
"""
import datetime, html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_src"
BASE = "https://habitforever.app/"
APP_ID, PROVIDER = "6751973572", "127826363"
STORE_URL = f"https://apps.apple.com/app/id{APP_ID}"
NAME = "Habit Forever"
STORE_NAME = "Habit Forever: Streak Tracker"
FORMER_NAME = "Habit Streak Tracker: Routines"
AUTHOR = "Mohamed Elatabany"
UPDATED = "2026-10-22"
CSS_VERSION = 1
RATING, RATING_COUNT = "5.0", 4

FACT_BLOCK = (
    "Habit Forever is a habit tracker for iPhone and iPad (iOS 17 or later) by independent developer "
    "Mohamed Elatabany. Track check-off or number habits with goals, reminders, notes, streaks and colorful "
    "day-by-day grids, plus Home Screen and Lock Screen widgets and Siri Shortcuts. There is no account, and "
    "habit data stays on your device. It is free for up to three habits; Habit Forever Pro (yearly, monthly or "
    "a one-time lifetime purchase) adds unlimited habits, deeper insights, widgets for every habit and backup "
    f"export/import. It is rated {RATING}★ on the App Store, from {RATING_COUNT} ratings, where it is listed as "
    f"“{STORE_NAME}” (formerly “{FORMER_NAME}”)."
)

SECTIONS = {"guides": "Guides", "compare": "Compare", "tools": "Tools"}
NAV = [("guides/index.html", "Guides"), ("tools/index.html", "Tools"), ("compare/index.html", "Compare"),
       ("about.html", "About")]


def campaign(tag):
    return f"https://apps.apple.com/app/apple-store/id{APP_ID}?pt={PROVIDER}&amp;ct={tag[:40]}&amp;mt=8"


def tag_for(rel):
    stem = rel[:-5]
    if stem == "index": return "web-home"
    folder, _, slug = stem.rpartition("/")
    if slug == "index": return f"web-{folder}"
    return f"web-{ {'guides': 'g', 'compare': 'c', 'tools': 't'}.get(folder, 'p') }-{slug}"


def parse(path):
    raw = path.read_text()
    m = re.match(r"\s*<!--(.*?)-->\s*", raw, re.S)
    meta = {}
    for line in m.group(1).strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1); meta[k.strip()] = v.strip()
    return meta, raw[m.end():]


CATALOG = {}  # rel -> meta, filled before rendering


def listing(folder, prefix):
    kick = {"guides": "Guide", "compare": "Compare", "tools": "Tool"}[folder]
    items = [(rel, m) for rel, m in sorted(CATALOG.items())
             if rel.startswith(folder + "/") and not rel.endswith("index.html")]
    return '<ul class="cards">' + "".join(
        f'<li><span class="kicker">{kick}</span><a href="{prefix}{rel}">{m.get("h1", m["title"])}</a>'
        f'<p>{m.get("description", "")}</p></li>' for rel, m in items) + "</ul>"


def stars():
    return '<span class="stars" aria-hidden="true">★★★★★</span>'


def rating_line():
    return (f'<p class="rating">{stars()} <strong>{RATING}</strong> on the App Store · rated by '
            f'{RATING_COUNT} users</p>')


def cta(prefix, tag, heading="Try Habit Forever", text=None):
    text = text or ("Free for up to three habits. No account — your habits stay on your iPhone.")
    return f'''<aside class="cta" aria-label="Download Habit Forever">
  <img src="{prefix}assets/icon-96.png" width="64" height="64" alt="Habit Forever app icon" class="cta-icon">
  <div class="cta-body">
    <p class="cta-title">{heading}</p>
    <p class="cta-text">{text}</p>
    {rating_line()}
  </div>
  <a class="badge-link" href="{campaign(tag)}"><img src="{prefix}assets/app-store-badge.svg" width="150" height="50" alt="Download on the App Store"></a>
</aside>'''


def facts_box():
    return f'''<section class="facts" aria-labelledby="facts-h">
  <h2 id="facts-h">About Habit Forever</h2>
  <p>{FACT_BLOCK}</p>
</section>'''


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def toc_and_ids(body):
    items = []
    def fix(m):
        attrs, inner = m.group(1), m.group(2)
        hid = re.search(r'id="([^"]+)"', attrs)
        hid = hid.group(1) if hid else slugify(re.sub(r"<[^>]+>", "", inner))
        if 'id="' not in attrs: attrs += f' id="{hid}"'
        items.append((hid, re.sub(r"<[^>]+>", "", inner)))
        return f"<h2{attrs}>{inner}</h2>"
    body = re.sub(r"<h2([^>]*)>(.*?)</h2>", fix, body, flags=re.S)
    return body, items


def faq_items(body):
    out = []
    for q, a in re.findall(r"<details[^>]*>\s*<summary>(.*?)</summary>(.*?)</details>", body, re.S):
        out.append((re.sub(r"<[^>]+>", "", q).strip(), " ".join(re.sub(r"<[^>]+>", " ", a).split())))
    return out


def plain(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s))


def human_date(iso):
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%B %Y")


def page(rel, meta, body):
    depth = rel.count("/")
    prefix = "/" if rel == "404.html" else "../" * depth
    url = BASE + ("" if rel == "index.html" else rel.removesuffix("index.html") if rel.endswith("/index.html") else rel)
    folder = rel.split("/")[0] if depth else ""
    layout = meta.get("layout") or ("article" if folder in ("guides", "compare") else "page")
    updated = meta.get("updated", UPDATED)
    tag = tag_for(rel)
    title, desc, h1 = meta["title"], meta["description"], meta.get("h1", meta["title"])
    noindex = meta.get("noindex") == "yes"

    body = re.sub(r"\{\{LIST:(\w+)\}\}", lambda m: listing(m.group(1), prefix), body)
    body = body.replace("<!--FACTS-->", facts_box())
    body = re.sub(r"<!--CTA(?::([^>]*))?-->", lambda m: cta(prefix, tag, *(m.group(1).split("|") if m.group(1) else [])), body)
    body = body.replace("{{RATING_LINE}}", rating_line()).replace("{{CAMPAIGN}}", campaign(tag)).replace("{{P}}", prefix)
    body, toc = toc_and_ids(body)
    faqs = faq_items(body)

    graph = [{"@type": "Person", "@id": BASE + "about.html#author", "name": AUTHOR, "url": BASE + "about.html",
              "jobTitle": "Independent iOS developer"}]
    app_node = {
        "@type": "MobileApplication", "@id": BASE + "#app", "name": NAME, "alternateName": [STORE_NAME, FORMER_NAME],
        "description": "Habit tracker for iPhone and iPad: check-off or number habits, goals, reminders, notes, "
                       "streaks, colorful day-by-day grids and widgets. No account; data stays on your device.",
        "operatingSystem": "iOS 17.0 or later", "applicationCategory": "LifestyleApplication",
        "applicationSubCategory": "Habit tracker", "url": BASE, "downloadUrl": STORE_URL, "installUrl": STORE_URL,
        "image": BASE + "assets/icon-512.png",
        "screenshot": [BASE + f"assets/screen-{s}.webp" for s in ("today", "board", "log", "detail", "progress")],
        "inLanguage": "en", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "aggregateRating": {"@type": "AggregateRating", "ratingValue": RATING, "ratingCount": str(RATING_COUNT),
                            "bestRating": "5", "worstRating": "1"},
        "author": {"@id": BASE + "about.html#author"}, "publisher": {"@id": BASE + "about.html#author"},
        "sameAs": [STORE_URL]}
    if rel == "index.html":
        graph += [app_node, {"@type": "WebSite", "@id": BASE + "#website", "name": NAME, "url": BASE,
                             "inLanguage": "en", "publisher": {"@id": BASE + "about.html#author"}}]
    if layout == "article":
        graph.append({"@type": "Article", "headline": h1, "description": desc, "url": url,
                      "image": BASE + "assets/og.png", "datePublished": meta.get("published", UPDATED),
                      "dateModified": updated, "inLanguage": "en", "author": {"@id": BASE + "about.html#author"},
                      "publisher": {"@id": BASE + "about.html#author"}, "mainEntityOfPage": url,
                      "about": {"@type": "Thing", "name": "Habit tracking"}})
    if layout == "tool":
        graph.append({"@type": "WebApplication", "name": h1, "url": url, "description": desc,
                      "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any (web browser)",
                      "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                      "author": {"@id": BASE + "about.html#author"}})
    if faqs:
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]})
    crumbs = [("Home", BASE)]
    if folder in SECTIONS:
        crumbs.append((SECTIONS[folder], BASE + folder + "/"))
    if rel != "index.html" and not rel.endswith("/index.html"):
        crumbs.append((plain(h1), url))
    elif rel.endswith("/index.html"):
        crumbs[-1] = (SECTIONS[folder], url)
    if len(crumbs) > 1:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]})
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)

    crumb_html = ""
    if len(crumbs) > 1:
        parts = []
        for i, (n, u) in enumerate(crumbs):
            href = prefix + (u[len(BASE):] or "index.html")
            if href.endswith("/"): href += "index.html"
            parts.append(f'<a href="{href}">{html.escape(n)}</a>' if i < len(crumbs) - 1 else f'<span aria-current="page">{html.escape(n)}</span>')
        crumb_html = '<nav class="crumbs" aria-label="Breadcrumb">' + ' <span aria-hidden="true">/</span> '.join(parts) + "</nav>"

    nav = "".join(f'<a href="{prefix}{h}">{t}</a>' for h, t in NAV)
    header = f'''<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="{prefix}index.html"><img src="{prefix}assets/icon-96.png" width="32" height="32" alt=""><span>Habit Forever</span></a>
    <nav class="main-nav" aria-label="Main">{nav}</nav>
    <a class="badge-link header-badge" href="{campaign(tag)}"><img src="{prefix}assets/app-store-badge.svg" width="120" height="40" alt="Download on the App Store"></a>
  </div>
</header>'''
    footer = f'''<footer class="site-footer">
  <div class="wrap">
    <div class="footer-cta">
      <img src="{prefix}assets/icon-96.png" width="48" height="48" alt="Habit Forever app icon">
      <p><strong>Habit Forever</strong> — small habits, every day, in color.</p>
      <a class="badge-link" href="{campaign(tag)}"><img src="{prefix}assets/app-store-badge.svg" width="135" height="45" alt="Download on the App Store"></a>
    </div>
    <nav class="footer-links" aria-label="Footer">
      <a href="{prefix}guides/index.html">Guides</a><a href="{prefix}tools/index.html">Tools</a>
      <a href="{prefix}compare/index.html">Compare</a><a href="{prefix}about.html">About</a>
      <a href="{prefix}support.html">Support</a><a href="{prefix}privacy.html">Privacy</a><a href="{prefix}terms.html">Terms</a>
    </nav>
    <p class="fine">© 2026 Mohamed Elatabany. Apple, the Apple logo, iPhone and iPad are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc.</p>
  </div>
</footer>'''

    if layout == "article":
        toc_html = ""
        if len(toc) >= 3:
            toc_html = '<nav class="toc" aria-label="On this page"><p class="toc-title">On this page</p><ol>' + "".join(
                f'<li><a href="#{i}">{html.escape(plain(t))}</a></li>' for i, t in toc) + "</ol></nav>"
        main = f'''<main id="main" class="wrap article">
  {crumb_html}
  <article>
    <h1>{h1}</h1>
    <p class="lead">{meta.get("lead", "")}</p>
    <p class="byline">By <a href="{prefix}about.html" rel="author">{AUTHOR}</a>, maker of Habit Forever · Updated <time datetime="{updated}">{human_date(updated)}</time></p>
    {toc_html}
    {body}
    {cta(prefix, tag, "Track it in Habit Forever")}
    {facts_box()}
    <p class="correction">Spotted something out of date or wrong? <a href="{prefix}support.html">Tell me</a> and I’ll fix it.</p>
  </article>
</main>'''
    elif layout in ("page", "tool"):
        main = f'''<main id="main" class="wrap page {layout}">
  {crumb_html}
  <h1>{h1}</h1>
  {f'<p class="lead">{meta["lead"]}</p>' if meta.get("lead") else ""}
  {body}
</main>'''
    else:  # home / bare
        main = f'<main id="main">{body}</main>'

    scripts = "".join(f'<script src="{prefix}{s}" defer></script>' for s in meta.get("scripts", "").split())
    robots = "noindex, follow" if noindex else "index, follow, max-image-preview:large"
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    canonical = "" if noindex else f'<link rel="canonical" href="{url}">'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
{canonical}
<meta name="robots" content="{robots}">
<meta name="apple-itunes-app" content="app-id={APP_ID}">
<meta name="theme-color" content="#F8F4EE" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#171412" media="(prefers-color-scheme: dark)">
<meta name="author" content="{AUTHOR}">
<meta property="og:type" content="{'article' if layout == 'article' else 'website'}">
<meta property="og:site_name" content="Habit Forever">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Habit Forever app icon beside rows of colorful habit squares">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{BASE}assets/og.png">
<link rel="icon" type="image/png" sizes="32x32" href="{prefix}assets/favicon-32.png">
<link rel="apple-touch-icon" href="{prefix}assets/apple-touch-icon.png">
<link rel="stylesheet" href="{prefix}assets/style.css?v={CSS_VERSION}">
<script type="application/ld+json">{ld}</script>
{scripts}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{header}
{main}
{footer}
</body>
</html>
''', url, title, desc, plain(meta.get("lead", "")), noindex, updated, body


def text_of(fragment):
    s = re.sub(r"<(script|style|aside)[^>]*>.*?</\1>", " ", fragment, flags=re.S)
    s = re.sub(r"<h2[^>]*>(.*?)</h2>", r"\n\n## \1\n", s, flags=re.S)
    s = re.sub(r"<h3[^>]*>(.*?)</h3>", r"\n\n### \1\n", s, flags=re.S)
    s = re.sub(r"<li[^>]*>", "\n- ", s)
    s = re.sub(r"</(p|tr|summary|details|table|ul|ol)>", "\n", s)
    s = re.sub(r"<t[dh][^>]*>", " | ", s)
    s = html.unescape(re.sub(r"<[^>]+>", "", s))
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", s)).strip()


def main():
    built = []
    for src in sorted(SRC.rglob("*.html")):
        CATALOG[src.relative_to(SRC).as_posix()] = parse(src)[0]
    for src in sorted(SRC.rglob("*.html")):
        rel = src.relative_to(SRC).as_posix()
        meta, body = parse(src)
        out, url, title, desc, lead, noindex, updated, final_body = page(rel, meta, body)
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(out)
        if not noindex:
            built.append((rel, url, title, desc, lead, updated, final_body, meta))

    order = {"index.html": 0}
    built.sort(key=lambda b: (order.get(b[0], 1), b[0]))
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for rel, url, *_rest in built:
        sm.append(f"  <url><loc>{url}</loc><lastmod>{_rest[3]}</lastmod></url>")
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n")

    def group(prefix):
        return [b for b in built if b[0].startswith(prefix) and not b[0].endswith("index.html")]
    others = [b for b in built if "/" not in b[0] and b[0] != "index.html"]
    llms = [f"# {NAME}", "", f"> {FACT_BLOCK}", "",
            f"- App Store: {STORE_URL}", f"- Website: {BASE}", f"- Developer: {AUTHOR} ({BASE}about.html)",
            "- Support: atabany.apps@gmail.com", ""]
    for head, items in (("Guides", group("guides/")), ("Comparisons", group("compare/")), ("Tools", group("tools/")),
                        ("About and policies", others)):
        llms.append(f"## {head}")
        llms += [f"- [{plain(b[2])}]({b[1]}): {b[3]}" for b in items]
        llms.append("")
    (ROOT / "llms.txt").write_text("\n".join(llms))
    full = [f"# {NAME} — full text", "", FACT_BLOCK, ""]
    for rel, url, title, desc, lead, updated, body, meta in built:
        full += [f"---\n\n# {plain(meta.get('h1', title))}", f"URL: {url}", f"Updated: {updated}", "", lead, "",
                 text_of(body), ""]
    (ROOT / "llms-full.txt").write_text("\n".join(full))

    bots = ["*", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User",
            "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended", "Bingbot",
            "DuckAssistBot", "MistralAI-User"]
    (ROOT / "robots.txt").write_text("\n".join(f"User-agent: {b}\nAllow: /\n" for b in bots)
                                     + f"\nSitemap: {BASE}sitemap.xml\n")
    print(f"built {len(built)} indexable pages")


if __name__ == "__main__":
    main()
