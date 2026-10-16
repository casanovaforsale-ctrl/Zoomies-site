# zoomies.casanovanjpa.com

The Zephyr Zoomie Zone: dog gear sold through TikTok Shop.

- `src/` holds the page bodies and `_layout.html` (header, footer, SEO tags and store structured data).
- `static/` holds CSS, JavaScript, images, self-hosted fonts, `CNAME` and `robots.txt`.
- Run `python3 tools/build.py`. It writes `docs/`, which GitHub Pages serves (Settings → Pages → Deploy from a branch → `main` / `/docs`), and `preview/` (git-ignored) for opening from disk.
- `formspreeId` in `static/assets/js/site.js`: paste a Formspree form ID to have the contact form email you. While empty, the form opens the visitor's email app.
- DNS: CNAME `zoomies` → `casanovaforsale-ctrl.github.io`.
