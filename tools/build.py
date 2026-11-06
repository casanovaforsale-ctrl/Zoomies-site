#!/usr/bin/env python3
"""Small static-site builder shared by Nick's single-page sites.

  src/_layout.html   the page shell, with {{title}} {{description}} {{canonical}}
                     {{og_image}} {{body}} {{year}} and {{root}} placeholders
  src/*.html         page bodies, each starting with <!--meta {"path": "", ...} -->
  static/            copied as-is (images, css, js, CNAME, robots.txt)

Writes docs/ (served by GitHub Pages from main /docs) and preview/ (links
rewritten to index.html so the site can be opened straight from disk).
Run from the site folder: python3 tools/build.py
"""
import datetime, html, json, re, shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
SRC, STATIC = HERE / "src", HERE / "static"
SITE = json.loads((HERE / "site.json").read_text(encoding="utf-8"))

# The shop list lives in products.json so that adding or removing a product is a
# data change, never hand-edited HTML. {{products}} in a page body becomes the
# cards and {{products_ld}} the matching schema.org ItemList.
PRODUCTS_FILE = HERE / "products.json"
# TikTok answers the older shop.tiktok.com/view/product/{id} form with a
# "Security Check" puzzle page instead of the product (checked 2026-11-06 on
# desktop and iPhone, with and without region parameters). This form redirects
# to the full product page.
PRODUCT_URL = "https://www.tiktok.com/shop/pdp/{id}"
LOW_STOCK = 25
TILTS = ("-2.5deg", "1.8deg", "-1.2deg", "2.4deg", "-1.8deg", "1.2deg", "-2.2deg", "1.6deg")


def load_products():
    if not PRODUCTS_FILE.exists():
        return []
    data = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8"))
    items = []
    for p in data.get("products", []):
        pid = str(p.get("id", "")).strip()
        if not pid.isdigit():
            raise SystemExit(f"products.json: bad TikTok product id {pid!r}")
        if p.get("hidden"):
            continue
        items.append({
            "id": pid,
            "title": str(p["title"]).strip(),
            "alt": str(p.get("alt") or p["title"]).strip(),
            "price": f"{float(p['price']):.2f}",
            "stock": int(p.get("stock", 0) or 0),
            "image": p.get("image") or f"assets/img/shop/{pid}.webp",
            "url": p.get("url") or PRODUCT_URL.format(id=pid),
        })
    return items


def product_cards(items):
    esc = lambda s: html.escape(s, quote=True)
    out = []
    for i, p in enumerate(items):
        flag = ""
        if 0 < p["stock"] <= LOW_STOCK:
            flag = f'\n        <span class="card-flag">Only {p["stock"]} left</span>'
        out.append(
            f'      <a class="card" href="{esc(p["url"])}" target="_blank" rel="noopener" '
            f'style="--r:{TILTS[i % len(TILTS)]}" data-product="{p["id"]}">\n'
            f'        <span class="card-no">{i + 1:02d}</span>\n'
            f'        <span class="card-img"><img src="{{{{root}}}}{esc(p["image"])}" width="600" height="600" '
            f'alt="{esc(p["alt"])}" loading="lazy"></span>\n'
            f'        <span class="card-title">{esc(p["title"])}</span>\n'
            f'        <span class="card-price">${p["price"]}</span>{flag}\n'
            f'      </a>')
    return "\n".join(out)


def products_ld(items):
    if not items:
        return ""
    data = {
        "@context": "https://schema.org", "@type": "ItemList",
        "itemListElement": [{
            "@type": "ListItem", "position": i + 1,
            "item": {
                "@type": "Product", "name": p["title"], "image": SITE["url"] + p["image"],
                "sku": p["id"],
                "offers": {"@type": "Offer", "price": p["price"], "priceCurrency": "USD",
                           "availability": "https://schema.org/" + ("InStock" if p["stock"] > 0 else "OutOfStock"),
                           "url": p["url"]},
            },
        } for i, p in enumerate(items)],
    }
    return '<script type="application/ld+json">' + json.dumps(data, separators=(",", ":")).replace("</", "<\\/") + "</script>"


def resolve(html, depth, preview, absolute=False):
    root = "/" if (absolute and not preview) else "../" * depth
    def link(m):
        target, frag = m.group(1), ""
        if "#" in target:
            target, frag = target.split("#", 1)
            frag = "#" + frag
        dest = root + target + ("index.html" if preview else "")
        return (dest or "./") + frag
    html = re.sub(r"\{\{link:([^}]*)\}\}", link, html)
    return html.replace("{{root}}", root)


def main():
    shell = (SRC / "_layout.html").read_text(encoding="utf-8")
    pages = []
    for f in sorted(SRC.glob("*.html")):
        if f.name.startswith("_"):
            continue
        raw = f.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->", raw, re.S)
        if not m:
            raise SystemExit(f"{f.name}: missing <!--meta {{...}} --> block")
        body = raw[m.end():]
        if "{{products}}" in body or "{{products_ld}}" in body:
            items = load_products()
            body = body.replace("{{products}}", product_cards(items)).replace("{{products_ld}}", products_ld(items))
        pages.append((json.loads(m.group(1)), body))
    for out_name, preview in (("docs", False), ("preview", True)):
        out = HERE / out_name
        if out.exists():
            shutil.rmtree(out)
        shutil.copytree(STATIC, out)
        for meta, body in pages:
            path = meta["path"]
            depth = path.count("/")
            html = shell
            for k, v in {
                "title": meta["title"], "description": meta["description"],
                "canonical": SITE["url"] + path, "og_image": SITE["url"] + SITE["og_image"],
                "robots": "noindex" if meta.get("noindex") else "index, follow, max-image-preview:large",
                "body": body, "year": str(datetime.date.today().year),
            }.items():
                html = html.replace("{{" + k + "}}", v)
            dest = out / path / "index.html" if path else out / "index.html"
            if meta.get("file"):
                dest = out / meta["file"]
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(resolve(html, 0 if meta.get("file") else depth, preview, bool(meta.get("file"))), encoding="utf-8")
        urls = "".join(f"  <url><loc>{SITE['url']}{m['path']}</loc></url>\n" for m, _ in pages if not m.get("noindex") and not m.get("file"))
        (out / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding="utf-8")
        if preview:
            for extra in ("CNAME", ".nojekyll"):
                (out / extra).unlink(missing_ok=True)
    print("built", len(pages), "pages")


if __name__ == "__main__":
    main()
