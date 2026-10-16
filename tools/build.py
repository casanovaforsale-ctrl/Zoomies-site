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
import datetime, json, re, shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
SRC, STATIC = HERE / "src", HERE / "static"
SITE = json.loads((HERE / "site.json").read_text(encoding="utf-8"))


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
        pages.append((json.loads(m.group(1)), raw[m.end():]))
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
